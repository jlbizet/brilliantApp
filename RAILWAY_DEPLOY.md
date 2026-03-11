# Guía de Despliegue en Railway

Esta guía explica cómo desplegar este monorepo en Railway.

## 1. Conectar el Repositorio
1. Ve a [Railway Dashboard](https://railway.app/dashboard).
2. Haz clic en **"New Project"** -> **"Deploy from GitHub repo"**.
3. Selecciona tu repositorio.

## 2. Configurar Servicios
Debes añadir dos servicios desde el mismo repo:

### Backend
1. En Railway, selecciona el servicio que se creó.
2. En **Settings** -> **General** -> **Root Directory**, pon: `/backend`. 
   > [!IMPORTANT]
   > Asegúrate de que el "Root Directory" sea exactamente `/backend`. Si lo dejas vacío o en `/`, Railway no encontrará el `package.json` correcto y dará el error `npm: not found`.
3. **NO** cambies manualmente el "Build Command" en el panel de Railway. El archivo `railway.json` que he creado ya contiene los comandos necesarios.

### Frontend
1. Haz clic en **"New"** -> **"GitHub Repo"** y selecciona el mismo repo de nuevo.
2. En **Settings** -> **General** -> **Service Name**, cámbialo a `frontend`.
3. En **Settings** -> **General** -> **Root Directory**, pon: `/frontend`.
   > [!IMPORTANT]
   > Al igual que con el backend, esto es vital para que Railway sepa que es un proyecto de Node/Vite.


### Base de Datos
1. Haz clic en **"New"** -> **"Database"** -> **"Add PostgreSQL"**.
2. Railway inyectará automáticamente la variable `DATABASE_URL` en el backend si los vinculas o si configuras las variables manualmente.

## 3. Variables de Entorno

### Backend
Configura estas variables en la pestaña **Variables** del servicio Backend:
- `DATABASE_URL`: (Se genera automáticamente al añadir Postgres).
- `JWT_SECRET`: Una cadena aleatoria larga.
- `JWT_REFRESH_SECRET`: Otra cadena aleatoria larga.
- `FRONTEND_URL`: La URL pública de tu servicio Frontend de Railway.
- `PORT`: 3000 (o el que prefieras, Railway lo gestiona).
- `UPLOAD_DIR`: `./uploads` (o una ruta absoluta si usas un volumen).
- **Integraciones (Opcional pero Recomendado)**:
  - `GEMINI_API_KEY`: Tu clave de API de Google Gemini para el chatbot.
  - WhatsApp: `KAPSO_API_KEY`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `ENABLE_WHATSAPP_NOTIFICATIONS`.
  - Email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `ENABLE_EMAIL_NOTIFICATIONS`.
  - Google Calendar: `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID`.
Configura estas variables en la pestaña **Variables** del servicio Frontend:
- `VITE_API_URL`: La URL pública de tu servicio Backend de Railway.
- `VITE_CLINIC_TIMEZONE`: `America/Montevideo`

## 4. Webhooks
Una vez el backend esté desplegado, actualiza la URL del Webhook de WhatsApp en Kapso usando la URL de Railway:
`https://tu-backend-railway.up.railway.app/api/v1/whatsapp/webhook`
