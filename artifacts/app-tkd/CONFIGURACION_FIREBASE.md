# Configuración de Firebase para App TKD

La app usa Firebase Authentication, Cloud Firestore y Firebase Storage. La sincronización en segundo plano de Firestore mantiene una caché local persistente; los cambios pendientes se envían al recuperar la conexión.

## Preparar el proyecto

1. En Firebase Console, habilita **Authentication → Correo electrónico/contraseña**.
2. Crea una base de datos de **Cloud Firestore**.
3. Activa **Storage** en el mismo proyecto.
4. Publica las reglas incluidas en `firestore.rules` y `storage.rules`:

   ```sh
   firebase deploy --only firestore:rules,storage
   ```

5. Agrega los seis valores de la app web a Replit Secrets con estos nombres:

   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

6. Reinicia la app. Crea la cuenta del administrador desde la pantalla inicial.

Las reglas guardan los datos bajo `schools/{uid}` y permiten el acceso solo a la cuenta autenticada con ese UID. Storage acepta imágenes de hasta 10 MB dentro de la carpeta del mismo usuario.

## Seguridad de la configuración web

Los valores de configuración de Firebase Web, incluido `apiKey`, se incorporan al cliente y pueden verse en el navegador. No son una contraseña del servidor. La protección depende de Firebase Authentication y de las reglas restrictivas de Firestore y Storage; no publiques reglas abiertas.

## Respaldos

Cuando un usuario autenticado abre la app con conexión, se guarda como máximo un respaldo JSON al día en `schools/{uid}/backups/`. El módulo de reportes también permite generar exportaciones manuales.
