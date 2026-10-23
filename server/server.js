const express = require('express');
const mongoose = require('mongoose');
const dns = require('dns');
const cors = require('cors');
require('dotenv').config();

dns.setServers(['8.8.8.8']);

const Booking = require('./models/Booking');

const app = express();

app.use(cors());
app.use(express.json());

const SEAT_PRICE = 180;
const VALID_SEAT_PATTERN = /^[A-E][1-8]$/;
const VALID_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Test backend
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'IMovies backend is running!'
  });
});

// Get booked seats for a movie, date and showtime
app.get('/api/booked-seats', async (req, res) => {
  try {
    const { movieId, showtime, showDate } = req.query;

    if (
      !movieId ||
      !showtime ||
      !showDate ||
      !Number.isFinite(Number(movieId)) ||
      !VALID_DATE_PATTERN.test(showDate)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid movie ID, showtime and show date are required.'
      });
    }

    const bookings = await Booking.find({
      movieId: Number(movieId),
      showtime,
      showDate
    }).select('seats -_id');

    const bookedSeats = [
      ...new Set(bookings.flatMap(booking => booking.seats))
    ];

    return res.json({
      success: true,
      bookedSeats
    });
  } catch (error) {
    console.error('Fetching booked seats failed:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch booked seats.'
    });
  }
});

// Create a booking
app.post('/api/bookings', async (req, res) => {
  try {
    const {
      movieId,
      movieTitle,
      posterPath,
      showtime,
      showDate,
      seats,
      pricePerSeat
    } = req.body;

    if (
      movieId === undefined ||
      !Number.isFinite(Number(movieId)) ||
      !movieTitle ||
      typeof movieTitle !== 'string' ||
      !showtime ||
      typeof showtime !== 'string' ||
      !showDate ||
      typeof showDate !== 'string' ||
      !VALID_DATE_PATTERN.test(showDate) ||
      !Array.isArray(seats) ||
      seats.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid movie, show date, showtime and selected seats.'
      });
    }

    // Validate selected seats
    if (
      !seats.every(
        seat =>
          typeof seat === 'string' &&
          VALID_SEAT_PATTERN.test(seat)
      ) ||
      new Set(seats).size !== seats.length
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or duplicate seats selected.'
      });
    }

    // Validate ticket price
    const seatPrice = Number(pricePerSeat ?? SEAT_PRICE);

    if (seatPrice !== SEAT_PRICE) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket price.'
      });
    }

    // Check existing bookings for the same movie, date and showtime
    const existingBooking = await Booking.findOne({
      movieId: Number(movieId),
      showtime,
      showDate,
      seats: { $in: seats }
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: 'One or more selected seats are already booked. Please select different seats.'
      });
    }

    // Save booking
    const booking = await Booking.create({
      movieId: Number(movieId),
      movieTitle: movieTitle.trim(),
      posterPath: posterPath || '',
      showtime,
      showDate,
      seats,
      pricePerSeat: SEAT_PRICE,
      totalPrice: seats.length * SEAT_PRICE
    });

    return res.status(201).json({
      success: true,
      message: 'Booking saved successfully!',
      booking
    });
  } catch (error) {
    console.error('Booking creation failed:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to save booking.'
    });
  }
});

// Get all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Fetching bookings failed:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch bookings.'
    });
  }
});

// Start server
async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from the server .env file.');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });

    console.log('MongoDB connected successfully!');

    const port = process.env.PORT || 5000;

    app.listen(port, () => {
      console.log(`IMovies server running on port ${port}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
  }
}

startServer();
