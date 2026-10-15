import { Router } from 'express';
import getDb from '../database.js';

const router = Router();
const db = getDb();

const JOINED = `
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

function bookingRow(id) {
  return db.prepare(`${JOINED} WHERE b.id = ?`).get(id);
}

router.get('/', (req, res) => {
  const { status, customer_id, movie_id } = req.query;
  let query = JOINED;
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('b.status = ?');
    params.push(status);
  }
  if (customer_id) {
    conditions.push('b.customer_id = ?');
    params.push(customer_id);
  }
  if (movie_id) {
    conditions.push('s.movie_id = ?');
    params.push(movie_id);
  }
  if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
  query += ' ORDER BY b.booked_at DESC, b.id DESC';

  res.json(db.prepare(query).all(...params));
});

router.post('/', (req, res) => {
  const { customer_id, showtime_id, seats } = req.body;
  if (!customer_id || !showtime_id) {
    return res.status(400).json({ error: 'Customer and showtime are required' });
  }

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const showtime = db.prepare('SELECT * FROM showtimes WHERE id = ?').get(showtime_id);
  if (!showtime) return res.status(404).json({ error: 'Showtime not found' });
  if (showtime.status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot book a cancelled showtime' });
  }

  if (!Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ error: 'Seats must be a non-empty array' });
  }
  if (seats.some((s) => typeof s !== 'string' || s.trim() === '')) {
    return res.status(400).json({ error: 'Seats must be non-empty strings' });
  }

  const cleanSeats = seats.map((s) => s.trim());
  if (new Set(cleanSeats).size !== cleanSeats.length) {
    return res.status(400).json({ error: 'Duplicate seats in request' });
  }

  const screen = db.prepare('SELECT * FROM screens WHERE id = ?').get(showtime.screen_id);
  if (cleanSeats.length > screen.capacity) {
    return res.status(400).json({ error: 'Seats exceed screen capacity' });
  }

  const bookedRows = db
    .prepare("SELECT seats FROM bookings WHERE showtime_id = ? AND status = 'confirmed'")
    .all(showtime.id);
  const bookedSet = new Set();
  for (const row of bookedRows) {
    for (const seat of row.seats.split(',')) {
      if (seat.trim()) bookedSet.add(seat.trim());
    }
  }
  for (const seat of cleanSeats) {
    if (bookedSet.has(seat)) return res.status(400).json({ error: 'Some seats are already booked' });
  }

  const result = db
    .prepare(
      `INSERT INTO bookings (customer_id, showtime_id, seats, seat_count, total_price, status)
       VALUES (?, ?, ?, ?, ?, 'confirmed')`
    )
    .run(customer.id, showtime.id, cleanSeats.join(','), cleanSeats.length, cleanSeats.length * showtime.price);

  res.status(201).json(bookingRow(result.lastInsertRowid));
});

router.patch('/:id/status', (req, res) => {
  const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Booking not found' });

  const { status } = req.body;
  if (existing.status !== 'confirmed') {
    return res.status(400).json({ error: `Cannot change status from ${existing.status} to ${status}` });
  }
  if (status !== 'cancelled') {
    return res.status(400).json({ error: `Cannot change status from ${existing.status} to ${status}` });
  }

  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('cancelled', existing.id);
  res.json(bookingRow(existing.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Booking not found' });
  res.json({ message: 'Booking deleted' });
});

export default router;