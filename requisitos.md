# Guia de Requisitos y Configuracion Externa
## "Cuida lo que te mueve" — Expo + Supabase + 3 MCP

---

## 1. Lo que YA esta hecho (no tocar)

| Archivo | Estado |
|---|---|
| `src/` — toda la app (pantallas, servicios, hooks, componentes) | Completo |
| `.env` — credenciales de Supabase | Completo |
| `.mcp.json` y `.vscode/mcp.json` — 3 servidores MCP | Completo |
| `metro.config.js` — Uniwind + Tailwind CSS | Completo |
| TypeScript | 0 errores |

---

## 2. Lo que DEBES hacer tu (pasos externos)

### PASO 1 — Crear las tablas en Supabase (OBLIGATORIO)

1. Abre: https://supabase.com/dashboard/project/euqzmsqpvfnadhpvwznu/sql/new
2. Pega y ejecuta este SQL completo:

```sql
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('car','motorcycle','bicycle','scooter')),
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
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  service_type text not null,
  service_date date not null default current_date,
  odometer_km int not null check (odometer_km >= 0),
  cost numeric(10,2) not null default 0 check (cost >= 0),
  notes text,
  next_due_km int check (next_due_km >= 0),
  next_due_date date,
  created_at timestamptz not null default now()
);

create index on public.maintenance_records (vehicle_id, service_date desc);

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
    and exists (select 1 from public.vehicles v
                where v.id = vehicle_id and v.user_id = (select auth.uid()))
  );
```

### PASO 2 — Desactivar confirmacion de email (para pruebas)

1. Abre: https://supabase.com/dashboard/project/euqzmsqpvfnadhpvwznu/auth/providers
2. Seccion "Email" > desmarca **"Confirm email"** > Save

### PASO 3 — Instalar Android Studio y crear emulador

1. Descarga Android Studio: https://developer.android.com/studio
2. Abre Android Studio > Virtual Device Manager > Create Device
3. Elige Pixel 7 / API 34 (Android 14)
4. Verifica que `adb` funciona: `adb devices`

### PASO 4 — Instalar Node.js 20+

- Descarga: https://nodejs.org/en (LTS, v20 o superior)
- Verifica: `node --version`

---

## 3. Configuracion de los 3 MCP en VS Code

### Ubicacion de los archivos MCP

```
deber7/
├── .mcp.json              <- archivo principal (en la raiz)
└── .vscode/
    └── mcp.json           <- copia para VS Code Copilot
```

### Contenido actual de `.mcp.json`

```json
{
  "servers": {
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp"
    },
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=euqzmsqpvfnadhpvwznu&features=database,docs,development,debugging"
    },
    "mobile-mcp": {
      "type": "stdio",
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@mobilenext/mobile-mcp@latest"]
    }
  }
}
```

### Como activar los MCP en VS Code

1. Abre VS Code en la carpeta `deber7`
2. Abre el chat de GitHub Copilot (Ctrl+Shift+I o icono Copilot)
3. Cambia al modo **Agent** (selector arriba del chat)
4. En el panel "MCP Servers" (o desde `.vscode/mcp.json`) haz clic en **Start** para cada servidor
5. Figma pedira autorizacion en el navegador — acepta
6. Supabase pedira autorizacion OAuth — acepta y selecciona la organizacion

---

## 4. Demos de MCP para el video (capturas requeridas)

Guarda cada captura en `docs/mcp-evidence/`.

### Demo 1: Figma MCP

**Archivo Figma:** https://www.figma.com/design/5Wb7iE6fsv9uVMHgVRiF8k/Sin-titulo?node-id=1-6

En el chat de Copilot Agent escribe:
```
Usa el MCP de Figma para obtener el contexto del diseno del frame node-id=1-6 
del archivo https://www.figma.com/design/5Wb7iE6fsv9uVMHgVRiF8k/Sin-titulo
y dime los colores y componentes que tiene.
```

Captura: `docs/mcp-evidence/01_figma_diseno.png`

### Demo 2: Supabase MCP

En el chat de Copilot Agent escribe (uno por vez):
```
Con el MCP de Supabase, lista todas las tablas del proyecto euqzmsqpvfnadhpvwznu.
```
```
Revisa el security advisor del proyecto y confirma que RLS esta activo 
en las tablas vehicles y maintenance_records.
```

Capturas: `docs/mcp-evidence/02_supabase_tablas.png`, `03_supabase_rls.png`

### Demo 3: mobile-mcp

Primero inicia la app:
```bash
npx expo start --android
```

Luego en el chat de Copilot Agent escribe:
```
Usa mobile-mcp para listar los dispositivos Android conectados.
```
```
En la app abierta en el emulador, registra un usuario con email prueba1@correo.com 
y contrasena Test123456. Luego crea un vehiculo tipo moto, nombre "Mi Pulsar", 
marca Bajaj, modelo NS200, anio 2022, 12000 km. Captura cada paso.
```
```
Agrega un mantenimiento al vehiculo: tipo "Cambio de aceite", 
fecha de hoy, 12000 km, costo 25, proximo a 15000 km. Captura el resultado.
```
```
Intenta guardar un mantenimiento con km negativos (-500) y reporta 
que mensaje de validacion muestra la app.
```

Capturas: `docs/mcp-evidence/04_mobile_lista.png`, `05_mobile_registro.png`, `06_mobile_vehiculo.png`, `07_mobile_mantenimiento.png`, `08_mobile_validacion.png`

---

## 5. Iniciar la app

```bash
# Instalar dependencias (si no estan instaladas)
npx expo install

# Iniciar en Android (emulador debe estar abierto)
npx expo start --android

# Lint y typecheck
npx expo lint
npx tsc --noEmit
```

---

## 6. Credenciales del proyecto

| Variable | Valor |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://euqzmsqpvfnadhpvwznu.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_KEY` | `sb_publishable_geszVYCyIZEumjdBI3m_cA_17MbGlWb` |
| Supabase project_ref | `euqzmsqpvfnadhpvwznu` |
| Figma file key | `5Wb7iE6fsv9uVMHgVRiF8k` |
| Figma node | `1-6` |

> **IMPORTANTE:** Nunca subas el archivo `.env` a GitHub. Ya esta en `.gitignore`.

---

## 7. Estructura completa de la app

```
deber7/
├── .mcp.json                        <- 3 servidores MCP (en la raiz)
├── .vscode/mcp.json                 <- copia para VS Code Copilot
├── .env                             <- credenciales Supabase (NO subir a git)
├── .env.example                     <- plantilla de variables
├── metro.config.js                  <- Uniwind + Tailwind CSS v4
├── requisitos.md                    <- esta guia
├── docs/mcp-evidence/               <- capturas y bitacora MCP
└── src/
    ├── global.css                   <- @import "tailwindcss"; @import "uniwind";
    ├── app/
    │   ├── _layout.tsx              <- raiz: global.css + AuthProvider + RouteGuard
    │   ├── index.tsx                <- redireccion inicial segun sesion
    │   ├── (auth)/
    │   │   ├── _layout.tsx
    │   │   ├── login.tsx            <- pantalla de inicio de sesion
    │   │   └── register.tsx         <- pantalla de registro
    │   └── (app)/
    │       ├── _layout.tsx
    │       ├── index.tsx            <- lista de vehiculos con filtros
    │       ├── vehiculo/
    │       │   ├── [id].tsx         <- detalle + historial + estado
    │       │   └── formulario.tsx   <- crear/editar vehiculo
    │       └── mantenimiento/
    │           └── formulario.tsx   <- crear/editar mantenimiento
    ├── components/ui/
    │   ├── Boton.tsx                <- boton con Tailwind CSS
    │   ├── EntradaTexto.tsx         <- input con Tailwind CSS
    │   └── InsigniaEstado.tsx       <- badge: Al dia / Proximo / Vencido
    ├── context/
    │   └── AuthProvider.tsx         <- sesion Supabase Auth
    ├── hooks/
    │   ├── useVehiculos.ts          <- hook reactivo de vehiculos
    │   └── useMantenimiento.ts      <- hook reactivo de mantenimientos
    ├── lib/
    │   └── supabase.ts              <- cliente Singleton Supabase + AsyncStorage
    ├── services/
    │   ├── vehiculos.service.ts     <- CRUD de vehiculos
    │   └── mantenimiento.service.ts <- CRUD de mantenimientos
    ├── types/
    │   ├── database.types.ts        <- tipos TypeScript de Supabase
    │   └── declarations.d.ts        <- declaraciones de tipos para CSS
    └── utils/
        └── estadoServicio.ts        <- regla: Al dia / Proximo / Vencido
```

---

## 8. Bitacora MCP (plantilla)

Copia esta tabla en `docs/mcp-evidence/README.md` para cada uso de MCP:

| # | MCP usado | Herramienta | Prompt enviado | Resultado | Captura |
|---|---|---|---|---|---|
| 1 | Figma | get_design_context | "Extrae colores del frame node-id=1-6..." | Colores y estructura extraidos | 01_figma_diseno.png |
| 2 | Supabase | list_tables | "Lista las tablas del proyecto..." | Tablas vehicles y maintenance_records | 02_supabase_tablas.png |
| 3 | Supabase | get_advisors | "Revisa el security advisor..." | RLS activo en ambas tablas | 03_supabase_rls.png |
| 4 | mobile-mcp | list_devices | "Lista los dispositivos Android..." | Emulador Pixel 7 detectado | 04_mobile_lista.png |
| 5 | mobile-mcp | tap / type | "Registra usuario prueba1@correo.com..." | Usuario creado y sesion iniciada | 05_mobile_registro.png |
| 6 | mobile-mcp | tap / type | "Crea vehiculo Mi Pulsar..." | Vehiculo creado en la lista | 06_mobile_vehiculo.png |
| 7 | mobile-mcp | tap / type | "Agrega mantenimiento cambio de aceite..." | Mantenimiento registrado | 07_mobile_mantenimiento.png |
| 8 | mobile-mcp | tap / type | "Intenta km negativos -500..." | Validacion mostrada correctamente | 08_mobile_validacion.png |

---

## 9. Guion del video TikTok (5 min max)

**Estructura sugerida:**

| Tiempo | Lo que muestras | Lo que dices |
|---|---|---|
| 0:00–0:30 | Pantalla del chat Copilot Agent | "Voy a mostrar como 3 servidores MCP trabajan juntos en VS Code Copilot Agent" |
| 0:30–1:30 | Demo Figma MCP: prompt + resultado | "Le pido al agente que extraiga el diseno de mi archivo Figma..." |
| 1:30–3:00 | Demo Supabase MCP: tablas + RLS | "Ahora le pido que liste las tablas y verifique la seguridad RLS..." |
| 3:00–4:30 | Demo mobile-mcp: registro + CRUD | "Con mobile-mcp el agente usa la app en el emulador como si fuera un usuario..." |
| 4:30–5:00 | App corriendo con datos reales | "La app Cuida lo que te mueve en accion — mantenimiento de vehiculos con IA" |

---

## 10. Plantilla analisis de arquitectura (Word)

### 1. Descripcion del sistema
App movil para registro y seguimiento de mantenimiento de vehiculos (autos, motos, bicicletas, scooters). Tecnologias: Expo SDK 57, React Native 0.86, TypeScript, Supabase (PostgreSQL + Auth + RLS), Tailwind CSS v4 via Uniwind.

### 2. Diagrama de arquitectura
Capas: Presentacion (Expo Router + componentes) → Logica (hooks + services) → Datos (Supabase BaaS).

### 3. Patrones de diseno identificados
| Patron | Implementacion |
|---|---|
| Singleton | `src/lib/supabase.ts` — cliente unico reutilizado en todo el proyecto |
| Provider / Context | `src/context/AuthProvider.tsx` — estado de sesion compartido |
| Service / Repository | `src/services/vehiculos.service.ts` y `mantenimiento.service.ts` |
| Custom Hooks | `src/hooks/useVehiculos.ts` y `useMantenimiento.ts` |
| Protected Routes | Grupos `(auth)` y `(app)` en Expo Router |

### 4. Seguridad
- Row Level Security activo en ambas tablas de Supabase
- Solo clave publishable expuesta en la app (nunca service_role)
- Politicas RLS: cada usuario solo ve y modifica sus propios datos
- Cascada de eliminacion: borrar vehiculo elimina sus mantenimientos

### 5. Uso de los 3 servidores MCP
| MCP | Rol en el proyecto | Herramienta demostrada |
|---|---|---|
| Figma | Extraccion de diseno (colores, estructura) | get_design_context |
| Supabase | Gestion de base de datos por prompt | list_tables, get_advisors |
| mobile-mcp | Pruebas automatizadas en emulador Android | list_devices, tap, type, screenshot |
