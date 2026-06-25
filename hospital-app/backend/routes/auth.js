const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prepare } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!user.is_active) return res.status(403).json({ error: 'Account deactivated' });

  let doctorId = null;
  if (user.role === 'doctor') {
    const doc = prepare('SELECT id FROM doctors WHERE user_id = ?').get(user.id);
    if (doc) doctorId = doc.id;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, doctorId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, doctorId } });
});

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

  const existing = prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const hash = bcrypt.hashSync(password, 10);
  const result = prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run(name, email, hash, 'patient');

  const id = result.lastInsertRowid;
  const token = jwt.sign(
    { id, email, role: 'patient', name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(201).json({ token, user: { id, name, email, role: 'patient' } });
});

module.exports = router;
