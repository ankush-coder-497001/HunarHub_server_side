const BookingModel = require('../models/booking.model');
const UserModel = require('../models/user.model');
const WorkerModel = require('../models/worker.model');
const ServiceModel = require('../models/service.model');
const chatModel = require('../models/chat.model');

const BookingController = {
  createBooking: async (req, res) => {
    const session = await BookingModel.startSession();
    session.startTransaction();
    try {
      const { userId } = req.user;
      if (!userId) return res.status(400).json({ message: 'User ID is required' });

      const { workerId, serviceDetails, date, time, location, customerNotes, jobCode } = req.body;
      if (!date || !time || !workerId || !serviceDetails || !jobCode) {
        return res.status(400).json({ message: 'Required booking fields are missing' });
      }

      // Validate date
      const [year, month, day] = date.split('-').map(Number);
      const bookingDate = new Date(year, month - 1, day);
      bookingDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(bookingDate.getTime()))
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });

      if (bookingDate < today)
        return res.status(400).json({ message: 'Booking date cannot be in the past' });

      if (bookingDate.getDay() === 0)
        return res.status(400).json({ message: 'Bookings cannot be scheduled on Sundays' });

      // Validate time
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(time))
        return res.status(400).json({ message: 'Invalid time format. Use HH:mm (24h)' });

      const [hours, minutes] = time.split(':').map(Number);
      const bookingHourDecimal = hours + minutes / 60;
      if (bookingHourDecimal < 9 || bookingHourDecimal > 17)
        return res.status(400).json({ message: 'Bookings allowed only between 9 AM and 5 PM' });

      // Fetch customer, worker, service in parallel
      const [customer, worker, service] = await Promise.all([
        UserModel.findById(userId),
        WorkerModel.findById(workerId).populate('user'),
        ServiceModel.findById(serviceDetails.service),
      ]);

      if (!customer) return res.status(404).json({ message: 'Customer not found' });
      if (!worker) return res.status(404).json({ message: 'Worker not found' });
      if (!service) return res.status(404).json({ message: 'Service not found' });

      // Re-check inside the transaction: worker conflict
      const [conflictByCustomer, conflictByWorker] = await Promise.all([
        BookingModel.findOne({
          customer: customer._id,
          worker: worker._id,
          date: bookingDate,
          time,
          'serviceDetails.service': service._id,
          status: { $in: ['accepted', 'requested'] },
        }).session(session),
        BookingModel.findOne({
          worker: worker._id,
          date: bookingDate,
          time,
          status: { $in: ['accepted', 'requested'] },
        }).session(session),
      ]);

      if (conflictByCustomer) {
        await session.abortTransaction();
        return res.status(400).json({
          message: 'You already have a booking with this worker for this service at this time',
        });
      }

      if (conflictByWorker) {
        await session.abortTransaction();
        return res.status(400).json({
          message: 'Worker is already booked at this time slot',
        });
      }

      // Create booking within the transaction
      const booking = await BookingModel.create([{
        customer: customer._id,
        worker: worker._id,
        serviceDetails: {
          service: service._id,
          urgency: serviceDetails.urgency,
          type: serviceDetails.type,
          description: serviceDetails.description,
          duration: serviceDetails.duration,
          price: serviceDetails.price,
        },
        date: bookingDate,
        time,
        location,
        customerNotes,
        jobCode,
      }], { session });

      await session.commitTransaction();
      session.endSession();



      res.status(201).json({ message: 'Booking created successfully', booking: booking[0] });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      // 🔍 Detect specific Mongo error
      if (error.code === 251 || error.codeName === "NoSuchTransaction") {
        return res.status(500).json({
          message: "Booking could not complete. Please try again."
        });
      }

      console.error('Booking error:', error);
      res.status(500).json({ message: 'Server error: ' + error.message });
    }
  },
  getBookingById: async (req, res) => {
    try {
      const { bookingId } = req.params;
      if (!bookingId) {
        return res.status(400).json({ message: 'Booking ID is required' });
      }
      const booking = await BookingModel.findById(bookingId)
        .populate('customer')
        .populate('worker')
        .populate('serviceDetails.service');
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      res.status(200).json({ message: 'Booking retrieved successfully', booking });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  myBookings: async (req, res) => {
    try {
      const { userId } = req.user;
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      const bookings = await BookingModel.find({ customer: userId }).populate({
        path: 'worker',
        select: 'user ProfileImage rating profession',
        populate: {
          path: 'user',
          select: 'name email profileImage',
        }
      })
        .populate('serviceDetails.service').populate('customer', 'name email profileImage').sort({ createdAt: -1 });
      if (!bookings || bookings.length === 0) {
        return res.status(404).json({ message: 'No bookings found' });
      }
      res.status(200).json({ message: 'Bookings retrieved successfully', bookings });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  assignedBookings: async (req, res) => {
    try {
      const { userId } = req.user;
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      const worker = await WorkerModel.findOne({ user: userId });
      if (!worker) {
        return res.status(404).json({ message: 'Worker not found' });
      }
      const bookings = await BookingModel.find({ worker: worker._id })
        .populate('customer')
        .populate('serviceDetails.service').populate('worker', 'name email ProfileImage').sort({ createdAt: -1 });
      if (!bookings || bookings.length === 0) {
        return res.status(404).json({ message: 'No bookings found' });
      }

      res.status(200).json({ message: 'Bookings retrieved successfully', bookings });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  updateBookingStatus: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { status } = req.body;
      console.log('Booking ID:', bookingId);
      console.log('Status:', status);
      if (!bookingId) {
        return res.status(400).json({ message: 'Booking ID is required' });
      }
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }
      const booking = await BookingModel.findById(bookingId).populate('customer').populate('worker').populate('serviceDetails.service');
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      booking.status = status;

      const BookingDataForEMail = {
        name: booking.customer.name,
        service: booking.serviceDetails.service.name,
        date: booking.date,
        time: booking.time,
        location: booking.location,
        customerNotes: booking.customerNotes,
      }
      if (status === 'accepted') {
      } else if (status === 'completed') {
        booking.isActive = false; // Mark booking as inactive if completed
        const chat = await chatModel.findOneAndDelete({ booking: booking._id });
        if (chat) {
          console.log('Chat deleted for completed booking:', booking._id);
        }
      } else if (status === 'cancelled') {
        booking.status = 'cancelled';
        booking.isActive = false; // Mark booking as inactive if cancelled
        await booking.save();
        // await emailServices.BookingCancellationEmail(booking.customer.email, BookingDataForEMail);
        const chat = await chatModel.findOneAndDelete({ booking: booking._id });
        // If a chat exists, delete it

        if (chat) {
          console.log('Chat deleted for cancelled booking:', booking._id);
        }
        return res.status(200).json({ message: 'Booking cancelled successfully' });
      }
      await booking.save();
      res.status(200).json({ message: 'Booking status updated successfully', booking });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  getAllBookings: async (req, res) => {
    try {
      const bookings = await BookingModel.find({ isActive: true })
        .populate('customer')
        .populate('worker')
        .populate('serviceDetails.service');
      if (!bookings || bookings.length === 0) {
        return res.status(404).json({ message: 'No bookings found' });
      }
      res.status(200).json({ message: 'Bookings retrieved successfully', bookings });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  rescheduleBooking: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { newDate, newTime } = req.body;

      if (!bookingId || !newDate || !newTime) {
        return res.status(400).json({ message: 'Booking ID, newDate, and newTime are required' });
      }

      // Validate newTime format
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(newTime)) {
        return res.status(400).json({ message: 'Time must be in HH:MM 24-hour format' });
      }

      // Convert newDate into a Date object
      const parsedDate = new Date(newDate);
      parsedDate.setHours(0, 0, 0, 0);

      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parsedDate < today) {
        return res.status(400).json({ message: 'Cannot reschedule to a past date' });
      }

      const dayOfWeek = parsedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // e.g., "monday"

      if (parsedDate.getDay() === 0 || parsedDate.getDay() === 6) {
        return res.status(400).json({ message: 'Bookings are not allowed on weekends' });
      }

      const booking = await BookingModel.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      if (!['requested', 'accepted'].includes(booking.status)) {
        return res.status(400).json({ message: 'Booking can only be rescheduled if it is requested or accepted' });
      }

      const worker = await WorkerModel.findById(booking.worker);
      if (!worker) {
        return res.status(404).json({ message: 'Worker profile not found' });
      }

      // Check if worker is working on the day
      const todaySchedule = worker.workSchedule.find(s => s.day.toLowerCase() === dayOfWeek);
      if (!todaySchedule) {
        return res.status(400).json({ message: 'Worker is not available on selected day' });
      }

      // Convert slot times to Date objects for comparison
      const [reschedHour, reschedMin] = newTime.split(':').map(Number);
      const reschedTime = new Date(parsedDate);
      reschedTime.setHours(reschedHour, reschedMin, 0, 0);

      const [startH, startM] = todaySchedule.startTime.split(':').map(Number);
      const [endH, endM] = todaySchedule.endTime.split(':').map(Number);
      const start = new Date(parsedDate);
      const end = new Date(parsedDate);
      start.setHours(startH, startM, 0, 0);
      end.setHours(endH, endM, 0, 0);

      if (!(reschedTime >= start && reschedTime < end)) {
        return res.status(400).json({ message: 'Selected time is outside of worker\'s working hours' });
      }

      // Check if there's a conflicting booking
      const conflict = await BookingModel.findOne({
        worker: booking.worker,
        date: parsedDate,
        time: newTime,
        status: { $in: ['requested', 'accepted'] },
        _id: { $ne: booking._id }
      });

      if (conflict) {
        return res.status(400).json({ message: 'Worker is already booked at the selected time' });
      }

      // Update and save
      booking.date = parsedDate;
      booking.time = newTime;
      await booking.save();

      return res.status(200).json({
        message: 'Booking rescheduled successfully',
        booking
      });
    } catch (error) {
      console.error('Reschedule Booking Error:', error);
      return res.status(500).json({ message: 'Server Error', error: error.message });
    }
  },
  getRecentBookingByWorkerId: async (req, res) => {
    try {
      const { userId } = req.user;
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
      const worker = await WorkerModel.findOne({ user: userId }).populate('user');
      if (!worker) {
        return res.status(404).json({ message: 'Worker not found' });
      }
      //will be sending the most recent 5 bookings
      const recentBookings = await BookingModel.find({ worker: worker._id })
        .sort({ createdAt: -1 }) // Sort by creation date in descending order
        .limit(5) // Limit to the most recent 5 bookings
        .populate('customer', 'name email profileImage')
        .populate('serviceDetails.service');
      if (!recentBookings || recentBookings.length === 0) {
        return res.status(404).json({ message: 'No recent bookings found', recentBookings: [] });
      }
      res.status(200).json({ message: 'Recent bookings retrieved successfully', recentBookings });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  verifyJobCode: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { jobCode } = req.body;
      if (!bookingId) {
        return res.status(400).json({ message: 'Booking ID is required' });
      }
      if (!jobCode || jobCode.length !== 6) {
        return res.status(400).json({ message: 'Job code must be a 6-digit number' });
      }
      const booking = await BookingModel.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      if (booking.status !== 'accepted') {
        return res.status(400).json({ message: 'Booking must be accepted to verify job code' });
      }
      if (booking.jobCode !== jobCode) {
        return res.status(400).json({ message: 'Invalid job code' });
      }
      booking.status = 'completed'; // Update status to completed
      booking.isActive = false; // Mark booking as inactive
      await booking.save();
      const BookingDataForEMail = {
        name: booking.customer.name,
        service: booking.serviceDetails.service.name,
        date: booking.date,
        time: booking.time,
        location: booking.location,
        customerNotes: booking.customerNotes,
      }
      res.status(200).json({ message: 'Job code verified successfully', booking });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
  getDashboardStats: async (req, res) => {
    try {
      const { timeRange = 'week' } = req.query;
      const now = new Date();
      let startDate;
      let labels;
      let groupByFormat;

      // Set time range parameters
      switch (timeRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          groupByFormat = '%w'; // Day of week (0-6)
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
          groupByFormat = '%U'; // Week number
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          labels = ['January', 'February', 'March'];
          groupByFormat = '%m'; // Month
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          groupByFormat = '%m'; // Month
          break;
        default:
          return res.status(400).json({ message: 'Invalid time range' });
      }

      // Get users count
      const [customersCount, workersCount] = await Promise.all([
        UserModel.countDocuments({ role: 'customer', createdAt: { $gte: startDate } }),
        UserModel.countDocuments({ role: 'worker', createdAt: { $gte: startDate } })
      ]);

      // Get verified workers count
      const verifiedWorkersCount = await WorkerModel.countDocuments({
        isVerified: true,
        createdAt: { $gte: startDate }
      });

      // Get completed jobs and revenue
      const bookingStats = await BookingModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: '$serviceDetails.price' }
          }
        }
      ]);

      // Get revenue by time period
      const revenueByPeriod = await BookingModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: `%Y-${groupByFormat}`, date: '$createdAt' } },
            revenue: { $sum: '$serviceDetails.price' }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);

      // Calculate revenue change percentage
      const previousPeriodStart = new Date(startDate.getTime() - (startDate.getTime() - now.getTime()));
      const previousPeriodRevenue = await BookingModel.aggregate([
        {
          $match: {
            createdAt: { $gte: previousPeriodStart, $lt: startDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$serviceDetails.price' }
          }
        }
      ]);

      const currentRevenue = bookingStats[0]?.totalRevenue || 0;
      const prevRevenue = previousPeriodRevenue[0]?.total || 0;
      const revenueChange = prevRevenue === 0 ? 100 : ((currentRevenue - prevRevenue) / prevRevenue) * 100;

      // Prepare response
      const stats = {
        timeRange,
        labels,
        revenue: revenueByPeriod.map(period => period.revenue),
        users: {
          customers: customersCount,
          workers: workersCount
        },
        stats: [
          {
            title: 'Total Users',
            value: `${customersCount + workersCount}`,
            change: '+7%',
            type: 'increase',
            icon: '👥',
            details: {
              customers: customersCount,
              workers: workersCount
            }
          },
          {
            title: 'Active Workers',
            value: `${workersCount}`,
            change: '+12%',
            type: 'increase',
            icon: '👨‍🔧',
            details: {
              verified: verifiedWorkersCount,
              pending: workersCount - verifiedWorkersCount
            }
          },
          {
            title: 'Completed Jobs',
            value: `${bookingStats[0]?.totalBookings || 0}`,
            change: '+23%',
            type: 'increase',
            icon: '✅',
            details: {
              [timeRange]: bookingStats[0]?.totalBookings || 0,
              total: bookingStats[0]?.totalBookings || 0
            }
          },
          {
            title: 'Revenue',
            value: `₹${bookingStats[0]?.totalRevenue || 0}`,
            change: `${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
            type: revenueChange >= 0 ? 'increase' : 'decrease',
            icon: '💰',
            details: {
              [timeRange]: `$${currentRevenue}`,
              pending: '$0'
            }
          }
        ]
      };

      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
  },
}

module.exports = BookingController;