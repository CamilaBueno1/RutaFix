# Uso de los MCP

Este proyecto configura Supabase, Stitch y Expo como herramientas remotas de desarrollo. No forman parte de la aplicación móvil ni son necesarios para ejecutarla.

## Configuración en VS Code

El `.mcp.json` de la raíz declara los tres servidores para Copilot. La variable `${STITCH_API_KEY}` se resuelve desde el entorno del usuario y no debe reemplazarse por la clave literal en el archivo.

### Stitch MCP

Stitch ofrece un MCP HTTP en `https://stitch.googleapis.com/mcp`. El servidor oficial espera la API key en el encabezado `X-Goog-Api-Key`.

1. Abre [Stitch](https://stitch.withgoogle.com/) e inicia sesión.
2. Abre tu perfil → **Stitch Settings → API Keys → Create Key** y copia la clave.
3. En Windows, busca **Editar las variables de entorno de la cuenta**. Agrega una variable de usuario llamada `STITCH_API_KEY` cuyo valor sea la clave.
4. Cierra completamente VS Code y vuelve a abrirlo para que el proceso herede la variable. Abre este repositorio y acepta la confianza/inicio del servidor Stitch si se solicita.
5. En Copilot Chat, pide una acción de solo lectura para comprobar la conexión, por ejemplo:

   > Usa Stitch MCP para listar mis proyectos. No crees ni modifiques diseños.

6. Expande la llamada de herramienta y confirma que fue ejecutada por Stitch y devuelve los proyectos de tu cuenta.

No escribas la clave en el chat, no la pongas en `.mcp.json`, `.env`, capturas ni commits. Si la clave se expone, revócala y genera otra. La referencia `${STITCH_API_KEY}` en la configuración requiere que VS Code arranque con esa variable de entorno disponible.

Configuración oficial de Stitch: [extensión mantenida en GitHub](https://github.com/gemini-cli-extensions/stitch), que documenta el endpoint MCP y el encabezado de API key.

### Supabase MCP

Supabase MCP permite consultar el esquema, políticas y documentación del proyecto autorizado. Antes de cualquier operación que escriba datos, altere tablas o elimine recursos, explica el alcance, muestra el SQL/parámetros y solicita aprobación. No consultes `auth.users` ni desactives RLS.

Prueba de solo lectura:

> Con Supabase MCP, lista las tablas y columnas del esquema `public`. No consultes filas ni modifiques el proyecto.

Confirma que la respuesta indica el proyecto correcto antes de continuar.

### Expo MCP

Expo MCP ofrece búsqueda y lectura de documentación oficial de Expo y herramientas de Expo Services. Conectarlo no inicia Metro ni ejecuta la aplicación.

Prueba de conexión (solo lectura):

> Usa Expo MCP para encontrar la documentación oficial de Expo Router para Expo SDK 57. Revisa `src/hooks/useVehiculos.ts` y explica brevemente cuándo se vuelve a cargar la lista de vehículos. Comparte el enlace oficial más relevante. No inicies Expo ni cambies archivos.

### Demostración integrada para el video

Este ejemplo verifica información útil del diseño, la base de datos y la navegación usando los tres MCP:

> Para una revisión rápida de RutaFix, usa Stitch, Supabase y Expo MCP. Stitch: recupera la pantalla existente “RutaFix - Registrar Mantenimiento (Paleta Oficial)” y resume sus campos principales. Supabase: muestra las columnas de `public.vehicles` y `public.maintenance_records`, y cuenta sus filas con consultas `SELECT COUNT(*)`; no consultes `auth.users` ni muestres datos personales. Expo: encuentra la documentación oficial de Expo Router compatible con Expo SDK 57 y comparte el enlace. Termina con cinco puntos que comparen qué campos del diseño existen en la base de datos y qué no. Distingue lo comprobado de lo inferido. Solo lectura: no escribas en Supabase ni Stitch, no modifiques archivos ni ejecutes Expo.

## Diagnóstico

- En VS Code, abre **Chat: Open Customizations → MCP Servers** y confirma que `supabase`, `stitch` y `expo` aparecen habilitados.
- Si Stitch no inicia, confirma que `STITCH_API_KEY` existe en las variables de entorno de usuario y reinicia VS Code por completo.
- Si una variable de usuario fue agregada después de iniciar VS Code, **Developer: Reload Window** puede no bastar; cierra todas las ventanas de VS Code y vuelve a abrirlo.
- Revisa la salida del servidor correspondiente desde el menú **…** junto a su nombre. Nunca compartas la API key en los logs.
- La disponibilidad de herramientas puede variar según la cuenta, el cliente y las capacidades actuales del servidor.
- Registra solo resultados realmente obtenidos en [`mcp-evidence/README.md`](./mcp-evidence/README.md).
