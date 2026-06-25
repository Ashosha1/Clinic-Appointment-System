const express = require('express');
const { prepare } = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

router.get('/', (req, res) => {
  const { role, id: userId, doctorId } = req.user;
  const { status, doctor_id, date_from, date_to, patient_id } = req.query;

  let query = `
    SELECT a.*,
      u_patient.name AS patient_name, u_patient.email AS patient_email,
      u_doctor.name AS doctor_name,
      d.specialty
    FROM appointments a
    JOIN users u_patient ON a.patient_id = u_patient.id
    JOIN doctors d ON a.doctor_id = d.id
    JOIN users u_doctor ON d.user_id = u_doctor.id
    WHERE 1=1
  `;
  const params = [];

  if (role === 'patient') { query += ' AND a.patient_id = ?'; params.push(userId); }
  else if (role === 'doctor') { query += ' AND a.doctor_id = ?'; params.push(doctorId); }

  if (status) { query += ' AND a.status = ?'; params.push(status); }
  if (doctor_id) { query += ' AND a.doctor_id = ?'; params.push(doctor_id); }
  if (patient_id) { query += ' AND a.patient_id = ?'; params.push(patient_id); }
  if (date_from) { query += ' AND a.date >= ?'; params.push(date_from); }
  if (date_to) { query += ' AND a.date <= ?'; params.push(date_to); }

  query += ' ORDER BY a.date DESC, a.time_slot ASC';

  res.json(prepare(query).all(...params));
});

router.post('/', (req, res) => {
  const { doctor_id, date, time_slot, reason } = req.body;
  const patient_id = req.user.id;

  if (!doctor_id || !date || !time_slot) {
    return res.status(400).json({ error: 'doctor_id, date, time_slot required' });
  }

  const conflict = prepare(
    "SELECT id FROM appointments WHERE doctor_id = ? AND date = ? AND time_slot = ? AND status != 'cancelled'"
  ).get(doctor_id, date, time_slot);
  if (conflict) return res.status(409).json({ error: 'Time slot already booked' });

  const result = prepare(
    'INSERT INTO appointments (patient_id, doctor_id, date, time_slot, reason, status) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(patient_id, doctor_id, date, time_slot, reason || '', 'pending');

  prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(
    patient_id, `Your appointment has been requested for ${date} at ${time_slot}.`
  );

  const doc = prepare('SELECT user_id FROM doctors WHERE id = ?').get(doctor_id);
  if (doc) {
    const patient = prepare('SELECT name FROM users WHERE id = ?').get(patient_id);
    prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(
      doc.user_id, `New appointment request from ${patient?.name} on ${date} at ${time_slot}.`
    );
  }

  const appt = prepare(`
    SELECT a.*, u_patient.name AS patient_name, u_doctor.name AS doctor_name, d.specialty
    FROM appointments a
    JOIN users u_patient ON a.patient_id = u_patient.id
    JOIN doctors d ON a.doctor_id = d.id
    JOIN users u_doctor ON d.user_id = u_doctor.id
    WHERE a.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(appt);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const { role, id: userId, doctorId } = req.user;

  const appt = prepare('SELECT * FROM appointments WHERE id = ?').get(id);
  if (!appt) return res.status(404).json({ error: 'Not found' });

  if (role === 'patient' && appt.patient_id !== userId) return res.status(403).json({ error: 'Forbidden' });
  if (role === 'doctor' && appt.doctor_id !== doctorId) return res.status(403).json({ error: 'Forbidden' });

  const newStatus = status || appt.status;
  const newNotes = notes !== undefined ? notes : appt.notes;

  prepare('UPDATE appointments SET status = ?, notes = ? WHERE id = ?').run(newStatus, newNotes, id);

  if (status && status !== appt.status) {
    prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(
      appt.patient_id, `Your appointment on ${appt.date} at ${appt.time_slot} has been ${status}.`
    );
  }

  const updated = prepare(`
    SELECT a.*, u_patient.name AS patient_name, u_doctor.name AS doctor_name, d.specialty
    FROM appointments a
    JOIN users u_patient ON a.patient_id = u_patient.id
    JOIN doctors d ON a.doctor_id = d.id
    JOIN users u_doctor ON d.user_id = u_doctor.id
    WHERE a.id = ?
  `).get(id);

  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const appt = prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Not found' });
  prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/slots/:doctorId/:date', (req, res) => {
  const { doctorId, date } = req.params;
  const doctor = prepare('SELECT * FROM doctors WHERE id = ?').get(doctorId);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

  const dayOfWeek = new Date(date + 'T12:00:00').getDay();
  const availDays = doctor.available_days.split(',').map(Number);
  if (!availDays.includes(dayOfWeek)) {
    return res.json({ slots: [], available: false });
  }

  const setting = prepare("SELECT value FROM settings WHERE key = 'slot_duration'").get();
  const slotMins = parseInt(setting?.value || '30');

  const [sh, sm] = doctor.available_hours_start.split(':').map(Number);
  const [eh, em] = doctor.available_hours_end.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;

  const slots = [];
  for (let m = startMins; m + slotMins <= endMins; m += slotMins) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
  }

  const booked = prepare(
    "SELECT time_slot FROM appointments WHERE doctor_id = ? AND date = ? AND status != 'cancelled'"
  ).all(doctorId, date).map(r => r.time_slot);

  res.json({ slots: slots.map(s => ({ time: s, available: !booked.includes(s) })), available: true });
});

module.exports = router;
