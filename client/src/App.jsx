import { useEffect, useState } from 'react';
import './App.css';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKEND_URL = 'http://localhost:5000';

const seatRows = ['A', 'B', 'C', 'D', 'E'];
const seatsPerRow = 8;
const seatPrice = 180;

const showtimes = [
  '12:30 PM',
  '3:30 PM',
  '6:30 PM',
  '9:30 PM',
];

// Get today's date in YYYY-MM-DD format using local time.
function getLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatMovies(results) {
  return results.map((movie) => ({
    id: movie.id,
    title: movie.title,
    genre: 'Movie',
    year: movie.release_date
      ? movie.release_date.slice(0, 4)
      : 'N/A',
    rating: Number(movie.vote_average || 0).toFixed(1),
    overview: movie.overview || '',
    poster: movie.poster_path,
    theme: '',
  }));
}

function App() {
  const [search, setSearch] = useState('');
  const [movies, setMovies] = useState([]);

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedShow, setSelectedShow] = useState('6:30 PM');
  const [selectedDate, setSelectedDate] = useState(getLocalDate());

  const [bookedSeats, setBookedSeats] = useState([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [seatsError, setSeatsError] = useState('');

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState('home');
  const [myBookings, setMyBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');

  // Fetch popular movies and search movies using TMDB.
  useEffect(() => {
    let cancelled = false;

    async function loadMovies() {
      if (!API_KEY) {
        setError(
          'TMDB API key is missing. Check the .env file inside the client folder.'
        );
        setMovies([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const endpoint = search.trim()
          ? `${API_URL}/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(search.trim())}&page=1&include_adult=false`
          : `${API_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error(
            'Could not load movies. Please check your TMDB API configuration.'
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setMovies(formatMovies(data.results || []));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load movies.');
          setMovies([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timeoutId = setTimeout(loadMovies, search.trim() ? 400 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [search]);

  // Fetch booked seats for the selected movie, date and showtime.
  useEffect(() => {
    if (!selectedMovie || !showSeatSelection) {
      setBookedSeats([]);
      setSeatsError('');
      setSeatsLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadBookedSeats() {
      setSeatsLoading(true);
      setSeatsError('');
      setBookedSeats([]);
      setSelectedSeats([]);

      try {
        const params = new URLSearchParams({
          movieId: String(selectedMovie.id),
          showtime: selectedShow,
          showDate: selectedDate,
        });

        const response = await fetch(
          `${BACKEND_URL}/api/booked-seats?${params.toString()}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || 'Unable to load booked seats.'
          );
        }

        if (!controller.signal.aborted) {
          setBookedSeats(data.bookedSeats || []);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Seat availability error:', err);
          setBookedSeats([]);
          setSeatsError(
            'Could not load seat availability. Please try again.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setSeatsLoading(false);
        }
      }
    }

    loadBookedSeats();

    return () => {
      controller.abort();
    };
  }, [selectedMovie, selectedShow, selectedDate, showSeatSelection]);

  // Select or deselect seats.
  function toggleSeat(seatId) {
    if (
      bookingLoading ||
      seatsLoading ||
      seatsError ||
      bookedSeats.includes(seatId)
    ) {
      return;
    }

    setSelectedSeats((previousSeats) =>
      previousSeats.includes(seatId)
        ? previousSeats.filter((seat) => seat !== seatId)
        : [...previousSeats, seatId]
    );

    setMessage('');
    setMessageType('');
  }

  // Open the booking modal.
  function openBooking(movie) {
    setSelectedMovie(movie);
    setSelectedShow('6:30 PM');
    setSelectedDate(getLocalDate());
    setShowSeatSelection(false);
    setSelectedSeats([]);
    setBookedSeats([]);
    setSeatsError('');
    setMessage('');
    setMessageType('');
  }

  // Close the booking modal.
  function closeBooking() {
    if (bookingLoading) {
      return;
    }

    setSelectedMovie(null);
    setShowSeatSelection(false);
    setSelectedSeats([]);
    setBookedSeats([]);
    setSeatsError('');
    setMessage('');
    setMessageType('');
  }

  // Confirm and save the booking in MongoDB.
  async function confirmBooking() {
    if (!selectedMovie || selectedSeats.length === 0) {
      setMessage('Please select at least one available seat.');
      setMessageType('error');
      return;
    }

    if (bookingLoading || seatsLoading || seatsError) {
      return;
    }

    setBookingLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: selectedMovie.id,
          movieTitle: selectedMovie.title,
          posterPath: selectedMovie.poster || '',
          showtime: selectedShow,
          showDate: selectedDate,
          seats: selectedSeats,
          pricePerSeat: seatPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Booking failed. Please try again.'
        );
      }

      const savedBooking = data.booking;

      setMessage(
        `Booking confirmed successfully! ${savedBooking.movieTitle} | Show Date: ${savedBooking.showDate || selectedDate} | ${savedBooking.showtime} | Seats: ${savedBooking.seats.join(', ')} | Total: ₹${savedBooking.totalPrice}. Your booking has been saved to the database.`
      );

      setMessageType('success');

      // Hide the seat selection after confirmation.
      setShowSeatSelection(false);
      setSelectedSeats([]);

      // Add the newly saved booking to the list.
      setMyBookings((previousBookings) => [
        savedBooking,
        ...previousBookings,
      ]);
    } catch (err) {
      console.error('Booking error:', err);

      setMessage(
        err.message ||
          'Unable to save your booking. Please check your backend connection.'
      );

      setMessageType('error');
    } finally {
      setBookingLoading(false);
    }
  }

  // Fetch all bookings from MongoDB.
  async function loadMyBookings() {
    setCurrentPage('bookings');
    setBookingsLoading(true);
    setBookingsError('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/bookings`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not load bookings.');
      }

      setMyBookings(data.bookings || []);
    } catch (err) {
      console.error('Fetching bookings failed:', err);
      setBookingsError(err.message || 'Unable to load bookings.');
    } finally {
      setBookingsLoading(false);
    }
  }

  // Return to the home page.
  function goHome() {
    setCurrentPage('home');
    setBookingsError('');
  }

  return (
    <div className="app">
      {/* NAVBAR */}
      <header className="navbar">
        <a className="brand" href="#home" onClick={goHome}>
          <span className="brand-icon">▶</span>
          i<span>MOVIES</span>
        </a>

        <nav className="nav-links">
          <a href="#home" onClick={goHome}>
            Home
          </a>

          <a href="#movies" onClick={goHome}>
            Movies
          </a>

          <a href="#about" onClick={goHome}>
            About
          </a>

          <button
            type="button"
            className="nav-bookings-button"
            onClick={loadMyBookings}
          >
            My Bookings
          </button>
        </nav>

        <a
          className="login-button"
          href="#movies"
          onClick={goHome}
        >
          Explore Movies ↗
        </a>
      </header>

      <main>
        {/* MY BOOKINGS PAGE */}
        {currentPage === 'bookings' ? (
          <section className="my-bookings-section">
            <div className="my-bookings-heading">
              <div>
                <span className="eyebrow">YOUR MOVIE HISTORY</span>

                <h2>
                  My <span>Bookings.</span>
                </h2>

                <p>Your saved movie ticket bookings in one place.</p>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={goHome}
              >
                ← Back to Movies
              </button>
            </div>

            {bookingsLoading ? (
              <div className="empty-state">
                <h3>Loading your bookings...</h3>
              </div>
            ) : bookingsError ? (
              <div className="empty-state">
                <span>⚠️</span>
                <h3>Unable to load bookings</h3>
                <p>{bookingsError}</p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={loadMyBookings}
                >
                  Try Again ↻
                </button>
              </div>
            ) : myBookings.length === 0 ? (
              <div className="empty-state">
                <span>🎟️</span>
                <h3>No bookings yet!</h3>
                <p>Book your favourite movie to see it here.</p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={goHome}
                >
                  Explore Movies →
                </button>
              </div>
            ) : (
              <div className="my-bookings-grid">
                {myBookings.map((booking) => (
                  <article
                    className="my-booking-card"
                    key={booking._id}
                  >
                    {booking.posterPath ? (
                      <img
                        className="my-booking-poster"
                        src={`${IMAGE_URL}${booking.posterPath}`}
                        alt={`${booking.movieTitle} poster`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="my-booking-poster poster-placeholder">
                        🎬
                      </div>
                    )}

                    <div className="my-booking-details">
                      <h3>{booking.movieTitle}</h3>

                      <p>
                        <strong>Booking ID:</strong>{' '}
                        {booking._id}
                      </p>

                      <p>
                        <strong>Show Date:</strong>{' '}
                        {booking.showDate || 'N/A'}
                      </p>

                      <p>
                        <strong>Showtime:</strong>{' '}
                        {booking.showtime}
                      </p>

                      <p>
                        <strong>Seats:</strong>{' '}
                        {(booking.seats || []).join(', ')}
                      </p>

                      <p>
                        <strong>Tickets:</strong>{' '}
                        {(booking.seats || []).length}
                      </p>

                      <p>
                        <strong>Booking Date:</strong>{' '}
                        {booking.createdAt
                          ? new Date(
                              booking.createdAt
                            ).toLocaleDateString('en-IN')
                          : 'N/A'}
                      </p>

                      <div className="my-booking-total">
                        Total: ₹{booking.totalPrice}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* HERO SECTION */}
            <section className="hero-section" id="home">
              <div className="hero-content">
                <span className="eyebrow">
                  ✦ YOUR NEXT MOVIE NIGHT STARTS HERE
                </span>

                <h1>
                  Every story
                  <br />
                  deserves a <span>big screen.</span>
                </h1>

                <p>
                  Discover incredible movies, explore showtimes,
                  and get ready for your next cinematic adventure.
                </p>

                <a href="#movies" className="primary-button">
                  Explore Movies <span>→</span>
                </a>

                <div className="hero-stats">
                  <div>
                    <strong>
                      {movies.length.toString().padStart(2, '0')}
                    </strong>
                    <span>Movies Loaded</span>
                  </div>

                  <div>
                    <strong>HD</strong>
                    <span>Cinematic Experience</span>
                  </div>

                  <div>
                    <strong>24/7</strong>
                    <span>Explore Anytime</span>
                  </div>
                </div>
              </div>

              <div
                className="hero-art"
                aria-label="Cinema illustration"
              >
                <div className="orbit orbit-one"></div>
                <div className="orbit orbit-two"></div>

                <div className="hero-movie-icon">🎬</div>

                <div className="floating-card card-one">
                  ✦ NOW SHOWING
                </div>

                <div className="floating-card card-two">
                  YOUR NEXT FAVOURITE
                </div>

                <div className="hero-glow"></div>
              </div>
            </section>

            {/* MOVIES SECTION */}
            <section className="movies-section" id="movies">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">POWERED BY TMDB</span>

                  <h2>
                    Explore <span>Movies.</span>
                  </h2>

                  <p>
                    Discover popular movies and find your next favourite.
                  </p>
                </div>

                <label className="search-box">
                  <span>⌕</span>

                  <input
                    type="search"
                    placeholder="Search movies..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
              </div>

              {loading && (
                <div className="empty-state">
                  <span>🎬</span>
                  <h3>Loading movies...</h3>
                  <p>Fetching movie details from TMDB.</p>
                </div>
              )}

              {!loading && error && (
                <div className="empty-state">
                  <span>⚠️</span>
                  <h3>Unable to load movies</h3>
                  <p>{error}</p>
                </div>
              )}

              {!loading && !error && (
                <div className="movie-grid">
                  {movies.map((movie) => (
                    <article className="movie-card" key={movie.id}>
                      <div className={`movie-poster ${movie.theme}`}>
                        {movie.poster ? (
                          <img
                            src={`${IMAGE_URL}${movie.poster}`}
                            alt={`${movie.title} poster`}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="poster-emoji">🎬</span>
                        )}

                        <span className="rating">
                          ★ {movie.rating}
                        </span>

                        <span className="poster-label">
                          MOVIE SPOTLIGHT
                        </span>
                      </div>

                      <div className="movie-info">
                        <div className="movie-title-row">
                          <h3>{movie.title}</h3>

                          <span className="movie-year">
                            {movie.year}
                          </span>
                        </div>

                        <p>{movie.genre}</p>

                        <button
                          type="button"
                          className="book-button"
                          onClick={() => openBooking(movie)}
                        >
                          Book Tickets <span>↗</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {!loading && !error && movies.length === 0 && (
                <div className="empty-state">
                  <span>🎞️</span>
                  <h3>No movies found</h3>
                  <p>Try searching with another movie title.</p>
                </div>
              )}
            </section>

            {/* ABOUT SECTION */}
            <section className="about-section" id="about">
              <span className="eyebrow">MORE THAN JUST MOVIES</span>

              <h2>
                Your story. Your screen. <span>Your night.</span>
              </h2>

              <p>
                IMovies is a movie discovery and ticket booking
                project designed to make exploring films simple.
              </p>
            </section>
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <a className="brand" href="#home" onClick={goHome}>
          <span className="brand-icon">▶</span>
          i<span>MOVIES</span>
        </a>

        <p>
          Movie information provided by TMDB. © 2026 IMovies.
        </p>
      </footer>

      {/* BOOKING MODAL */}
      {selectedMovie && (
        <div className="modal-overlay" onClick={closeBooking}>
          <div
            className="booking-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={closeBooking}
              aria-label="Close booking dialog"
              disabled={bookingLoading}
            >
              ×
            </button>

            <span className="eyebrow">YOUR MOVIE NIGHT</span>

            <h2 id="booking-title">{selectedMovie.title}</h2>

            <p>
              {selectedMovie.genre} · {selectedMovie.year}
            </p>

            {!showSeatSelection && (
              <>
                {selectedMovie.overview && (
                  <p>{selectedMovie.overview}</p>
                )}

                <h3>Select a date</h3>

                <input
                  type="date"
                  value={selectedDate}
                  min={getLocalDate()}
                  onChange={(event) => {
                    setSelectedDate(event.target.value);
                    setSelectedSeats([]);
                    setMessage('');
                    setMessageType('');
                  }}
                />

                <h3>Select a showtime</h3>

                <div className="showtime-options">
                  {showtimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      className={
                        selectedShow === time
                          ? 'showtime active'
                          : 'showtime'
                      }
                      onClick={() => {
                        setSelectedShow(time);
                        setMessage('');
                        setMessageType('');
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="primary-button modal-book"
                  onClick={() => {
                    if (!selectedDate || selectedDate < getLocalDate()) {
                      setMessage('Please select today or a future date.');
                      setMessageType('error');
                      return;
                    }

                    setSelectedSeats([]);
                    setMessage('');
                    setMessageType('');
                    setShowSeatSelection(true);
                  }}
                >
                  Continue <span>→</span>
                </button>
              </>
            )}

            {showSeatSelection && (
              <div className="seat-selection">
                <h3>Select Your Seats</h3>

                <p>
                  Show Date: {selectedDate}
                </p>

                {seatsLoading && (
                  <p role="status">Checking seat availability...</p>
                )}

                {seatsError && (
                  <div className="booking-message error" role="alert">
                    <p>{seatsError}</p>

                    <button
                      type="button"
                      className="back-button"
                      onClick={() => {
                        setShowSeatSelection(false);
                        setMessage('');
                        setMessageType('');
                      }}
                    >
                      ← Back and Try Again
                    </button>
                  </div>
                )}

                <p className="selected-show-info">
                  Showtime: {selectedShow}
                </p>

                <div className="screen-indicator">SCREEN</div>

                <div className="seat-layout">
                  {seatRows.map((row) => (
                    <div className="seat-row" key={row}>
                      <span className="row-label">{row}</span>

                      {Array.from(
                        { length: seatsPerRow },
                        (_, index) => {
                          const seatId = `${row}${index + 1}`;

                          const isBooked = bookedSeats.includes(seatId);
                          const isSelected = selectedSeats.includes(seatId);

                          return (
                            <button
                              key={seatId}
                              type="button"
                              className={`seat ${
                                isBooked ? 'booked' : ''
                              } ${isSelected ? 'selected' : ''}`}
                              disabled={
                                isBooked ||
                                bookingLoading ||
                                seatsLoading ||
                                Boolean(seatsError)
                              }
                              onClick={() => toggleSeat(seatId)}
                              aria-label={`Seat ${seatId}${
                                isBooked
                                  ? ', booked'
                                  : isSelected
                                    ? ', selected'
                                    : ', available'
                              }`}
                              title={seatId}
                            >
                              {index + 1}
                            </button>
                          );
                        }
                      )}

                      <span className="row-label">{row}</span>
                    </div>
                  ))}
                </div>

                <div className="seat-legend">
                  <span>
                    <i className="legend-dot available-dot"></i>
                    Available
                  </span>

                  <span>
                    <i className="legend-dot selected-dot"></i>
                    Selected
                  </span>

                  <span>
                    <i className="legend-dot booked-dot"></i>
                    Booked
                  </span>
                </div>

                <div className="booking-summary">
                  <p>
                    Selected seats:{' '}
                    {selectedSeats.length > 0
                      ? selectedSeats.join(', ')
                      : 'None'}
                  </p>

                  <p>Price per seat: ₹{seatPrice}</p>

                  <h3>
                    Total: ₹{selectedSeats.length * seatPrice}
                  </h3>
                </div>

                <button
                  type="button"
                  className="primary-button modal-book"
                  disabled={
                    selectedSeats.length === 0 ||
                    bookingLoading ||
                    seatsLoading ||
                    Boolean(seatsError)
                  }
                  onClick={confirmBooking}
                >
                  {bookingLoading
                    ? 'Saving Booking...'
                    : 'Confirm Selection →'}
                </button>

                <button
                  type="button"
                  className="back-button"
                  disabled={bookingLoading}
                  onClick={() => {
                    setShowSeatSelection(false);
                    setSelectedSeats([]);
                    setMessage('');
                    setMessageType('');
                  }}
                >
                  ← Back to Showtimes
                </button>
              </div>
            )}

            {message && (
              <p
                className={`booking-message ${messageType}`}
                role="status"
              >
                {message}
              </p>
            )}

            <p className="modal-note">
              Showtimes and initial seat availability are sample data.
              Bookings are saved to the database. Online payments are
              not enabled.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
