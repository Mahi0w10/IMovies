const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    movieId: {
      type: Number,
      required: true
    },

    movieTitle: {
      type: String,
      required: true,
      trim: true
    },

    posterPath: {
      type: String,
      default: ''
    },

    showtime: {
      type: String,
      required: true
    },
    showDate: {
      type: String,
      required: true
    },

    seats: {
      type: [String],
      required: true,
      validate: {
        validator: function (seats) {
          return seats.length > 0 &&
            new Set(seats).size === seats.length;
        },
        message: 'Select valid, unique seats.'
      }
    },

    pricePerSeat: {
      type: Number,
      required: true,
      default: 180
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 1
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
