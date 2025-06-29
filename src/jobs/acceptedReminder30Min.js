const cron = require('node-cron');
const Booking = require('../models/booking.model');
const EmailService = require('../services/email.svc');

let isRunning = false;
//this cron job will run every minute to send reminders for accepted bookings 30 minutes before the scheduled time
// It will send reminders only once per booking
// It checks for bookings that are accepted and have not yet sent the 30-min reminder
// It sends an email to the worker assigned to the booking
//it also send a push notification to the worker's device
cron.schedule('* * * * *', async () => {
  if (isRunning) {
    console.warn(`[${new Date().toISOString()}] Skipping 30-min reminder cron: Previous job still running.`);
    return;
  }

  isRunning = true;
  console.log(`[${new Date().toISOString()}] ✅ 30-min reminder cron started`);

  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
    const windowEnd = new Date(windowStart.getTime() + 60 * 1000); // +1 minute window

    const bookings = await Booking.find({
      status: 'accepted',
      acceptedReminder30Min: false
    }).populate({
      path: 'worker',
      select: 'user',
      populate: {
        path: 'user',
        select: 'name email phone'
      }
    }).populate('customer', 'name email phone')
      .populate('serviceDetails.service', 'name');

    console.log(`[${new Date().toISOString()}] Found ${bookings.length} pending bookings for 30-min reminder.`);

    for (const booking of bookings) {
      try {
        const [h, m] = booking.time.split(':');
        const bookingTime = new Date(booking.date);
        bookingTime.setHours(+h, +m, 0, 0);

        if (bookingTime >= windowStart && bookingTime < windowEnd) {
          booking.acceptedReminder30Min = true;
          await booking.save();

          console.log(`Sending 30-min reminder email to ${booking.worker.user.email} for booking ${booking.jobCode}`);

          await EmailService.sendThirtyMinBeforeReminderEmail(
            booking.worker.user.email,
            {
              name: booking.worker.user.name,
              service: booking.serviceDetails.service.name,
              date: booking.date.toISOString().split('T')[0],
              time: booking.time,
              location: booking.location?.address || 'Not specified',
              phone: booking.customer?.phone || 'Not provided',
            }
          ).catch(emailError => {
            console.error(`[${new Date().toISOString()}] Error sending 30-min reminder email for booking ${booking.jobCode}:`, emailError);
          });

          // Send push notification to worker
          await sendPushNotification(booking.worker.user.id, {
            title: '30-Min Reminder',
            body: `Your booking from ${booking.customer.name} is in 30 minutes. Be Ready!`,
          }).catch(pushError => {
            console.error(`[${new Date().toISOString()}] Error sending push notification for booking ${booking.jobCode}:`, pushError);
          });
          console.log(`✅ 30-min reminder email sent and booking updated for job ${booking.jobCode}`);
        }
      } catch (bookingError) {
        console.error(`[${new Date().toISOString()}] Error processing 30-min reminder for booking ${booking.jobCode}:`, bookingError);
      }
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ 30-min reminder cron job failed:`, error);
  } finally {
    isRunning = false;
    console.log(`[${new Date().toISOString()}] ✅ 30-min reminder cron job finished`);
  }
});

module.exports = cron;
