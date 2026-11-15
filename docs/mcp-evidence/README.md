# Bitacora de Evidencia MCP — "Cuida lo que te mueve"

Esta carpeta contiene las capturas de pantalla y el registro de cada uso de los 3 servidores MCP durante el desarrollo y demostracion del proyecto.

## Instrucciones

1. Guarda cada captura de pantalla en esta carpeta con el nombre indicado.
2. Completa la tabla de abajo con el prompt exacto que usaste y el resultado obtenido.
3. Esta bitacora es parte del entregable — incluye las capturas en el Word de arquitectura.

---

## Registro de usos MCP

| # | MCP | Herramienta llamada | Prompt enviado | Resultado obtenido | Captura |
|---|---|---|---|---|---|
| 1 | **Figma** | `get_design_context` | "Usa el MCP de Figma para obtener el contexto del frame node-id=1-6 del archivo https://www.figma.com/design/5Wb7iE6fsv9uVMHgVRiF8k/Sin-titulo y dime los colores y componentes" | _(completa al usar)_ | `01_figma_diseno.png` |
| 2 | **Supabase** | `list_tables` | "Con el MCP de Supabase, lista todas las tablas del proyecto euqzmsqpvfnadhpvwznu" | _(completa al usar)_ | `02_supabase_tablas.png` |
| 3 | **Supabase** | `get_advisors` | "Revisa el security advisor y confirma que RLS esta activo en vehicles y maintenance_records" | _(completa al usar)_ | `03_supabase_rls.png` |
| 4 | **mobile-mcp** | `list_devices` | "Usa mobile-mcp para listar los dispositivos Android conectados" | _(completa al usar)_ | `04_mobile_lista.png` |
| 5 | **mobile-mcp** | `tap` / `type` | "En la app registra usuario prueba1@correo.com contrasena Test123456" | _(completa al usar)_ | `05_mobile_registro.png` |
| 6 | **mobile-mcp** | `tap` / `type` | "Crea vehiculo tipo moto, nombre Mi Pulsar, marca Bajaj, 12000 km" | _(completa al usar)_ | `06_mobile_vehiculo.png` |
| 7 | **mobile-mcp** | `tap` / `type` | "Agrega mantenimiento Cambio de aceite, costo 25, proximo 15000 km" | _(completa al usar)_ | `07_mobile_mantenimiento.png` |
| 8 | **mobile-mcp** | `tap` / `type` | "Intenta guardar mantenimiento con km negativo -500" | _(completa al usar)_ | `08_mobile_validacion.png` |

---

## Capturas esperadas

```
docs/mcp-evidence/
├── README.md                    <- esta bitacora
├── 01_figma_diseno.png          <- resultado del MCP de Figma
├── 02_supabase_tablas.png       <- lista de tablas via MCP Supabase
├── 03_supabase_rls.png          <- confirmacion de RLS activo
├── 04_mobile_lista.png          <- lista de dispositivos Android
├── 05_mobile_registro.png       <- registro de usuario en la app
├── 06_mobile_vehiculo.png       <- creacion de vehiculo
├── 07_mobile_mantenimiento.png  <- registro de mantenimiento
└── 08_mobile_validacion.png     <- validacion de km negativos
```

---

## Prompts listos para copiar

### Figma MCP
```
Usa el MCP de Figma para obtener el contexto del diseno del frame node-id=1-6 
del archivo https://www.figma.com/design/5Wb7iE6fsv9uVMHgVRiF8k/Sin-titulo
y dime los colores y componentes que tiene.
```

### Supabase MCP — listar tablas
```
Con el MCP de Supabase, lista todas las tablas del proyecto euqzmsqpvfnadhpvwznu.
```

### Supabase MCP — verificar RLS
```
Revisa el security advisor del proyecto euqzmsqpvfnadhpvwznu y confirma 
que RLS esta activo en las tablas vehicles y maintenance_records.
```

### mobile-mcp — detectar dispositivos
```
Usa mobile-mcp para listar los dispositivos Android conectados.
```

### mobile-mcp — flujo completo de prueba
```
En la app abierta en el emulador Android:
1. Registra un usuario con email prueba1@correo.com y contrasena Test123456
2. Crea un vehiculo: tipo moto, nombre "Mi Pulsar", marca Bajaj, modelo NS200, anio 2022, 12000 km
3. Agrega un mantenimiento: tipo "Cambio de aceite", fecha hoy, 12000 km, costo 25, proximo a 15000 km
4. Intenta guardar otro mantenimiento con km -500 y captura el mensaje de validacion
Haz una captura de pantalla en cada paso.
```
