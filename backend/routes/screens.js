import { Router } from 'express';
import getDb from '../database.js';

const router = Router();
const db = getDb();

function screenRow(id) {
  return db
    .prepare(
      `SELECT s.*, (SELECT COUNT(*) FROM showtimes st WHERE st.screen_id = s.id) AS showtimeCount
       FROM screens s WHERE s.id = ?`
    )
    .get(id);
}

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT s.*, (SELECT COUNT(*) FROM showtimes st WHERE st.screen_id = s.id) AS showtimeCount
       FROM screens s
       ORDER BY s.name`
    )
    .all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { name, capacity, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Screen name is required' });

  const cap = Number(capacity);
  if (isNaN(cap) || cap < 1) return res.status(400).json({ error: 'Capacity must be at least 1' });
  if (status !== undefined && !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: 'Status must be active or inactive' });
  }

  const exists = db.prepare('SELECT id FROM screens WHERE name = ?').get(name);
  if (exists) return res.status(400).json({ error: 'Screen name already exists' });

  const result = db
    .prepare('INSERT INTO screens (name, capacity, status) VALUES (?, ?, ?)')
    .run(name, cap, status || 'active');

  res.status(201).json(screenRow(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const screen = db.prepare('SELECT * FROM screens WHERE id = ?').get(req.params.id);
  if (!screen) return res.status(404).json({ error: 'Screen not found' });

  const { name, capacity, status } = req.body;
  const finalName = name !== undefined ? name : screen.name;
  if (!finalName) return res.status(400).json({ error: 'Screen name is required' });

  const finalCapacity = capacity !== undefined && capacity !== '' ? Number(capacity) : screen.capacity;
  if (isNaN(finalCapacity) || finalCapacity < 1) return res.status(400).json({ error: 'Capacity must be at least 1' });

  const finalStatus = status !== undefined ? status : screen.status;
  if (!['active', 'inactive'].includes(finalStatus)) {
    return res.status(400).json({ error: 'Status must be active or inactive' });
  }

  const exists = db.prepare('SELECT id FROM screens WHERE name = ? AND id != ?').get(finalName, screen.id);
  if (exists) return res.status(400).json({ error: 'Screen name already exists' });

  db.prepare('UPDATE screens SET name = ?, capacity = ?, status = ? WHERE id = ?').run(
    finalName,
    finalCapacity,
    finalStatus,
    screen.id
  );

  res.json(screenRow(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM screens WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Screen not found' });
  res.json({ message: 'Screen deleted' });
});

export default router;