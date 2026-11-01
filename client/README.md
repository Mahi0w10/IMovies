# IMovies — Movie Ticket Booking Platform

IMovies is a movie ticket booking web application that allows users to explore movies, view movie details, select seats, choose showtimes, and manage their bookings through a simple and user-friendly interface.

## Live Demo

* **Frontend:** https://i-movies-mauve.vercel.app
* **Backend:** https://imovies-backend-wm25.onrender.com

## Features

* Browse and explore movies.
* View movie posters and details.
* Select show dates and showtimes.
* Choose seats for movie bookings.
* Calculate ticket prices.
* Save and view movie bookings.
* Responsive and modern user interface.

## Tech Stack

### Frontend

* React.js
* Vite
* JavaScript
* HTML5
* CSS3

### Backend

* Node.js
* Express.js
* REST API

### Database

* MongoDB Atlas

### External API

* The Movie Database (TMDB) API

### Deployment

* Vercel — Frontend
* Render — Backend
* GitHub — Source Code Management

## Project Structure

```text
IMovies/
├── client/
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── README.md
│
├── server/
│   ├── models/
│   │   └── Booking.js
│   ├── server.js
│   └── package.json
│
└── README.md
```

## ⚙️ Run Locally

### Prerequisites

* Node.js and npm
* MongoDB connection
* TMDB API key

### 1. Clone the repository

```bash
git clone https://github.com/Mahi0w10/IMovies.git
cd IMovies
```

### 2. Set up the frontend

```bash
cd client
npm install
```

Create a `.env` file inside the `client` folder:

```env
VITE_API_URL=http://localhost:5000
VITE_TMDB_API_KEY=your_tmdb_api_key
```

Replace `your_tmdb_api_key` with your valid TMDB API key.

Start the frontend:

```bash
npm run dev
```

### 3. Set up the backend

Open another terminal:

```bash
cd server
npm install
```

Create a `.env` file inside the `server` folder:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

Replace the MongoDB placeholder with your own connection string.

Start the backend:

```bash
npm start
```

Make sure the backend's `package.json` has a suitable start script. If it does not, use:

```bash
node server.js
```

## Environment Variables

Keep API keys, database credentials, and other secrets private.

* Do not commit `.env` files containing real credentials.
* Configure production environment variables through the deployment platform.
* Never put your MongoDB connection string in frontend environment variables.

## Deployment

The frontend is deployed on Vercel, and the backend is deployed on Render.

Production environment variables must be configured separately in the respective deployment settings.

## Author

**Mahi Jha**

B.Tech — Computer Science and Business Systems

## Project Status

Deployed project — ongoing improvements and testing.
