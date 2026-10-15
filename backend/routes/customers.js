import { Router } from 'express';
import getDb from '../database.js';

const router = Router();
const db = getDb();

function customerRow(id) {
  return db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id) AS bookingCount
       FROM customers c WHERE c.id = ?`
    )
    .get(id);
}

router.get('/', (req, res) => {
  const { search } = req.query;
  let query = `
    SELECT c.*,
           (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id) AS bookingCount
    FROM customers c
  `;
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
  query += ' ORDER BY c.name';

  res.json(db.prepare(query).all(...params));
});

router.post('/', (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  const exists = db.prepare('SELECT id FROM customers WHERE email = ?').get(email);
  if (exists) return res.status(400).json({ error: 'Email already exists' });

  const result = db
    .prepare('INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)')
    .run(name, email, phone || null);

  res.status(201).json(customerRow(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const { name, email, phone } = req.body;
  const finalName = name !== undefined ? name : customer.name;
  const finalEmail = email !== undefined ? email : customer.email;
  if (!finalName || !finalEmail) return res.status(400).json({ error: 'Name and email are required' });

  const exists = db.prepare('SELECT id FROM customers WHERE email = ? AND id != ?').get(finalEmail, customer.id);
  if (exists) return res.status(400).json({ error: 'Email already exists' });

  db.prepare('UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ?').run(
    finalName,
    finalEmail,
    phone !== undefined ? phone : customer.phone,
    customer.id
  );

  res.json(customerRow(req.params.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Customer not found' });
  res.json({ message: 'Customer deleted' });
});

export default router;