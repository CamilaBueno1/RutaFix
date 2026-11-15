# Análisis de Arquitectura — Aplicación Móvil "Cuida lo que te mueve"

**Fecha:** 15 de noviembre de 2026
**Desarrollador:** Camila Bueno
**Contacto:** camila.bueno@epn.edu.ec
**Repositorio:** https://github.com/CamilaBueno1/RutaFix

---

## 1. Descripción del Sistema

**Cuida lo que te mueve** es una aplicación móvil desarrollada con **Expo (React Native)**, **Uniwind con Tailwind CSS v4** y **Supabase**, diseñada para gestionar de forma integral el mantenimiento preventivo y correctivo de vehículos (autos, motocicletas, bicicletas y scooters).

La aplicación calcula automáticamente el estado del próximo servicio (**"Al día"**, **"Próximo"** o **"Vencido"**) según kilometraje y fecha límite, permitiendo llevar un historial detallado y el gasto total acumulado por vehículo.

### Tecnologías Utilizadas

| Capas | Tecnologías |
|---|---|
| **Frontend** | Expo SDK 57, React Native 0.86, TypeScript, Expo Router, Uniwind/Tailwind CSS v4 |
| **Backend** | Supabase (PostgreSQL + Auth + RLS + Storage) |
| **Stack** | React 19, React Native Reanimated 4, react-native-gesture-handler, async-storage, supabase-js |
| **Herramientas de desarrollo** | Metro bundler, TypeScript, ESLint, Git, MCP (Figma + Supabase + mobile-mcp) |

---

## 2. Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE MÓVIL (Expo)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Auth      │  │  Vehículos  │  │ Mantenimientos│        │
│  │  (Login/Reg)│  │  (CRUD)     │  │  (CRUD)       │        │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Hooks      │  │  Services   │  │  Context    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / JWT
┌────────────────────────▼────────────────────────────────────┐
│                     SUPABASE CLOUD                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  PostgreSQL │  │  Auth       │  │  Storage    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐                         │
│  │ RLS Policies│  │ Edge Functions (opcional)  │          │
│  └─────────────┘  └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Capas del Sistema

| Capa | Componentes | Responsabilidad |
|---|---|---|
| **Presentación** | Expo Router screens, components, UI (Uniwind) | Mostrar la interfaz, capturar entradas del usuario |
| **Lógica de negocio** | Hooks (`useVehiculos`, `useMantenimiento`), Services | Lógica de cálculo de estado de mantenimiento, validaciones |
| **Datos** | Supabase (PostgreSQL, Auth, RLS) | Persistencia, autenticación, seguridad |
| **Comunicación** | `supabase-js` cliente, HTTPS | Capas de abstracción hacia el backend |

---

## 3. Patrones de Diseño Identificados

| Patrón | Implementación |
|---|---|
| **Singleton** | `src/lib/supabase.ts` — cliente único reutilizado en todo el proyecto |
| **Provider / Context** | `src/context/AuthProvider.tsx` — estado de sesión compartido |
| **Service / Repository** | `src/services/vehiculos.service.ts` y `mantenimiento.service.ts` |
| **Custom Hooks** | `src/hooks/useVehiculos.ts` y `useMantenimiento.ts` |
| **Protected Routes** | Grupos `(auth)` y `(app)` en Expo Router |
| **Composición de componentes** | `src/components/ui/` — Boton, EntradaTexto, InsigniaEstado |
| **Regla de negocio** | `src/utils/estadoServicio.ts` — cálculo de Al día / Próximo / Vencido |

---

## 4. Seguridad

- **Row Level Security (RLS) activo** en ambas tablas de Supabase (`vehicles` y `maintenance_records`)
- **Solo clave publishable** expuesta en la app (nunca `service_role`)
- **Políticas RLS**: cada usuario solo ve y modifica sus propios datos
- **Cascada**: borrar un vehículo elimina sus mantenimientos relacionados
- **Autenticación**: registro e inicio de sesión con Supabase Auth

### Políticas RLS aplicadas

```sql
-- vehicles: solo propietario
CREATE POLICY vehicles_owner ON public.vehicles
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- maintenance_records: solo propietario + vehículo del propietario
CREATE POLICY maintenance_owner ON public.maintenance_records
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id
    AND exists (select 1 from public.vehicles v
                where v.id = vehicle_id and v.user_id = (select auth.uid())));
```

---

## 5. Dos Funcionalidades CRUD

### RF-02: CRUD de Vehículos

| Operación | Descripción | Tabla/Endpoint |
|---|---|---|
| **Create** | Registrarse de un nuevo vehículo (auto, moto, bicicleta, scooter) | `INSERT INTO public.vehicles` |
| **Read** | Listar vehículos del usuario con filtros por tipo | `SELECT FROM public.vehicles` |
| **Update** | Editar datos del vehículo (marca, modelo, año, placa, km) | `UPDATE public.vehicles` |
| **Delete** | Eliminar vehículo (con cascada a mantenimientos) | `DELETE FROM public.vehicles` |

### RF-03: CRUD de Mantenimientos

| Operación | Descripción | Tabla/Endpoint |
|---|---|---|
| **Create** | Registrar un servicio (tipo, fecha, odómetro, costo, notas) | `INSERT INTO public.maintenance_records` |
| **Read** | Ver historial de mantenimientos con gasto acumulado | `SELECT FROM public.maintenance_records` |
| **Update** | Editar un mantenimiento existente | `UPDATE public.maintenance_records` |
| **Delete** | Eliminar un mantenimiento | `DELETE FROM public.maintenance_records` |

---

## 6. Uso de los 3 Servidores MCP

| MCP | Rol en el proyecto | Herramienta demostrada |
|---|---|---|
| **Figma MCP** | Extracción de diseño (colores, estructura) | `get_design_context` — extrae colores y componentes de frames de diseño |
| **Supabase MCP** | Gestión de base de datos por prompt | `list_tables`, `get_advisors` — listar tablas, verificar RLS |
| **mobile-mcp** | Pruebas automatizadas en emulador Android | `list_devices`, `tap`, `type`, `screenshot` — automatizar flujos de prueba |

---

## 7. Estructura del Repositorio

```
RutaFix/
├── .env.example                    # Plantilla de variables de entorno
├── .mcp.json                       # Configuración de los 3 servidores MCP
├── .vscode/mcp.json                # Configuración de MCP para VS Code Copilot
├── AGENTS.md                       # Instrucciones para agentes de IA
├── LICENSE
├── README.md                       # Documentación principal
├── requisitos.md                   # Guía de configuración externa
├── metro.config.js                 # Metro + Uniwind
├── tsconfig.json
├── package.json
├── package-lock.json
├── app.json
├── docs/
│   └── mcp-evidence/
│       ├── README.md               # Bitácora de prompts y capturas
│       └── *.png                   # Capturas de prueba con MCP
└── src/
    ├── app/
    │   ├── _layout.tsx
    │   ├── index.tsx
    │   ├── (auth)/
    │   │   ├── _layout.tsx
    │   │   ├── login.tsx
    │   │   └── register.tsx
    │   └── (app)/
    │       ├── _layout.tsx
    │       ├── index.tsx
    │       ├── vehiculo/
    │       │   ├── _layout.tsx
    │       │   ├── [id].tsx
    │       │   └── formulario.tsx
    │       └── mantenimiento/
    │           └── formulario.tsx
    ├── components/ui/              # Boton, EntradaTexto, InsigniaEstado
    ├── context/AuthProvider.tsx
    ├── hooks/useVehiculos.ts, useMantenimiento.ts
    ├── lib/supabase.ts
    ├── services/vehiculos.service.ts, mantenimiento.service.ts
    ├── types/database.types.ts, declarations.d.ts, uniwind-types.d.ts
    └── utils/estadoServicio.ts
```

---

## 8. Próximos Pasos

1. Implementar Edge Functions de Supabase para lógica de negocio
2. Agregar paginación en listas de vehículos y mantenimientos
3. Integración con notificaciones push (expo-notifications)
4. Agregar exportación de datos (CSV/PDF)
5. Implementar tests unitarios y E2E con mobile-mcp
