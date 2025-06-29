const cron = require('node-cron');
const Booking = require('../models/booking.model');
const EmailService = require('../services/email.svc');
const sendPushNotification = require('../services/Message.svc');

let isRunning = false;

cron.schedule('* * * * *', async () => {
  if (isRunning) {
    console.warn(`[${new Date().toISOString()}] Skipping cron execution: Previous job still running.`);
    return;
  }

  isRunning = true;
  console.log(`[${new Date().toISOString()}] ✅ Accepted reminder cron started`);

  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const windowEnd = new Date(windowStart.getTime() + 60 * 1000); // 1 hour to 1 hour + 1 min

    const bookings = await Booking.find({
      status: 'accepted',
      acceptedReminder1Hour: false
    }).populate({
      path: 'worker',
      select: 'user',
      populate: {
        path: 'user',
        select: 'name email phone'
      }
    }).populate('customer', 'name email phone')
      .populate('serviceDetails.service', 'name');

    console.log(`[${new Date().toISOString()}] Found ${bookings.length} pending bookings to check.`);

    for (const booking of bookings) {
      try {
        const [h, m] = booking.time.split(':');
        const bookingTime = new Date(booking.date);
        bookingTime.setHours(+h, +m, 0, 0);

        if (bookingTime >= windowStart && bookingTime < windowEnd) {
          booking.acceptedReminder1Hour = true;
          await booking.save();

          console.log(`Sending email to ${booking.worker.user.email} for booking ${booking.jobCode}`);

          await EmailService.sendOneHourBeforeReminderEmail(
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
            console.error(`[${new Date().toISOString()}] Error sending email for booking ${booking.jobCode}:`, emailError);
          });
          await sendPushNotification(booking.worker.user.id, {
            title: 'Booking Reminder',
            body: `Your booking from ${booking.customer.name} is in 1 hour. Be ready!`,
          }).catch(pushError => {
            console.error(`[${new Date().toISOString()}] Error sending push notification for booking ${booking.jobCode}:`, pushError);
          });

          console.log(`✅ Email sent and booking updated for job ${booking.jobCode}`);
        }
      } catch (bookingError) {
        console.error(`[${new Date().toISOString()}] Error processing booking ${booking.jobCode}:`, bookingError);
      }
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error in accepted reminder cron:`, error);
  } finally {
    isRunning = false;
    console.log(`[${new Date().toISOString()}] ✅ Cron job finished`);
  }
});

module.exports = cron;
