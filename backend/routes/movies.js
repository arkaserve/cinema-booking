import { Router } from 'express';
import getDb from '../database.js';

const router = Router();
const db = getDb();

function movieRow(id) {
  return db
    .prepare(
      `SELECT m.*, (SELECT COUNT(*) FROM showtimes s WHERE s.movie_id = m.id) AS showtimeCount
       FROM movies m WHERE m.id = ?`
    )
    .get(id);
}

function validateRating(rating) {
  if (rating === undefined) return true;
  return ['G', 'PG', 'PG-13', 'R'].includes(rating);
}

router.get('/', (req, res) => {
  const { search, genre } = req.query;
  let query = `
    SELECT m.*,
           (SELECT COUNT(*) FROM showtimes s WHERE s.movie_id = m.id) AS showtimeCount
    FROM movies m
  `;
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(m.title LIKE ? OR m.genre LIKE ? OR m.description LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (genre) {
    conditions.push('m.genre = ?');
    params.push(genre);
  }
  if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
  query += ' ORDER BY m.title';

  res.json(db.prepare(query).all(...params));
});

router.post('/', (req, res) => {
  const { title, genre, duration_minutes, rating, description, status } = req.body;
  if (!title || !genre) return res.status(400).json({ error: 'Title and genre are required' });

  const duration = Number(duration_minutes);
  if (isNaN(duration) || duration < 1) return res.status(400).json({ error: 'Duration must be at least 1 minute' });
  if (!validateRating(rating)) return res.status(400).json({ error: 'Rating must be G, PG, PG-13 or R' });
  if (status !== undefined && !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: 'Status must be active or inactive' });
  }

  const result = db
    .prepare(
      `INSERT INTO movies (title, genre, duration_minutes, rating, description, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(title, genre, duration, rating || 'PG', description || null, status || 'active');

  res.status(201).json(movieRow(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
  if (!movie) return res.status(404).json({ error: 'Movie not found' });

  const { title, genre, duration_minutes, rating, description, status } = req.body;
  const finalTitle = title !== undefined ? title : movie.title;
  const finalGenre = genre !== undefined ? genre : movie.genre;
  if (!finalTitle || !finalGenre) return res.status(400).json({ error: 'Title and genre are required' });

  const finalDuration = duration_minutes !== undefined && duration_minutes !== '' ? Number(duration_minutes) : movie.duration_minutes;
  if (isNaN(finalDuration) || finalDuration < 1) return res.status(400).json({ error: 'Duration must be at least 1 minute' });

  const finalRating = rating !== undefined ? rating : movie.rating;
  if (!validateRating(finalRating)) return res.status(400).json({ error: 'Rating must be G, PG, PG-13 or R' });

  const finalStatus = status !== undefined ? status : movie.status;
  if (!['active', 'inactive'].includes(finalStatus)) {
    return res.status(400).json({ error: 'Status must be active or inactive' });
  }

  db.prepare(
    `UPDATE movies SET title = ?, genre = ?, duration_minutes = ?, rating = ?, description = ?, status = ? WHERE id = ?`
  ).run(
    finalTitle,
    finalGenre,
    finalDuration,
    finalRating,
    description !== undefined ? description : movie.description,
    finalStatus,
    movie.id
  );

  res.json(movieRow(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM movies WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Movie not found' });
  res.json({ message: 'Movie deleted' });
});

export default router;