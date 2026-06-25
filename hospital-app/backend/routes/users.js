const express = require('express');
const bcrypt = require('bcryptjs');
const { prepare } = require('../db');
const { verifyToken } = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();
router.use(verifyToken);

router.get('/', roleGuard('admin'), (req, res) => {
  const { role } = req.query;
  let query = 'SELECT id, name, email, role, phone, date_of_birth, blood_type, allergies, is_active, created_at FROM users WHERE 1=1';
  const params = [];
  if (role) { query += ' AND role = ?'; params.push(role); }
  query += ' ORDER BY created_at DESC';
  res.json(prepare(query).all(...params));
});

router.get('/:id', (req, res) => {
  const { role, id: userId } = req.user;
  const targetId = parseInt(req.params.id);
  if (role !== 'admin' && userId !== targetId) return res.status(403).json({ error: 'Forbidden' });

  const user = prepare(
    'SELECT id, name, email, role, phone, date_of_birth, blood_type, allergies, is_active, created_at FROM users WHERE id = ?'
  ).get(targetId);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

router.put('/:id', (req, res) => {
  const { role, id: userId } = req.user;
  const targetId = parseInt(req.params.id);
  if (role !== 'admin' && userId !== targetId) return res.status(403).json({ error: 'Forbidden' });

  const { name, phone, date_of_birth, blood_type, allergies, password, new_password } = req.body;

  if (password && new_password) {
    const user = prepare('SELECT password_hash FROM users WHERE id = ?').get(targetId);
    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(new_password, 10), targetId);
  }

  prepare(`
    UPDATE users SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      date_of_birth = COALESCE(?, date_of_birth),
      blood_type = COALESCE(?, blood_type),
      allergies = COALESCE(?, allergies)
    WHERE id = ?
  `).run(name ?? null, phone ?? null, date_of_birth ?? null, blood_type ?? null, allergies ?? null, targetId);

  const updated = prepare(
    'SELECT id, name, email, role, phone, date_of_birth, blood_type, allergies, created_at FROM users WHERE id = ?'
  ).get(targetId);
  res.json(updated);
});

module.exports = router;
