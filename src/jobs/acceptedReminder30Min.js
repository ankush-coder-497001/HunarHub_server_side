const cron = require('node-cron');
const Booking = require('../models/booking.model');
const EmailService = require('../services/email.svc')

//this job runs every minute to check for accepted bookings that are 30 minutes away and sends a reminder email to the worker
//it also updates the booking to prevent duplicate reminders
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 30 * 60 * 1000);
    const windowEnd = new Date(windowStart.getTime() + 60 * 1000);

    const bookings = await Booking.find({ status: 'accepted', acceptedReminder30Min: false }).populate({
      path: 'worker',
      select: 'user',
      populate: {
        path: 'user',
        select: 'name email phone'
      }
    }).populate('customer', 'name email phone')
      .populate('serviceDetails.service', 'name');

    bookings.forEach(async booking => {
      const [h, m] = booking.time.split(':');
      const bookingTime = new Date(booking.date);
      bookingTime.setHours(+h, +m, 0, 0);

      if (bookingTime >= windowStart && bookingTime < windowEnd) {
        booking.acceptedReminder30Min = true;
        booking.save().catch(err => console.error(`Failed to update booking ${booking.jobCode}:`, err));
        await EmailService.sendThirtyMinBeforeReminderEmail(
          booking.worker.user.email,
          {
            name: booking.worker.user.name,
            service: booking.serviceDetails.service.name,
            date: booking.date.toISOString().split('T')[0],
            time: booking.time,
            location: booking.location.address || 'Not specified',
            phone: booking.customer.phone || 'Not provided',
          }
        ).catch((error) => console.error(`Error sending email to worker ${booking.worker.user.email}:`, error));
      }
    });
  }
  catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Accepted reminder job failed:`, error);
  }
});
