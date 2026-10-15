import express from 'express';
import getDb from './database.js';
import moviesRouter from './routes/movies.js';
import screensRouter from './routes/screens.js';
import showtimesRouter from './routes/showtimes.js';
import customersRouter from './routes/customers.js';
import bookingsRouter from './routes/bookings.js';

const app = express();
const PORT = process.env.PORT || 5000;
const db = getDb();

app.use(express.json());

app.use('/api/movies', moviesRouter);
app.use('/api/screens', screensRouter);
app.use('/api/showtimes', showtimesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/bookings', bookingsRouter);

function today() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const RECENT_JOINED = `
  SELECT b.id, b.customer_id, c.name AS customer_name, c.email AS customer_email,
         b.showtime_id, s.movie_id, m.title AS movie_title,
         s.screen_id, sc.name AS screen_name,
         s.start_time, b.seats AS seats_text, b.seat_count, b.total_price, b.status, b.booked_at
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  JOIN showtimes s ON s.id = b.showtime_id
  JOIN movies m ON m.id = s.movie_id
  JOIN screens sc ON sc.id = s.screen_id
`;

app.get('/api/stats', (req, res) => {
  const totalMovies = db.prepare('SELECT COUNT(*) AS count FROM movies').get().count;
  const totalScreens = db.prepare('SELECT COUNT(*) AS count FROM screens').get().count;
  const totalShowtimes = db.prepare('SELECT COUNT(*) AS count FROM showtimes').get().count;
  const totalCustomers = db.prepare('SELECT COUNT(*) AS count FROM customers').get().count;
  const totalBookings = db.prepare('SELECT COUNT(*) AS count FROM bookings').get().count;
  const revenue = db.prepare("SELECT COALESCE(SUM(total_price), 0) AS sum FROM bookings WHERE status = 'confirmed'").get().sum;
  const todaySales = db.prepare(
    "SELECT COALESCE(SUM(b.total_price), 0) AS sum FROM bookings b JOIN showtimes s ON s.id = b.showtime_id WHERE b.status = 'confirmed' AND substr(s.start_time, 1, 10) = ?"
  ).get(today()).sum;

  const upcomingShowtimes = db.prepare(`
    SELECT s.id, s.movie_id, m.title AS movie_title, sc.name AS screen_name,
           s.start_time, s.price, sc.capacity,
           COALESCE((SELECT SUM(b.seat_count) FROM bookings b WHERE b.showtime_id = s.id AND b.status = 'confirmed'), 0) AS bookedSeats,
           sc.capacity - COALESCE((SELECT SUM(b.seat_count) FROM bookings b WHERE b.showtime_id = s.id AND b.status = 'confirmed'), 0) AS availableSeats
    FROM showtimes s
    JOIN movies m ON m.id = s.movie_id
    JOIN screens sc ON sc.id = s.screen_id
    WHERE s.status = 'open'
    ORDER BY s.start_time
    LIMIT 5
  `).all();

  const bookingsByStatus = db.prepare('SELECT status, COUNT(*) AS count FROM bookings GROUP BY status').all();
  const recentBookings = db.prepare(`${RECENT_JOINED} ORDER BY b.id DESC LIMIT 5`).all();

  res.json({
    totalMovies,
    totalScreens,
    totalShowtimes,
    totalCustomers,
    totalBookings,
    revenue,
    todaySales,
    upcomingShowtimes,
    bookingsByStatus,
    recentBookings,
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Cinema Booking backend server running on http://localhost:${PORT}`);
});