const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dbPath = path.join(__dirname, 'db.sqlite');

if (process.env.NODE_ENV === 'test' || process.env.RESET_DB === '1') {
  try {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  } catch (e) {
  }
}

const db = new sqlite3.Database(dbPath);

function init() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id INTEGER NOT NULL,
      patient_id INTEGER NOT NULL,
      start_iso TEXT NOT NULL,
      duration_min INTEGER NOT NULL DEFAULT 60,
      status TEXT NOT NULL DEFAULT 'SCHEDULED',
      FOREIGN KEY(doctor_id) REFERENCES doctors(id),
      FOREIGN KEY(patient_id) REFERENCES patients(id)
    )`);

    db.get("SELECT COUNT(*) as c FROM doctors", (err, row) => {
      if (!err && row.c === 0) {
        const stmt = db.prepare("INSERT INTO doctors (name) VALUES (?)");
        ['Dr. Juan Perez', 'Dra. Ana Gomez', 'Dr. Luis Torres'].forEach(d => stmt.run(d));
        stmt.finalize();
      }
    });
  });
}

module.exports = { db, init };
