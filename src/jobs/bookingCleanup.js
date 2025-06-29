const cron = require('node-cron');
const Booking = require('../models/booking.model');

let isRunning = false;
//this cron job will run every hour to delete stale bookings
// It will delete bookings that are in 'requested' status and older than 24 hours
cron.schedule('0 * * * *', async () => {  // Runs at the start of every hour
  if (isRunning) {
    console.warn(`[${new Date().toISOString()}] Skipping booking cleanup cron: Previous job still running.`);
    return;
  }

  isRunning = true;
  console.log(`[${new Date().toISOString()}] ✅ Booking cleanup cron started`);

  const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  try {
    const result = await Booking.deleteMany({
      status: 'requested',
      createdAt: { $lte: cutoffTime }
    });

    if (result.deletedCount > 0) {
      console.log(`[${new Date().toISOString()}] ✅ Auto-deleted ${result.deletedCount} stale 'requested' bookings older than 24 hours.`);
    } else {
      console.log(`[${new Date().toISOString()}] ✅ No stale bookings found for cleanup.`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Booking cleanup cron failed:`, error);
  } finally {
    isRunning = false;
    console.log(`[${new Date().toISOString()}] ✅ Booking cleanup cron finished`);
  }
});

module.exports = cron;
