const cron = require('node-cron');
const Booking = require('../models/booking.model');
const EmailService = require('../services/email.svc');
const sendPushNotification = require('../services/Message.svc');

let isRunning = false;
//this cron job checks for bookings that are overdue by more than 3 hours and auto-cancels them
//it also sends an email to the worker notifying them of the cancellation
cron.schedule('* * * * *', async () => {
  if (isRunning) {
    console.warn(`[${new Date().toISOString()}] Skipping auto-cancel cron: Previous job still running.`);
    return;
  }

  isRunning = true;
  console.log(`[${new Date().toISOString()}] ✅ Auto-cancel overdue bookings cron started`);

  const now = new Date();

  try {
    const bookings = await Booking.find({
      status: 'accepted',
      overdueRequestedReminder: false,
    }).populate({
      path: 'worker',
      select: 'user',
      populate: {
        path: 'user',
        select: 'name email phone'
      }
    }).populate('customer', 'name email phone')
      .populate('serviceDetails.service', 'name');

    console.log(`[${new Date().toISOString()}] Found ${bookings.length} bookings to check for auto-cancel.`);

    for (const booking of bookings) {
      try {
        const [h, m] = booking.time.split(':');
        const bookingDateTime = new Date(booking.date);
        bookingDateTime.setHours(+h, +m, 0, 0);

        const hoursPassed = (now - bookingDateTime) / (1000 * 60 * 60); // Convert ms to hours

        if (hoursPassed >= 3) {
          booking.status = 'cancelled';
          booking.overdueRequestedReminder = true;
          await booking.save();

          console.log(`Auto-cancelled booking ${booking.jobCode} for worker ${booking.worker.user.email}`);

          await EmailService.sendAutoCancelledBookingEmail(
            booking.worker.user.email,
            {
              name: booking.worker.user.name,
              service: booking.serviceDetails.service.name,
              date: booking.date.toISOString().split('T')[0],
              time: booking.time,
              location: booking.location?.address || 'Not specified',
            }
          ).catch(emailError => {
            console.error(`[${new Date().toISOString()}] Error sending email for booking ${booking.jobCode}:`, emailError);
          });
          await sendPushNotification(booking.worker.user.id, {
            title: 'Booking Auto-Cancelled',
            body: `Your booking from ${booking.customer.name} has been auto-cancelled due to inactivity.`,
          }).catch(pushError => {
            console.error(`[${new Date().toISOString()}] Error sending push notification for booking ${booking.jobCode}:`, pushError);
          });
          console.log(`✅ Email sent for auto-cancelled booking ${booking.jobCode}`);
        }
      } catch (bookingError) {
        console.error(`[${new Date().toISOString()}] Error processing booking ${booking.jobCode}:`, bookingError);
      }
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Auto-cancel cron job failed:`, error);
  } finally {
    isRunning = false;
    console.log(`[${new Date().toISOString()}] ✅ Auto-cancel cron job finished`);
  }
});

module.exports = cron;
