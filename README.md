# Sistema de Reserva de Citas Médicas

Sistema simple para agendar citas médicas con API REST, frontend y pruebas automatizadas.


```bash
npm install
npx playwright install
npx playwright test
```

---

## Casos de Prueba

### Test 1: Registro y agendamiento exitoso

Se registra un paciente, se obtiene su ID y se agenda una cita con un doctor. Verifica que el flujo completo funciona correctamente.

**Datos usados:**
- Nombre válido, email real, teléfono colombiano (10 dígitos)
- Se elige próximo día laboral a las 10:00 AM

**Por qué:** Es el caso más importante. Si esto no funciona, nada funciona.

---

### Test 2: Validación de datos

Se intenta registrar sin datos y con email inválido. Verifica que el sistema rechace datos malos.

**Datos usados:**
- Campos vacíos
- Email sin @ (`not-an-email`)

**Por qué:** La validación es crítica para la seguridad. Sin ella, la BD se llena de basura.

---

### Test 3: Bloqueo de doble reserva

Se registran dos pacientes y se intenta agendar ambos con el mismo doctor en la misma hora. El segundo debe fallar.

**Datos usados:**
- Dos pacientes diferentes
- Mismo doctor, misma hora exacta

**Por qué:** Un doctor no puede estar en dos lugares a la vez. Sin este control el sistema no sirve.

---

### Test 4: Cancelación de cita

Se agenda una cita y luego se cancela. Verifica que el estado cambie a "CANCELLED".

**Datos usados:**
- Una cita agendada

**Por qué:** Los usuarios deben poder cancelar sus citas.
