# Cuida lo que te mueve 🚗🏍️🚲🛴

**Cuida lo que te mueve** es una aplicación móvil desarrollada con **Expo (React Native)**, **Uniwind con Tailwind CSS v4** y **Supabase**, diseñada para gestionar de forma integral el mantenimiento preventivo y correctivo de vehículos (autos, motocicletas, bicicletas y scooters).

La aplicación calcula automáticamente el estado del próximo servicio (**«Al día»**, **«Próximo»** o **«Vencido»**) según kilometraje y fecha límite, permitiendo llevar un historial detallado y el gasto total acumulado por vehículo.

El proyecto utiliza servidores MCP remotos como herramientas de desarrollo independientes de la aplicación: Supabase para el backend, Stitch para apoyo de diseño y Expo para documentación y servicios de Expo. Stitch requiere una API key personal proporcionada mediante la variable de entorno local `STITCH_API_KEY`.

---

## 📋 Características Principales

- **Diseño Moderno con Tailwind CSS**: Estilizado mediante **Uniwind** utilizando clases utilitarias (`className`) nativas y de alto rendimiento.
- **Estructura Arquitectónica Estándar**: Carpetas convencionales (`(auth)`, `(app)`, `components`, `context`, `services`, `hooks`, `lib`, `types`, `utils`) con nomenclatura en español para los componentes de dominio (`vehiculo`, `mantenimiento`, `Boton`, `EntradaTexto`, `InsigniaEstado`).
- **Autenticación Segura (RF-01)**: Registro e inicio de sesión con Supabase Auth y persistencia local mediante AsyncStorage.
- **CRUD Completo de Vehículos (RF-02)**: Gestión de autos, motos, bicicletas y scooters con campos de marca, modelo, año, placa y kilometraje actual.
- **Filtros por Tipo de Vehículo (RF-07)**: Filtrado instantáneo por categoría desde la pantalla principal.
- **CRUD de Mantenimientos (RF-03)**: Registro de servicios con fecha, odómetro, costo, observaciones y programación de próximo servicio por km o fecha.
- **Historial y Gasto Acumulado (RF-04)**: Vista cronológica de mantenimientos con suma en tiempo real del gasto total por vehículo.
- **Avisos Locales**: Recordatorios al aproximarse o llegar la fecha programada, y avisos al abrir la app cuando un mantenimiento está próximo o vencido por kilometraje.
- **Motor de Reglas de Próximo Servicio (RF-05 / 3.4)**:
  - 🔴 **Vencido**: La fecha límite ya pasó o el odómetro alcanzó el límite programado.
  - 🟡 **Próximo**: Faltan 500 km o menos, o 15 días o menos para el vencimiento.
  - 🟢 **Al día**: Mantenimiento vigente.
- **Seguridad RLS (RF-06)**: Cada usuario accede y modifica únicamente sus propios datos mediante Row Level Security en Postgres.

---

## 🛠️ MCP para el desarrollo

| Servidor MCP | Tipo | Propósito y Rol en el Proyecto |
|---|---|---|
| **Supabase MCP** | HTTP remoto | Consultar el proyecto y su esquema desde el cliente MCP autorizado. Las operaciones de escritura requieren revisar el alcance antes de ejecutarlas. |
| **Stitch MCP** | HTTP remoto | Generación y consulta de diseños UI mediante el endpoint oficial de Stitch y la API key local `STITCH_API_KEY`. La clave no se guarda en Git. |
| **Expo MCP** | HTTP remoto | Documentación y herramientas de Expo Services mediante OAuth. La conexión no inicia Metro ni la aplicación. |

La conexión MCP efectiva depende del cliente, su autorización y el estado de cada servidor; la configuración presente en disco no prueba por sí sola que todos estén conectados.

---

## 🏗️ Estructura del Software

```
cuida-lo-que-te-mueve/
├── .mcp.json                        # Configuración de proyecto para Copilot CLI
├── .vscode/mcp.json                 # Configuración MCP de workspace para VS Code
├── .env                             # Variables de entorno de Supabase (NO SUBIR AL REPO)
├── .env.example                     # Plantilla de variables de entorno
├── eas.json                         # Perfil EAS interno para generar un APK de prueba
├── metro.config.js                  # Configuración de Metro con withUniwindConfig
├── requisitos.md                    # Guía detallada de configuración externa paso a paso
├── docs/
│   └── mcp-evidence/                # Bitácora de pruebas MCP
└── src/
    ├── global.css                   # Importación de Tailwind CSS y Uniwind
    ├── app/                         # Rutas de Expo Router (Móvil)
    │   ├── _layout.tsx              # Disposición raíz con import de global.css y guardia
    │   ├── index.tsx                # Redirección inicial según sesión
    │   ├── (auth)/                  # Rutas públicas (login.tsx, register.tsx)
    │   └── (app)/                   # Rutas privadas protegidas
    │       ├── _layout.tsx
    │       ├── index.tsx            # Lista principal con filtros
    │       ├── vehiculo/
    │       │   ├── [id].tsx         # Detalle de vehículo e historial
    │       │   └── formulario.tsx   # Formulario de alta y edición de vehículo
    │       └── mantenimiento/
    │           └── formulario.tsx   # Formulario de alta y edición de servicio
    ├── components/ui/               # Componentes con Tailwind CSS (Boton, EntradaTexto, InsigniaEstado)
    ├── context/                     # Proveedor de autenticación (AuthProvider.tsx)
    ├── hooks/                       # Hooks personalizados (useVehiculos.ts, useMantenimiento.ts)
    ├── lib/                         # Cliente singleton de Supabase (supabase.ts)
    ├── services/                    # Acceso a datos (vehiculos.service.ts, mantenimiento.service.ts)
    ├── types/                       # Tipos de TypeScript y esquema de base de datos
    └── utils/                       # Utilidad de reglas de estado de servicio (estadoServicio.ts)
```

---

## 🚀 Cómo Ejecutar el Proyecto Localmente

### 1. Prerrequisitos
- Node.js 20 o superior.
- Android Studio con SDK y emulador configurado (`adb devices`).
- Cuenta en Supabase.

Para pasos de configuración de Supabase, Google opcional, avisos locales y MCP, consulta [`requisitos.md`](./requisitos.md).

### 2. Instalación de dependencias
```bash
npm install
```

### 3. Configuración de variables de entorno
Edita `.env` con tus credenciales de Supabase:
```env
EXPO_PUBLIC_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_clave_anon_o_publishable_aqui
```

### 4. Iniciar la aplicación en Android

Primero pruébala con Expo Go y confirma que abre, permite iniciar sesión y cargar la lista. No es necesario generar un build para esta prueba.

```bash
npx expo start --go
```

### 5. APK de prueba (solo después de validar Expo Go)

No inicies este paso hasta que la prueba con Expo Go funcione y decidas que necesitas un APK. El perfil `preview` de [`eas.json`](./eas.json) está preparado para una compilación EAS de distribución interna:

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

En Expo, configura `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` para el entorno usado por el build. Son variables públicas incluidas en la app; nunca uses una clave `service_role` o `sb_secret_*`. La primera configuración de EAS puede solicitar una cuenta, crear/enlazar un proyecto y definir el identificador Android.

---

## 📹 Video de Demostración (TikTok)

Enlace al video de TikTok (máximo 5 minutos) mostrando las integraciones MCP que estén conectadas y los resultados en la app móvil:
- **Enlace:** `[PENDIENTE: PEGAR AQUI EL ENLACE DEL VIDEO DE TIKTOK]`

Consulta la [guía de demostración MCP](./docs/GUIA_DEMO_MCP_RITA_FIX.md) para el guion, prompts, límites de las integraciones y estado de validación.

---

## 📑 Bitácora de Evidencias MCP

Revisa la carpeta [`docs/mcp-evidence/`](./docs/mcp-evidence/README.md) para consultar la bitácora de evidencias MCP.

La guía de uso y configuración de cada servidor está en [`docs/uso-de-los-mcp.md`](./docs/uso-de-los-mcp.md).
