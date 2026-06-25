const express = require('express');
const { prepare } = require('../db');
const { verifyToken } = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();
router.use(verifyToken);

router.get('/summary', roleGuard('admin'), (req, res) => {
  const totalPatients = prepare("SELECT COUNT(*) AS c FROM users WHERE role='patient'").get().c;
  const totalDoctors = prepare("SELECT COUNT(*) AS c FROM doctors").get().c;
  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = prepare("SELECT COUNT(*) AS c FROM appointments WHERE date = ?").get(today).c;
  const pendingAppts = prepare("SELECT COUNT(*) AS c FROM appointments WHERE status='pending'").get().c;
  const completedCount = prepare("SELECT COUNT(*) AS c FROM appointments WHERE status='completed'").get().c;
  res.json({ totalPatients, totalDoctors, todayAppts, pendingAppts, monthlyRevenue: completedCount * 75, completedCount });
});

router.get('/appointments-trend', (req, res) => {
  const { days = 30 } = req.query;
  const rows = prepare(`
    SELECT date, COUNT(*) AS count FROM appointments
    WHERE date >= date('now', ?)
    GROUP BY date ORDER BY date ASC
  `).all(`-${days} days`);
  res.json(rows);
});

router.get('/specialty-breakdown', (req, res) => {
  res.json(prepare(`
    SELECT d.specialty, COUNT(a.id) AS count FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    GROUP BY d.specialty ORDER BY count DESC
  `).all());
});

router.get('/doctor-performance', roleGuard('admin'), (req, res) => {
  res.json(prepare(`
    SELECT u.name, d.specialty,
      COUNT(a.id) AS total,
      SUM(CASE WHEN a.status='completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN a.status='cancelled' THEN 1 ELSE 0 END) AS cancelled,
      ROUND(SUM(CASE WHEN a.status='completed' THEN 1.0 ELSE 0 END) / NULLIF(COUNT(a.id), 0) * 100, 1) AS completion_rate,
      ROUND(SUM(CASE WHEN a.status='cancelled' THEN 1.0 ELSE 0 END) / NULLIF(COUNT(a.id), 0) * 100, 1) AS cancellation_rate
    FROM doctors d JOIN users u ON d.user_id = u.id
    LEFT JOIN appointments a ON a.doctor_id = d.id
    GROUP BY d.id ORDER BY total DESC
  `).all());
});

router.get('/heatmap', roleGuard('admin'), (req, res) => {
  res.json(prepare(`
    SELECT strftime('%w', date) AS day_of_week, COUNT(*) AS count FROM appointments
    WHERE date >= date('now', '-90 days')
    GROUP BY day_of_week ORDER BY day_of_week
  `).all());
});

router.get('/settings', (req, res) => {
  const rows = prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const r of rows) settings[r.key] = r.value;
  res.json(settings);
});

router.put('/settings', roleGuard('admin'), (req, res) => {
  const upsert = prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  for (const [k, v] of Object.entries(req.body)) upsert.run(k, v);
  res.json({ success: true });
});

module.exports = router;
