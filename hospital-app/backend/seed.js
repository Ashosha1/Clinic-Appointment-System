const bcrypt = require('bcryptjs');
const { prepare, transaction } = require('./db');

function seed() {
  const existingAdmin = prepare('SELECT id FROM users WHERE email = ?').get('admin@hospital.com');
  if (existingAdmin) {
    console.log('Database already seeded.');
    return;
  }

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  // Admin
  const adminResult = prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run('Admin User', 'admin@hospital.com', hash('admin123'), 'admin');
  const adminId = adminResult.lastInsertRowid;

  // Doctors
  const doctorData = [
    { name: 'Dr. Sarah Mitchell', email: 'sarah.mitchell@hospital.com', specialty: 'Cardiology', bio: 'Board-certified cardiologist with 15 years of experience in interventional cardiology and heart disease prevention.', days: '1,2,3,4,5', start: '08:00', end: '16:00' },
    { name: 'Dr. James Okonkwo', email: 'james.okonkwo@hospital.com', specialty: 'Dermatology', bio: 'Specialist in medical and cosmetic dermatology, treating conditions ranging from acne to skin cancer.', days: '1,2,3,5', start: '09:00', end: '17:00' },
    { name: 'Dr. Emily Chen', email: 'emily.chen@hospital.com', specialty: 'Pediatrics', bio: 'Dedicated pediatrician focused on child health, development, and preventive care for patients from birth through adolescence.', days: '1,3,4,5', start: '08:30', end: '15:30' },
  ];

  const doctorIds = [];
  for (const d of doctorData) {
    const uid = prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    ).run(d.name, d.email, hash('doctor123'), 'doctor').lastInsertRowid;
    const did = prepare(
      'INSERT INTO doctors (user_id, specialty, bio, available_days, available_hours_start, available_hours_end) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(uid, d.specialty, d.bio, d.days, d.start, d.end).lastInsertRowid;
    doctorIds.push(did);
  }

  // Patients
  const patientIds = [];
  const names = ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Eve Martinez'];
  for (let i = 1; i <= 5; i++) {
    const uid = prepare(
      'INSERT INTO users (name, email, password_hash, role, phone, date_of_birth, blood_type) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      names[i - 1],
      `patient${i}@test.com`,
      hash('test123'),
      'patient',
      `555-010${i}`,
      `199${i}-0${i}-1${i}`,
      ['A+', 'B-', 'O+', 'AB+', 'A-'][i - 1]
    ).lastInsertRowid;
    patientIds.push(uid);
  }

  // Appointments
  const reasons = [
    'Annual checkup', 'Chest pain follow-up', 'Skin rash evaluation',
    'Child vaccination', 'Allergy consultation', 'Blood pressure check',
    'Eczema treatment', 'General consultation', 'Fever and cough', 'Routine physical'
  ];

  const appts = [
    { pid: patientIds[0], did: doctorIds[0], date: '2026-06-25', time: '09:00', reason: reasons[0], status: 'confirmed' },
    { pid: patientIds[0], did: doctorIds[1], date: '2026-06-18', time: '11:00', reason: reasons[2], status: 'completed' },
    { pid: patientIds[1], did: doctorIds[0], date: '2026-06-26', time: '10:00', reason: reasons[1], status: 'pending' },
    { pid: patientIds[1], did: doctorIds[2], date: '2026-06-24', time: '09:30', reason: reasons[3], status: 'confirmed' },
    { pid: patientIds[2], did: doctorIds[1], date: '2026-06-20', time: '14:00', reason: reasons[6], status: 'completed' },
    { pid: patientIds[2], did: doctorIds[0], date: '2026-06-15', time: '08:00', reason: reasons[5], status: 'cancelled' },
    { pid: patientIds[3], did: doctorIds[2], date: '2026-06-27', time: '10:30', reason: reasons[8], status: 'pending' },
    { pid: patientIds[3], did: doctorIds[1], date: '2026-06-10', time: '13:00', reason: reasons[4], status: 'completed' },
    { pid: patientIds[4], did: doctorIds[0], date: '2026-06-28', time: '11:30', reason: reasons[9], status: 'confirmed' },
    { pid: patientIds[4], did: doctorIds[2], date: '2026-06-22', time: '14:30', reason: reasons[7], status: 'completed' },
  ];

  const insertAppt = prepare(
    'INSERT INTO appointments (patient_id, doctor_id, date, time_slot, reason, status) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const a of appts) {
    insertAppt.run(a.pid, a.did, a.date, a.time, a.reason, a.status);
  }

  // Notifications
  const insertNotif = prepare('INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)');
  insertNotif.run(patientIds[0], 'Your appointment with Dr. Sarah Mitchell has been confirmed.', 0);
  insertNotif.run(patientIds[0], 'Reminder: You have an appointment tomorrow at 9:00 AM.', 0);
  insertNotif.run(patientIds[1], 'Your appointment request is pending confirmation.', 0);
  insertNotif.run(patientIds[2], 'Your appointment has been completed. Please leave a review.', 1);

  // Settings
  const insertSetting = prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('hospital_name', 'MediCare General Hospital');
  insertSetting.run('hospital_address', '123 Health Avenue, Medical District, NY 10001');
  insertSetting.run('contact_email', 'info@medicare-hospital.com');
  insertSetting.run('contact_phone', '+1 (555) 000-1234');
  insertSetting.run('working_hours_start', '08:00');
  insertSetting.run('working_hours_end', '18:00');
  insertSetting.run('slot_duration', '30');

  console.log('Database seeded successfully.');
}

seed();
