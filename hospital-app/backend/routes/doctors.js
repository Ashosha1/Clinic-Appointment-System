const express = require('express');
const bcrypt = require('bcryptjs');
const { prepare } = require('../db');
const { verifyToken } = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();
router.use(verifyToken);

router.get('/', (req, res) => {
  const { specialty } = req.query;
  let query = `
    SELECT d.*, u.name, u.email, u.is_active,
      (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = d.id) AS appointment_count
    FROM doctors d JOIN users u ON d.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (specialty) { query += ' AND d.specialty = ?'; params.push(specialty); }
  query += ' ORDER BY u.name ASC';
  res.json(prepare(query).all(...params));
});

router.get('/:id', (req, res) => {
  const doc = prepare(`
    SELECT d.*, u.name, u.email, u.is_active
    FROM doctors d JOIN users u ON d.user_id = u.id
    WHERE d.id = ?
  `).get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});

router.post('/', roleGuard('admin'), (req, res) => {
  const { name, email, password, specialty, bio, available_days, available_hours_start, available_hours_end } = req.body;
  if (!name || !email || !password || !specialty) {
    return res.status(400).json({ error: 'name, email, password, specialty required' });
  }
  const existing = prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const uid = prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run(name, email, bcrypt.hashSync(password, 10), 'doctor').lastInsertRowid;

  const did = prepare(
    'INSERT INTO doctors (user_id, specialty, bio, available_days, available_hours_start, available_hours_end) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(uid, specialty, bio || '', available_days || '1,2,3,4,5', available_hours_start || '09:00', available_hours_end || '17:00').lastInsertRowid;

  res.status(201).json({ id: did, user_id: uid, name, email, specialty });
});

router.put('/:id', (req, res) => {
  const { role, doctorId } = req.user;
  const targetId = parseInt(req.params.id);
  if (role !== 'admin' && doctorId !== targetId) return res.status(403).json({ error: 'Forbidden' });

  const { specialty, bio, available_days, available_hours_start, available_hours_end, name, is_active } = req.body;
  const doc = prepare('SELECT * FROM doctors WHERE id = ?').get(targetId);
  if (!doc) return res.status(404).json({ error: 'Not found' });

  prepare(`
    UPDATE doctors SET
      specialty = COALESCE(?, specialty),
      bio = COALESCE(?, bio),
      available_days = COALESCE(?, available_days),
      available_hours_start = COALESCE(?, available_hours_start),
      available_hours_end = COALESCE(?, available_hours_end)
    WHERE id = ?
  `).run(specialty ?? null, bio ?? null, available_days ?? null, available_hours_start ?? null, available_hours_end ?? null, targetId);

  if (name !== undefined || is_active !== undefined) {
    prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(name ?? null, is_active ?? null, doc.user_id);
  }

  const updated = prepare('SELECT d.*, u.name, u.email, u.is_active FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = ?').get(targetId);
  res.json(updated);
});

module.exports = router;
