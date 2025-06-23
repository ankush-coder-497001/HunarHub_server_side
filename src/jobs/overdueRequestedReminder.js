const cron = require('node-cron');
const Booking = require('../models/booking.model');
const EmailService = require('../services/email.svc')


//this job runs every minute to check for bookings that are overdue by more than 3 hours and automatically cancels them
//it also sends an email to the worker notifying them of the cancellation
cron.schedule('* * * * *', async () => {
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

    bookings.forEach(async (booking) => {
      const [h, m] = booking.time.split(':');
      const bookingDateTime = new Date(booking.date);
      bookingDateTime.setHours(+h, +m, 0, 0);

      const hoursPassed = (now - bookingDateTime) / (1000 * 60 * 60); // in hours

      if (hoursPassed >= 3) {
        booking.status = 'cancelled';
        booking.overdueRequestedReminder = true;
        await booking.save();
        await EmailService.sendAutoCancelledBookingEmail(
          booking.worker.user.email,
          {
            name: booking.worker.user.name,
            service: booking.serviceDetails.service.name,
            date: booking.date.toISOString().split('T')[0],
            time: booking.time,
            location: booking.location.address || 'Not specified',
          }
        ).catch((error) => console.error(`Error sending email to worker ${booking.worker.user.email}:`, error));
      }
    });

  } catch (error) {
    console.error(`[${now.toISOString()}] ❌ Auto-cancel job failed:`, error);
  }
});

module.exports = cron;
