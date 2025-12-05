# Sistema de Reserva de Citas Médicas

Un sistema web simple pero completo de reserva de citas médicas con **API REST (Node.js/Express)**, **frontend responsivo (HTML/CSS/JS)** y **pruebas E2E automatizadas (Playwright)**.

## Características

✅ **Registro de pacientes** con validación de email y teléfono  
✅ **Agendamiento de citas médicas** con validación de solapamiento de horarios por doctor  
✅ **Lista de citas agendadas** con estados (SCHEDULED, CANCELLED)  
✅ **Cancelación de citas**  
✅ **Validación de horario de atención** (08:00–18:00, lunes a viernes)  
✅ **API REST robusta** con manejo de errores  
✅ **Pruebas E2E automatizadas** con Playwright  
✅ **CI/CD en GitHub Actions** que ejecuta automáticamente tests y imprime "OK" al pasar  
✅ **Interfaz responsiva** con diseño moderno (Google Inter, colores, gradientes)

---

## Arquitectura

```
medical-booking/
├── server.js                 # API REST (Express)
├── db.js                     # Capa de BD (SQLite)
├── public/
│   ├── index.html            # Frontend
│   └── app.js                # Lógica del cliente
├── tests/
│   └── tests/
│       └── e2e.spec.ts       # Pruebas E2E (Playwright)
├── github/
│   └── workflows/
│       └── e2e.yml           # CI/CD (GitHub Actions)
├── playwright.config.ts      # Config de Playwright
├── package.json
└── README.md
```

---

## Instalación

### Requisitos
- Node.js 16+ (recomendado 20)
- npm 8+

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/andreajg1024/medical-booking.git
   cd medical-booking
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Instalar navegadores de Playwright (para E2E):**
   ```bash
   npm run prepare
   ```
   O manualmente:
   ```bash
   npx playwright install
   ```

---

## Uso

### Iniciar el servidor (desarrollo)

**Con base de datos limpia (para testing):**
```bash
$env:RESET_DB='1'; npm start
```

**Normal (producción):**
```bash
npm start
```

El servidor escucha en `http://localhost:3000`.

### Ejecutar pruebas E2E

```bash
npx playwright test
```

Playwright arrancará automáticamente el servidor, ejecutará los tests y los reportará.

**Con reporte detallado:**
```bash
npx playwright test --reporter=list
```

**Con interfaz gráfica (debug mode):**
```bash
npx playwright test --debug
```

---

## API REST

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### 1. Registrar Paciente
```http
POST /patients
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "3001234567"
}
```

**Respuesta (201):**
```json
{
  "id": 1,
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "3001234567"
}
```

**Errores:**
- `400`: Campos obligatorios / Email inválido / Teléfono inválido
- `409`: Email ya registrado

---

#### 2. Listar Doctores
```http
GET /doctors
```

**Respuesta (200):**
```json
[
  { "id": 1, "name": "Dr. Juan Perez" },
  { "id": 2, "name": "Dra. Ana Gomez" },
  { "id": 3, "name": "Dr. Luis Torres" }
]
```

---

#### 3. Agendar Cita
```http
POST /appointments
Content-Type: application/json

{
  "patient_id": 1,
  "doctor_id": 1,
  "start_iso": "2025-12-10T10:00:00",
  "duration_min": 60
}
```

**Respuesta (201):**
```json
{
  "id": 1,
  "doctor_id": 1,
  "patient_id": 1,
  "start_iso": "2025-12-10T10:00:00",
  "duration_min": 60
}
```

**Errores:**
- `400`: Campos obligatorios / Doctor no encontrado / Fecha fuera de horario / Cita en fin de semana
- `409`: Horario ya ocupado para ese doctor

---

#### 4. Listar Citas
```http
GET /appointments?patient_id=1
```

**Respuesta (200):**
```json
[
  {
    "id": 1,
    "doctor_id": 1,
    "doctor_name": "Dr. Juan Perez",
    "patient_id": 1,
    "patient_name": "Juan Pérez",
    "start_iso": "2025-12-10T10:00:00",
    "duration_min": 60,
    "status": "SCHEDULED"
  }
]
```

---

#### 5. Cancelar Cita
```http
DELETE /appointments/1
```

**Respuesta (200):**
```json
{ "ok": true }
```

**Errores:**
- `404`: Cita no encontrada

---

## Validaciones Implementadas

### Backend
- **Email:** Validación RFC5322 (usando librería `validator`)
- **Teléfono:** 7–15 dígitos (se ignoran caracteres no numéricos)
- **Citas solapadas:** Se bloquean si otro paciente tiene cita con el mismo doctor en el mismo horario
- **Horario de atención:** Lunes a viernes, 08:00–18:00 (configurable vía env vars `WORK_START_HOUR`, `WORK_END_HOUR`)
- **Fines de semana:** No se permiten citas los sábados ni domingos

### Frontend
- **Campos obligatorios:** Se validan antes de enviar
- **Email:** Validación básica (contiene @ y .)
- **Fines de semana:** Input de fecha deshabilita selección de weekends en el navegador
- **Horario:** Se limita el input de hora al rango de atención del doctor

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

**Técnicas de selección:**
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

**Técnicas de selección:**
- **Valores límite:** 0 caracteres (campos vacíos)
- **Particiones de equivalencia:**
  - Emails sin @: `not-an-email`
  - Emails sin dominio: `test@` (no implementado en test pero servidor lo bloquea)
- **Datos inválidos:** Propositalmente formateo incorrecto

**Por qué:** Los casos de validación son **críticos para la seguridad e integridad de datos**. Si no validamos, el sistema se llena de registros basura.

---

### Test 3: Intento de agendar cita en horario ya ocupado (double-booking)

**Objetivo:** Validar que el sistema impide que dos pacientes agendan con el mismo doctor en el mismo horario.

**Pasos:**
1. Registrar paciente A y paciente B
2. Seleccionar doctor y hora X (ej: 2025-12-10 11:00)
3. Agendar para paciente A → Éxito
4. Intentar agendar para paciente B en la misma hora y doctor → Error "Horario ya ocupado"

**Técnicas de selección:**
- **Condición límite:** Dos citas exactamente en el mismo rango de tiempo
- **Particiones de equivalencia:**
  - Horas disponibles (partición 1): sin conflicto → éxito
  - Horas ocupadas (partición 2): con conflicto → error
- **Datos válidos:** Dos pacientes distintos, mismo doctor, mismo horario

**Por qué:** Este test valida la **lógica de negocio crítica**. Un doctor no puede atender dos pacientes a la vez. Sin este control, el sistema es inútil.

---

### Test 4: Cancelación de cita

**Objetivo:** Verificar que el usuario puede cancelar una cita agendada y que el estado cambia a "CANCELLED".

**Pasos:**
1. Registrar paciente
2. Agendar cita
3. Refrescar lista de citas
4. Hacer clic en botón "Cancelar"
5. Verificar que el estado de la cita ahora es "CANCELLED"

**Técnicas de selección:**
- **Caso nominal:** Una cita existente en estado SCHEDULED se cancela
- **Particiones de equivalencia:**
  - Citas SCHEDULED (partición 1): pueden cancelarse
  - Citas CANCELLED (partición 2): ya están canceladas (no testeado aquí pero contemplado)

**Por qué:** La cancelación es una **operación esencial** para que el usuario tenga control. Sin ella, los usuarios quedan atrapados.

---

## Selección de Datos de Prueba: Justificación Técnica

### Validación de Email
- **RFC5322:** Se usa librería `validator.isEmail()` que valida estándares reales
- **Test inválido:** `not-an-email` → falta el símbolo @
- **Test válido:** `testuser@example.com` → email bien formado

### Validación de Teléfono
- **Rango permitido:** 7–15 dígitos (alcanza celulares nacionales e internacionales)
- **Test válido:** `3001234567` (10 dígitos, formato Colombia)
- **Test inválido:** `3001234` (7 dígitos, en el límite; se acepta. El test usa `not-an-email` para email, no para teléfono)

### Selección de Fechas
- **Horario de atención:** 08:00–18:00, lunes–viernes (configurable)
- **Test válido:** Próximo día laboral (p. ej., miércoles 10 de diciembre a las 10:00)
- **Test inválido:** No se testea directamente, pero el backend lo bloquea si es fin de semana
- **Solapamiento:** Dos citas a las 11:00 el mismo día con el mismo doctor → conflicto

### Duración de Cita
- **Default:** 60 minutos
- **Validación:** Se suma a `start_iso` y se compara con rango horario del doctor y otras citas

---

## Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | 3000 | Puerto del servidor |
| `RESET_DB` | (none) | Si es `1`, borra y recrea la BD al arrancar (para tests) |
| `NODE_ENV` | (none) | Si es `test`, también borra la BD |
| `WORK_START_HOUR` | 8 | Hora de inicio de atención (inclusive) |
| `WORK_END_HOUR` | 18 | Hora de cierre de atención (exclusive) |

### Ejemplo: Cambiar horario a 09:00–19:00
```bash
$env:WORK_START_HOUR='9'; $env:WORK_END_HOUR='19'; npm start
```

---

## CI/CD (GitHub Actions)

El archivo `.github/workflows/e2e.yml` ejecuta automáticamente:
1. `npm ci` → Instala dependencias (versiones exactas)
2. `npm run prepare` → Instala navegadores de Playwright
3. Arranca servidor con `RESET_DB=1` en background
4. `npx playwright test` → Ejecuta suite E2E
5. Si **todos los tests pasan**, imprime `OK` en la salida

**Triggeriza en:**
- Push a `main`
- Pull requests

---

## Requisitos del Examen (Cumplidos)

✅ **API REST (Node.js/Express)** con validación de email/teléfono  
✅ **Frontend (HTML/CSS/JS)** con formularios y lista de citas  
✅ **Validación de solapamiento** de horarios por doctor  
✅ **Cancelación de citas**  
✅ **Pruebas E2E (Playwright)** que cubren:
  - ✅ Flujo completo: registro + agendamiento exitoso
  - ✅ Validación de datos (email inválido, campos vacíos)
  - ✅ Intento de double-booking (error esperado)
  - ✅ Cancelación de cita
✅ **Técnicas de selección de datos:**
  - Valores límite (7 dígitos teléfono, campos vacíos)
  - Particiones de equivalencia (email válido vs. inválido)
  - Datos válidos e inválidos
✅ **Workflow de GitHub Actions** que ejecuta tests automáticamente e imprime "OK" al pasar  
✅ **Documentación** (este README)

---

## Estructura de Dependencias

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "body-parser": "^1.20.2",
    "sqlite3": "^5.1.6",
    "dayjs": "^1.11.9",
    "validator": "^13.9.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.36.0"
  }
}
```

---

## Troubleshooting

### Puerto 3000 en uso
```bash
# Windows PowerShell
netstat -ano | findstr ":3000"
Stop-Process -Id <PID> -Force
```

### Tests fallan con timeout
- Verificar que el servidor arrancó correctamente (revisar logs en CI)
- Asegurar que hay conexión a localhost:3000

### BD corrupta
```bash
# Eliminar BD y dejar que se recree
rm db.sqlite
npm start
```

---

## Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/tu-feature`)
3. Haz commit (`git commit -m 'Add feature'`)
4. Push (`git push origin feature/tu-feature`)
5. Abre una Pull Request

---

## Licencia

MIT

---

## Autor

Andrés García  
Examen: Sistema de Reserva de Citas Médicas (Diciembre 2025)
