// jobs/bookingCleanup.js
const cron = require('node-cron');
const Booking = require('../models/booking.model')


// 🕒 Run every hour at minute 0
cron.schedule('0 * * * *', async () => {
  const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  try {
    const result = await Booking.deleteMany({
      status: 'requested',
      createdAt: { $lte: cutoffTime }
    });

    if (result.deletedCount > 0) {
      console.log(`[${new Date().toISOString()}] ✅ Auto-deleted ${result.deletedCount} stale bookings.`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Booking cleanup failed:`, error);
  }
});
