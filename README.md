# Sistema de Reserva de Citas Médicas

API REST + Frontend + Pruebas E2E automatizadas para gestión de citas médicas.

## Instalación y uso rápido

```bash
npm install
npx playwright install
npx playwright test
```

---

## Casos de Prueba E2E (Playwright)

### Test 1: Registro exitoso y agendamiento de cita

**Objetivo:** Validar el flujo completo: registrar un paciente, obtener su ID, y agendar una cita con éxito.

**Pasos:**
1. Completar formulario de registro con datos válidos (nombre, email, teléfono)
2. Verificar mensaje "Registrado con id: X"
3. Extraer el ID del paciente
4. Llenar formulario de cita (paciente ID, doctor, fecha/hora futura)
5. Verificar mensaje "Cita agendada id: Y"
6. Refrescar lista y confirmar que aparece la cita

**Técnicas de selección de datos:**
- **Valores límite:** Email con caracteres especiales válidos, teléfono con 7 dígitos (mínimo)
- **Datos válidos:** Nombre genérico pero válido, email con dominio real, teléfono con formato colombiano
- **Particiones de equivalencia:** Una cita exitosa representa la categoría de "agendar en horario disponible"

**Por qué:** Este es el flujo **happy path** más importante; garantiza que todo el sistema funciona de punta a punta.

---

### Test 2: Validación de datos incorrectos (email inválido, campos vacíos)

**Objetivo:** Garantizar que el frontend y backend rechazan datos inválidos.

**Pasos:**
1. Intentar registrar sin llenar campos → Verificar "Campos obligatorios"
2. Intentar registrar con email inválido (`not-an-email`) → Verificar "Email inválido"

**Técnicas de selección de datos:**
- **Valores límite:** 0 caracteres (campos vacíos)
- **Particiones de equivalencia:**
  - Emails sin @: `not-an-email` → rechazado
  - Emails válidos: `testuser@example.com` → aceptado
- **Datos inválidos:** Email sin dominio, campos en blanco

**Por qué:** Los casos de validación son **críticos para la seguridad e integridad de datos**. Sin validación, el sistema se llena de registros basura y vulnerabilidades. Este test garantiza que ambas capas (cliente y servidor) rechazan datos malformados.

---

### Test 3: Intento de agendar cita en horario ya ocupado (double-booking)

**Objetivo:** Validar que el sistema impide que dos pacientes agendan con el mismo doctor en el mismo horario.

**Pasos:**
1. Registrar paciente A y paciente B
2. Seleccionar doctor y hora X (ej: próximo miércoles a las 11:00)
3. Agendar para paciente A → Éxito
4. Intentar agendar para paciente B en la misma hora y doctor → Error "Horario ya ocupado"

**Técnicas de selección de datos:**
- **Condición límite:** Dos citas exactamente en el mismo rango de tiempo (overlap total)
- **Particiones de equivalencia:**
  - Horas disponibles (partición 1): sin conflicto → éxito
  - Horas ocupadas (partición 2): con conflicto → error esperado
- **Datos válidos:** Dos pacientes distintos, mismo doctor, mismo horario, misma duración (60 min)

**Por qué:** Este test valida la **lógica de negocio crítica**. Un doctor no puede atender dos pacientes simultáneamente. Sin este control, el sistema es inútil y genera overbooking. Prueba la capacidad del backend para detectar conflictos de horarios.

---

### Test 4: Cancelación de cita

**Objetivo:** Verificar que el usuario puede cancelar una cita agendada y que el estado cambia a "CANCELLED".

**Pasos:**
1. Registrar paciente
2. Agendar cita
3. Refrescar lista de citas
4. Hacer clic en botón "Cancelar"
5. Verificar que el estado de la cita ahora es "CANCELLED"

**Técnicas de selección de datos:**
- **Caso nominal:** Una cita existente en estado `SCHEDULED` se cancela → cambia a `CANCELLED`
- **Particiones de equivalencia:**
  - Citas SCHEDULED (partición 1): pueden cancelarse → éxito
  - Citas CANCELLED (partición 2): ya están canceladas (no testeado pero contemplado en backend)

**Por qué:** La cancelación es una **operación esencial** para que el usuario tenga control sobre sus citas. Sin ella, los usuarios quedan atrapados con reservas que no quieren. Este test garantiza que la operación DELETE funciona correctamente en BD y que el frontend refleja el cambio.

---

## Selección de Datos de Prueba: Justificación Técnica

### Validación de Email
- **Estándar:** RFC5322 (validación con librería `validator.isEmail()`)
- **Test inválido:** `not-an-email` → falta el símbolo @ (requiere al menos una @ y un punto)
- **Test válido:** `testuser@example.com` → email bien formado

### Validación de Teléfono
- **Rango permitido:** 7–15 dígitos (alcanza celulares nacionales e internacionales)
- **Test válido:** `3001234567` (10 dígitos, formato Colombia)

### Selección de Fechas
- **Horario de atención:** Lunes a viernes, 08:00–18:00
- **Test válido:** Próximo día laboral (p. ej., miércoles 10 de diciembre a las 10:00)
- **Solapamiento:** Dos citas a las 11:00 el mismo día laboral con el mismo doctor → conflicto esperado

### Duración de Cita
- **Default:** 60 minutos
- **Validación:** Se suma a `start_iso` y se compara con rango horario del doctor y otras citas existentes

---

## Resumen de Cobertura de Pruebas

| Caso | Categoría | Técnica | Resultado Esperado |
|------|-----------|---------|-------------------|
| Test 1 | Happy path | Datos válidos + particiones | Registro y cita exitosos |
| Test 2 | Validación | Valores límite + inválidos | Rechaza campos vacíos y email mal formado |
| Test 3 | Lógica de negocio | Condición límite | Bloquea double-booking |
| Test 4 | Operación esencial | Caso nominal | Cancela cita y cambia estado |

---

## Requisitos del Examen (Cumplidos)

✅ API REST (Node.js/Express) con validación  
✅ Frontend (HTML/CSS/JS)  
✅ Validación de solapamiento de horarios  
✅ Cancelación de citas  
✅ Pruebas E2E (Playwright) con 4 casos  
✅ Técnicas de selección de datos (valores límite, particiones, datos válidos/inválidos)  
✅ GitHub Actions que ejecuta tests automáticamente  
✅ Documentación de casos de prueba (este README)
