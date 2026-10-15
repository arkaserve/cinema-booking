import { Router } from 'express';
import getDb from '../database.js';

const router = Router();
const db = getDb();

const JOINED = `
  SELECT s.id, s.movie_id, m.title AS movie_title, m.genre AS movie_genre, m.duration_minutes,
         s.screen_id, sc.name AS screen_name, s.start_time,
         substr(s.start_time, 1, 10) AS date,
         substr(s.start_time, 12, 5) AS time,
         s.price, s.status, sc.capacity,
         COALESCE((SELECT SUM(b.seat_count) FROM bookings b WHERE b.showtime_id = s.id AND b.status = 'confirmed'), 0) AS bookedSeats,
         sc.capacity - COALESCE((SELECT SUM(b.seat_count) FROM bookings b WHERE b.showtime_id = s.id AND b.status = 'confirmed'), 0) AS availableSeats
  FROM showtimes s
  JOIN movies m ON m.id = s.movie_id
  JOIN screens sc ON sc.id = s.screen_id
`;

function showtimeRow(id) {
  return db.prepare(`${JOINED} WHERE s.id = ?`).get(id);
}

function parseTime(str) {
  return new Date(str.replace(' ', 'T'));
}

function overlaps(aStart, aDurationMinutes, bStart, bDurationMinutes) {
  const a = parseTime(aStart).getTime();
  const b = parseTime(bStart).getTime();
  return a < b + bDurationMinutes * 60000 && b < a + aDurationMinutes * 60000;
}

function checkOverlap(movie, screen, startTime, excludeId) {
  const date = startTime.slice(0, 10);
  const rows = db
    .prepare(
      `SELECT s.id, s.start_time, m.duration_minutes
       FROM showtimes s
       JOIN movies m ON m.id = s.movie_id
       WHERE s.screen_id = ? AND substr(s.start_time, 1, 10) = ?
       ${excludeId ? 'AND s.id != ?' : ''}`
    )
    .all(...(excludeId ? [screen.id, date, excludeId] : [screen.id, date]));
  for (const row of rows) {
    if (overlaps(startTime, movie.duration_minutes, row.start_time, row.duration_minutes)) {
      return true;
    }
  }
  return false;
}

router.get('/', (req, res) => {
  const { movie_id, date } = req.query;
  let query = JOINED;
  const conditions = [];
  const params = [];

  if (movie_id) {
    conditions.push('s.movie_id = ?');
    params.push(movie_id);
  }
  if (date) {
    conditions.push('substr(s.start_time, 1, 10) = ?');
    params.push(date);
  }
  if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
  query += ' ORDER BY s.start_time';

  res.json(db.prepare(query).all(...params));
});

router.post('/', (req, res) => {
  const { movie_id, screen_id, start_time, price } = req.body;
  if (!movie_id || !screen_id || !start_time) {
    return res.status(400).json({ error: 'Movie, screen and start time are required' });
  }

  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(movie_id);
  if (!movie) return res.status(404).json({ error: 'Movie not found' });

  const screen = db.prepare('SELECT * FROM screens WHERE id = ?').get(screen_id);
  if (!screen) return res.status(404).json({ error: 'Screen not found' });

  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(start_time)) {
    return res.status(400).json({ error: 'Start time must be in YYYY-MM-DD HH:MM format' });
  }

  const finalPrice = Number(price);
  if (isNaN(finalPrice) || finalPrice < 0) {
    return res.status(400).json({ error: 'Price must be a positive number' });
  }

  if (checkOverlap(movie, screen, start_time, null)) {
    return res.status(400).json({ error: 'Screen is already booked during this time window' });
  }

  const result = db
    .prepare(
      `INSERT INTO showtimes (movie_id, screen_id, start_time, price, status)
       VALUES (?, ?, ?, ?, 'open')`
    )
    .run(movie.id, screen.id, start_time, finalPrice);

  res.status(201).json(showtimeRow(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM showtimes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Showtime not found' });

  const { movie_id, screen_id, start_time, price, status } = req.body;
  const finalMovieId = movie_id !== undefined ? movie_id : existing.movie_id;
  const finalScreenId = screen_id !== undefined ? screen_id : existing.screen_id;
  const finalStartTime = start_time !== undefined ? start_time : existing.start_time;
  const finalPrice = price !== undefined && price !== '' ? Number(price) : existing.price;
  const finalStatus = status !== undefined ? status : existing.status;

  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(finalMovieId);
  if (!movie) return res.status(404).json({ error: 'Movie not found' });

  const screen = db.prepare('SELECT * FROM screens WHERE id = ?').get(finalScreenId);
  if (!screen) return res.status(404).json({ error: 'Screen not found' });

  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(finalStartTime)) {
    return res.status(400).json({ error: 'Start time must be in YYYY-MM-DD HH:MM format' });
  }
  if (isNaN(finalPrice) || finalPrice < 0) {
    return res.status(400).json({ error: 'Price must be a positive number' });
  }
  if (!['open', 'sold_out', 'cancelled'].includes(finalStatus)) {
    return res.status(400).json({ error: 'Status must be open, sold_out or cancelled' });
  }

  if (checkOverlap(movie, screen, finalStartTime, existing.id)) {
    return res.status(400).json({ error: 'Screen is already booked during this time window' });
  }

  db.prepare(
    `UPDATE showtimes SET movie_id = ?, screen_id = ?, start_time = ?, price = ?, status = ? WHERE id = ?`
  ).run(finalMovieId, finalScreenId, finalStartTime, finalPrice, finalStatus, existing.id);

  res.json(showtimeRow(existing.id));
});

router.get('/:id/seats', (req, res) => {
  const showtime = db
    .prepare(
      `SELECT s.id, m.title AS movie_title, sc.name AS screen_name, s.start_time, s.price, sc.capacity, s.status
       FROM showtimes s
       JOIN movies m ON m.id = s.movie_id
       JOIN screens sc ON sc.id = s.screen_id
       WHERE s.id = ?`
    )
    .get(req.params.id);
  if (!showtime) return res.status(404).json({ error: 'Showtime not found' });

  const bookings = db
    .prepare("SELECT seats FROM bookings WHERE showtime_id = ? AND status = 'confirmed'")
    .all(showtime.id);
  const bookedSeats = [];
  for (const b of bookings) {
    for (const seat of b.seats.split(',')) {
      if (seat.trim()) bookedSeats.push(seat.trim());
    }
  }

  const allSeats = [];
  for (let i = 0; i < showtime.capacity; i++) {
    allSeats.push(`${String.fromCharCode(65 + Math.floor(i / 12))}${(i % 12) + 1}`);
  }
  const bookedSet = new Set(bookedSeats);
  const availableSeats = allSeats.filter((s) => !bookedSet.has(s));

  res.json({
    id: showtime.id,
    movie_title: showtime.movie_title,
    screen_name: showtime.screen_name,
    start_time: showtime.start_time,
    price: showtime.price,
    capacity: showtime.capacity,
    booked_seats: bookedSeats,
    available_seats: availableSeats,
  });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM showtimes WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Showtime not found' });
  res.json({ message: 'Showtime deleted' });
});

export default router;