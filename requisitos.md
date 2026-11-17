# Requisitos externos y configuración

Guía para preparar los servicios externos que necesita **Cuida lo que te mueve**. La aplicación usa Expo y Supabase; los tres servidores MCP remotos (Supabase, Stitch y Expo) se conectan por separado desde VS Code.

## 1. Herramientas locales

- Node.js LTS y npm.
- Git.
- Para Android físico o emulador: Android Platform Tools (`adb`). En un teléfono, activa las opciones de desarrollador y la depuración USB, conecta el cable y acepta el permiso de depuración.
- Expo Go instalado en el dispositivo para una ejecución de desarrollo. Las notificaciones locales están disponibles en Expo Go; las notificaciones remotas no son parte de esta implementación.

Instala las dependencias del repositorio con `npm install`. No subas `.env` al repositorio.

## 2. Configurar Supabase (obligatorio)

1. Crea o selecciona un proyecto de desarrollo en Supabase.
2. En **Project Settings → API**, copia la URL del proyecto y la clave publicable.
3. En la raíz del proyecto, crea `.env` a partir de `.env.example` y completa:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICABLE
   ```

   La clave publicable puede estar en la app; nunca pongas una clave `service_role` en una variable `EXPO_PUBLIC_*`.

4. El esquema está versionado en [`supabase/migrations/20261115141200_create_vehicle_maintenance.sql`](./supabase/migrations/20261115141200_create_vehicle_maintenance.sql). Para aplicarlo manualmente, ejecuta el contenido de ese archivo una sola vez en **SQL Editor**; no ejecutes también el bloque de referencia de abajo. Si las tablas ya existen, compara primero el esquema y las políticas para evitar sobrescribir cambios.

   ```sql
   create table public.vehicles (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null default auth.uid()
       references auth.users(id) on delete cascade,
     type text not null
       check (type in ('car', 'motorcycle', 'bicycle', 'scooter')),
     name text not null,
     brand text,
     model text,
     year int check (year between 1950 and 2100),
     plate text,
     current_km int not null default 0 check (current_km >= 0),
     created_at timestamptz not null default now()
   );

   create table public.maintenance_records (
     id uuid primary key default gen_random_uuid(),
     vehicle_id uuid not null
       references public.vehicles(id) on delete cascade,
     user_id uuid not null default auth.uid()
       references auth.users(id) on delete cascade,
     service_type text not null,
     service_date date not null default current_date,
     odometer_km int not null check (odometer_km >= 0),
     cost numeric(10, 2) not null default 0 check (cost >= 0),
     notes text,
     next_due_km int check (next_due_km >= 0),
     next_due_date date,
     created_at timestamptz not null default now()
   );

   create index maintenance_records_vehicle_date_idx
     on public.maintenance_records (vehicle_id, service_date desc);

   alter table public.vehicles enable row level security;
   alter table public.maintenance_records enable row level security;

   create policy vehicles_owner on public.vehicles
     for all to authenticated
     using ((select auth.uid()) = user_id)
     with check ((select auth.uid()) = user_id);

   create policy maintenance_owner on public.maintenance_records
     for all to authenticated
     using ((select auth.uid()) = user_id)
     with check (
       (select auth.uid()) = user_id
       and exists (
         select 1
         from public.vehicles v
         where v.id = vehicle_id
           and v.user_id = (select auth.uid())
       )
     );
   ```

5. En **Authentication → URL Configuration**, añade las URLs de retorno que realmente utilice cada plataforma. En este proyecto la lista estaba vacía y el *Site URL* era `http://localhost:3000`; para web local, usa el origen y ruta del servidor Expo (normalmente `http://localhost:8081/auth/callback`). Para Android, permite el esquema `deber7://auth/callback`; para Expo Go, usa la URL exacta que produzca `makeRedirectUri`, no una URL inventada. Configura el *Site URL* al origen web de desarrollo o al sitio real, según el flujo.
6. En **Authentication → Providers → Email**, decide si exigir confirmación de correo. Si la dejas activa, configura el envío de correo y confirma la cuenta antes de iniciar sesión. Los registros de este proyecto mostraron que el SMTP de prueba de Resend no puede enviar a destinatarios arbitrarios; para ellos, verifica un dominio y usa un remitente de ese dominio. Desactivarla es solo una opción para un proyecto de demostración sin datos reales.

### Inicio de sesión con Google (opcional)

Si quieres habilitar el botón de Google, activa Google en **Authentication → Providers**, configura las credenciales OAuth en el panel y registra la URL de retorno de Supabase (`https://<PROJECT_REF>.supabase.co/auth/v1/callback`) en Google Cloud. Agrega también los deep links de la app a la lista de Redirect URLs de Supabase. Los registros del proyecto indicaron que el proveedor Google no estaba habilitado. La implementación está en [`src/services/googleAuth.service.ts`](./src/services/googleAuth.service.ts). No compartas el secreto de cliente en el código móvil.

### SMTP de confirmación con Resend

La confirmación de correo está activa y el SMTP personalizado de Resend ya aparece habilitado en Supabase. Se configuró el remitente de prueba `onboarding@resend.dev`; la contraseña se guarda cifrada en Supabase y no se muestra en el formulario. La activación no confirma por sí sola la entrega: registra una cuenta de prueba y revisa que llegue el correo.

El remitente de prueba de Resend puede limitar los destinatarios y no sirve para usuarios arbitrarios. Antes de publicar o permitir registros de otros usuarios, verifica un dominio de envío en Resend, agrega sus registros DNS y cambia el remitente por una dirección de ese dominio. No pongas la API key en `.env`, código, configuración MCP ni en el chat; se introduce únicamente en el campo Password de SMTP en Supabase.

Resend ofrece direcciones de prueba como `delivered@resend.dev` para simular entregas; no son buzones reales para recibir enlaces de confirmación.

## 3. Permisos de notificaciones locales

La app solicita el permiso de notificaciones al encontrar servicios programados. Debes aceptar el aviso del sistema operativo; si se deniega, los estados seguirán visibles en la app, pero el teléfono no mostrará recordatorios.

- En Android, el canal se crea en tiempo de ejecución. Comprueba también que las notificaciones de la app no estén deshabilitadas en Ajustes.
- Las fechas se programan a las 9:00 hora local. Se programa un aviso 15 días antes y otro el día previsto cuando la fecha todavía está en el futuro.
- Los avisos por kilometraje se evalúan cuando se abre o vuelve a enfocarse la pantalla principal; la app no puede conocer el kilometraje nuevo mientras está cerrada.
- La configuración no requiere credenciales de Expo Push ni un servidor de notificaciones remotas.

## 4. Configuración de los servidores MCP (opcional para ejecutar la app)

Los servidores MCP son herramientas de desarrollo y no son necesarios para que la aplicación móvil se conecte con Supabase.

1. En Stitch, inicia sesión y abre **Stitch Settings → API Keys → Create Key**. Copia la clave y guárdala solo en el entorno local de tu usuario.
2. En Windows, abre **Editar las variables de entorno de la cuenta** y crea `STITCH_API_KEY` con el valor de la clave. Cierra completamente y vuelve a abrir VS Code para que cargue la variable. No pegues la clave en el chat ni en archivos del repositorio.
3. El `.mcp.json` de la raíz apunta a `https://stitch.googleapis.com/mcp` y lee la clave desde `${STITCH_API_KEY}` en el encabezado `X-Goog-Api-Key`. No reemplaces el marcador con la clave.
4. Autoriza Supabase cuando el cliente lo solicite. Si usas un proyecto distinto, actualiza el `project_ref` de Supabase en `.mcp.json` para que coincida con la URL de `.env`.
5. Los servidores MCP (Supabase, Stitch y Expo) se configuran en VS Code de forma independiente de la app. La conexión remota de Expo MCP no requiere iniciar Metro.
6. Consulta [Uso de los MCP](./docs/uso-de-los-mcp.md) y la [guía de demo](./docs/GUIA_DEMO_MCP_RITA_FIX.md) para ejemplos de solicitudes, límites y solución de problemas.

No uses el MCP de Supabase para abrir políticas RLS a `anon` ni para ejecutar cambios destructivos sin revisar el alcance y el SQL.

## 5. Arranque de desarrollo

Desde la raíz del proyecto:

```bash
npm install
npx expo start
```

Escanea el QR con Expo Go o abre la app desde un emulador conectado. Para usar Android directamente, también puedes iniciar con `npx expo start --android`.

## 6. Generar APK para pruebas

El perfil `preview` de `eas.json` genera un APK instalable para distribución interna. Configura en Expo los valores públicos `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, inicia sesión en EAS y ejecuta:

```bash
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

El primer uso puede solicitar enlazar el repositorio a un proyecto EAS y definir el identificador Android. La generación del perfil está configurada, pero un APK solo se considera generado cuando el build remoto termina correctamente.
