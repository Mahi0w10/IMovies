# IMovies – Movie Ticket Booking System

## About the Project

IMovies is a movie ticket booking web application that allows users to browse movies, view movie details, select show dates and showtimes, choose seats, and book tickets online.

## Features

* Browse movies and view movie details.
* Select a show date and showtime.
* Interactive seat selection.
* View booked seats and prevent booking seats that are already reserved.
* Automatic ticket price calculation.
* Booking confirmation.
* View booking history in My Bookings.
* Store booking information in MongoDB.

## Technology Stack

**Frontend**

* React.js
* Vite
* HTML
* CSS
* JavaScript

**Backend**

* Node.js
* Express.js

**Database**

* MongoDB Atlas

**API**

* The Movie Database (TMDB) API for movie data.

## Ticket Pricing

The ticket price is ₹180 per seat. The total amount depends on the number of seats selected.

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Mahi0w10/IMovies.git
cd IMovies
```

### 2. Setup the Frontend

```bash
cd client
npm install
```

Create a `.env` file inside the `client` folder and add your TMDB API key:

```env
VITE_TMDB_API_KEY=your_tmdb_api_key
```

Start the frontend:

```bash
npm run dev
```

### 3. Setup the Backend

Open a separate terminal:

```bash
cd server
npm install
```

Create a `.env` file inside the `server` folder and configure your MongoDB connection string:

```env
MONGODB_URI=your_mongodb_connection_string
```

Start the backend:

```bash
node server.js
```

The backend runs on port 5000.

## Project Structure

```text
IMovies/
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── models/
│   │   └── Booking.js
│   ├── package.json
│   └── server.js
└── .gitignore
```

## Future Enhancements

* User authentication and profiles.
* Online payment integration.
* Booking cancellation.
* Enhanced movie search and filtering.

## Author

Mahi Jha
