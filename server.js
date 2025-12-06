const express = require('express');
const bodyParser = require('body-parser');
const { db, init } = require('./db');
const validator = require('validator');
const dayjs = require('dayjs');
const path = require('path');

init();

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


function validateEmail(email) {
  return validator.isEmail(email || '');
}
function validatePhone(phone) {
  return typeof phone === 'string' &&
    phone.replace(/\D/g, '').length >= 7 &&
    phone.replace(/\D/g, '').length <= 15;
}

const WORK_START_HOUR = Number(process.env.WORK_START_HOUR || 8); 
const WORK_END_HOUR = Number(process.env.WORK_END_HOUR || 18);

app.post('/api/patients', (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone)
    return res.status(400).json({ error: 'Campos obligatorios' });

  if (!validateEmail(email))
    return res.status(400).json({ error: 'Email inválido' });

  if (!validatePhone(phone))
    return res.status(400).json({ error: 'Teléfono inválido' });

  const stmt = db.prepare(
    "INSERT INTO patients (name, email, phone) VALUES (?, ?, ?)"
  );

  stmt.run(name, email, phone, function (err) {
    if (err) {
      if (err.message.includes('UNIQUE'))
        return res.status(409).json({ error: 'Email ya registrado' });

      return res.status(500).json({ error: 'DB error' });
    }

    res.status(201).json({
      id: this.lastID,
      name,
      email,
      phone
    });
  });
});


app.get('/api/doctors', (req, res) => {
  db.all('SELECT id, name FROM doctors', (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB' });
    res.json(rows);
  });
});

app.post('/api/appointments', (req, res) => {
  const { patient_id, doctor_id, start_iso, duration_min = 60 } = req.body;

  if (!patient_id || !doctor_id || !start_iso)
    return res.status(400).json({ error: 'Campos obligatorios' });

  if (!dayjs(start_iso).isValid())
    return res.status(400).json({ error: 'Fecha/hora inválida' });

  const did = Number(doctor_id);
  if (!Number.isFinite(did)) return res.status(400).json({ error: 'Doctor inválido' });

  db.get('SELECT id, name FROM doctors WHERE id = ?', [did], (err, doctor) => {
    if (err) return res.status(500).json({ error: 'DB' });
    if (!doctor) return res.status(400).json({ error: 'Doctor no encontrado' });

    const newStart = dayjs(start_iso);
    const newEnd = newStart.add(Number(duration_min), 'minute');

    const dow = newStart.day(); 
    if (dow === 0 || dow === 6) {
      return res.status(400).json({ error: 'No se permiten citas en fines de semana' });
    }

    const startOfWork = newStart.startOf('day').add(WORK_START_HOUR, 'hour');
    const endOfWork = newStart.startOf('day').add(WORK_END_HOUR, 'hour');

    if (newStart.isBefore(startOfWork) || dayjs(newStart.add(duration_min, 'minute')).isAfter(endOfWork)) {
      return res.status(400).json({ error: `Horario fuera de atención (${WORK_START_HOUR}:00-${WORK_END_HOUR}:00)` });
    }

    const q = `SELECT * FROM appointments WHERE doctor_id = ? AND status = 'SCHEDULED'`;

    db.all(q, [did], (err2, rows) => {
      if (err2) return res.status(500).json({ error: 'DB err' });

      for (const a of rows) {
        const aStart = dayjs(a.start_iso);
        const aEnd = aStart.add(Number(a.duration_min), 'minute');

        if (aStart.isBefore(newEnd) && aEnd.isAfter(newStart)) {
          return res.status(409).json({ error: 'Horario ya ocupado' });
        }
      }

      const stmt = db.prepare(
        "INSERT INTO appointments (doctor_id, patient_id, start_iso, duration_min) VALUES (?, ?, ?, ?)"
      );

      stmt.run(
        did,
        patient_id,
        newStart.toISOString(),
        duration_min,
        function (err) {
          if (err)
            return res.status(500).json({ error: 'DB insert' });

          res.status(201).json({
            id: this.lastID,
            doctor_id: did,
            patient_id,
            start_iso: newStart.toISOString(),
            duration_min
          });
        }
      );
    });
  });
});


app.get('/api/appointments', (req, res) => {
  const { doctor_id, patient_id } = req.query;

  let q = `
    SELECT a.*, p.name AS patient_name, d.name AS doctor_name
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
    WHERE 1=1
  `;

  const params = [];

  if (doctor_id) {
    q += " AND doctor_id = ?";
    params.push(doctor_id);
  }
  if (patient_id) {
    q += " AND patient_id = ?";
    params.push(patient_id);
  }

  db.all(q, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB' });
    res.json(rows);
  });
});

app.delete('/api/appointments/:id', (req, res) => {
  const id = req.params.id;

  db.run(
    "UPDATE appointments SET status = 'CANCELLED' WHERE id = ?",
    [id],
    function (err) {
      if (err) return res.status(500).json({ error: 'DB' });

      if (this.changes === 0)
        return res.status(404).json({ error: 'No encontrado' });

      res.json({ ok: true });
    }
  );
});


app.get('/api/available', (req, res) => {
  const { doctor_id, start_iso, duration_min = 60 } = req.query;

  if (!doctor_id || !start_iso)
    return res.status(400).json({ error: 'Parametros doctor_id y start_iso requeridos' });

  if (!dayjs(start_iso).isValid())
    return res.status(400).json({ error: 'Fecha inválida' });

  const newStart = dayjs(start_iso);
  const newEnd = newStart.add(Number(duration_min), 'minute');
  const did = Number(doctor_id);

  db.all(
    "SELECT * FROM appointments WHERE doctor_id = ? AND status = 'SCHEDULED'",
    [did],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB' });

      for (const a of rows) {
        const aStart = dayjs(a.start_iso);
        const aEnd = aStart.add(Number(a.duration_min), 'minute');

        if (aStart.isBefore(newEnd) && aEnd.isAfter(newStart)) {
          return res.json({ available: false });
        }
      }

      res.json({ available: true });
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
