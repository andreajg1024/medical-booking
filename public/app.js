async function api(path, opts) {
  const res = await fetch('/api' + path, opts);
  let data = {};

  try {
    data = await res.json();
  } catch (_) {
    data = {};
  }

  if (!res.ok) throw { status: res.status, data };
  return data;
}


document.getElementById('frmRegister').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('pname').value.trim();
  const email = document.getElementById('pemail').value.trim();
  const phone = document.getElementById('pphone').value.trim();
  const msg = document.getElementById('regMsg');


  if (!name || !email || !phone) {
    msg.textContent = "Campos obligatorios";
    return;
  }

  if (!email.includes('@') || !email.includes('.')) {
    msg.textContent = "Email inválido";
    return;
  }

  try {
    const r = await api('/patients', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, email, phone })
    });

    msg.textContent = 'Registrado con id: ' + r.id;

  } catch (err) {
    msg.textContent = err.data?.error || 'Error';
  }
});


document.getElementById('frmBook').addEventListener('submit', async (e) => {
  e.preventDefault();

  const patient_id = Number(document.getElementById('patientId').value);
  const doctor_id = Number(document.getElementById('doctorSelect').value);
  const start_iso = document.getElementById('startIso').value;
  const duration_min = Number(document.getElementById('duration').value) || 60;

  const msg = document.getElementById('bookMsg');

  if (!patient_id || !doctor_id || !start_iso) {
    msg.textContent = "Campos obligatorios";
    return;
  }

  try {
    const r = await api('/appointments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        patient_id,
        doctor_id,
        start_iso,
        duration_min
      })
    });

    msg.textContent = 'Cita agendada id: ' + r.id;
    loadAppointments();

  } catch (err) {
    msg.textContent = err.data?.error || 'Error';
  }
});


async function loadAppointments() {
  const div = document.getElementById('appts');
  div.innerHTML = 'Cargando...';

  try {
    const rows = await api('/appointments');

    if (rows.length === 0) {
      div.innerHTML = '<i>No hay citas</i>';
      return;
    }

    div.innerHTML = '';

    for (const a of rows) {
      const el = document.createElement('div');
      el.className = 'appt';
      el.innerHTML = `
        <b>Id:</b> ${a.id} —
        <b>Doctor:</b> ${a.doctor_name} —
        <b>Paciente:</b> ${a.patient_name} —
        <b>Inicio:</b> ${a.start_iso} —
        <b>Estado:</b> ${a.status}
        <br>
        <button data-id="${a.id}" class="cancel">Cancelar</button>
      `;
      div.appendChild(el);
    }


    document.querySelectorAll('.cancel').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        await fetch('/api/appointments/' + id, { method: 'DELETE' });
        loadAppointments();
      });
    });

  } catch (e) {
    div.innerHTML = 'Error cargando';
  }
}


document.getElementById('refresh').addEventListener('click', loadAppointments);


window.addEventListener('load', async () => {
  
  try {
    const docs = await api('/doctors');
    const sel = document.getElementById('doctorSelect');
    sel.innerHTML = '';
    for (const d of docs) {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.name;
      sel.appendChild(opt);
    }
  } catch (e) {
    console.error('No se pudieron cargar doctores', e);
  }

  
  const dateInput = document.getElementById('dateInput');
  const timeInput = document.getElementById('timeInput');
  const startIso = document.getElementById('startIso');

  function syncFromDateTime() {
    if (dateInput.value && timeInput.value) {
    
      const dt = new Date(dateInput.value + 'T' + timeInput.value);
      startIso.value = dt.toISOString().slice(0,19);
    }
  }

  
  function validateDateForBooking() {
    const msg = document.getElementById('bookMsg');
    msg.textContent = '';
    if (!dateInput.value) return;
    const d = new Date(dateInput.value + 'T00:00');
    const dow = d.getDay();
    if (dow === 0 || dow === 6) {
      msg.textContent = 'No se permiten citas en fines de semana';
      timeInput.disabled = true;
      return;
    }
    timeInput.disabled = false;
    
    const startHour = Number((new URLSearchParams(location.search)).get('workStart')) || 8;
    const endHour = Number((new URLSearchParams(location.search)).get('workEnd')) || 18;
    const latestStart = String(endHour - 1).padStart(2,'0') + ':00';
    timeInput.min = String(startHour).padStart(2,'0') + ':00';
    timeInput.max = latestStart;
    
    if (timeInput.value) {
      if (timeInput.value < timeInput.min || timeInput.value > timeInput.max) {
        timeInput.value = '';
        startIso.value = '';
      } else {
        syncFromDateTime();
      }
    }
  }

  dateInput.addEventListener('change', () => { validateDateForBooking(); syncFromDateTime(); });
  timeInput.addEventListener('change', () => { syncFromDateTime(); });

  dateInput.addEventListener('change', syncFromDateTime);
  timeInput.addEventListener('change', syncFromDateTime);

  
  startIso.addEventListener('change', () => {
    try {
      const d = new Date(startIso.value);
      if (!isNaN(d.getTime())) {
        dateInput.value = d.toISOString().slice(0,10);
        timeInput.value = d.toISOString().slice(11,16);
      }
    } catch (_) {}
  });

  await loadAppointments();
});
