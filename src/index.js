require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

//middleware
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
const userRoutes = require('./routes/user.routes');
const workerRoutes = require('./routes/worker.route');
const serviceRoutes = require('./routes/service.route');
const bookingRoutes = require('./routes/booking.route');
const searchRoutes = require('./routes/search.route');
const reviewRoutes = require('./routes/review.route')

app.use('/api/users', userRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reviews', reviewRoutes);


//monodb setup
mongoose.connect(process.env.MONGO_STRING).then((res) => {
  console.log('MongoDB connected');
  // Import and start the booking cleanup job
  require('./jobs/bookingCleanup')
}).catch((err) => {
  console.log('MongoDB connection error:', err);
});

//starting the server
const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});