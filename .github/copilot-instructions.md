# Reglas del agente

## Seguridad
- Nunca leas, imprimas ni registres el contenido de `.env`, claves, tokens ni secretos.
- Nunca ejecutes `git add .env`. Antes de cada commit ejecuta `git status` y confirma que no hay secretos.
- Usa solo el proyecto de Supabase indicado en `.vscode/mcp.json` (`project_ref`). Es un proyecto de pruebas sin datos reales.
- No desactives RLS para resolver problemas. No ejecutes operaciones destructivas (`DELETE` sin filtro, `DROP`, `TRUNCATE`) sin mi aprobación explícita en el chat.
- No consultes la tabla `auth.users`: contiene correos reales.
- Con Mobile-MCP usa solo Expo Go y la app Rodaje. Nunca escribas contraseñas ni uses cuentas personales.
- Los servidores MCP son herramientas de desarrollo: no van dentro de la app ni son necesarios para que funcione.

## Honestidad
- No afirmes que algo funciona si no lo ejecutaste y lo comprobaste. Distingue Hecho, Verificado y No verificado.
- Antes de instalar paquetes o configurar un servidor MCP, comprueba la documentación oficial. Si algo de este manual no coincide con la documentación, detente y repórtalo en lugar de improvisar.
- No inventes herramientas MCP ni comandos. Si una herramienta no existe, dilo.

## Ahorro de tokens
- Consulta solo la tabla o el archivo necesario. Usa filtros y límites en las consultas.
- No repitas consultas ya hechas ni releas archivos que ya conoces.
- No generes documentación duplicada.

## Método
- Ejecuta solo la fase que te pida el usuario y detente. No avances a la siguiente sin la orden continuar.
- Si el proyecto ya existe, no lo recrees: revisa y adapta.
- Haz un commit al terminar cada fase que modifique archivos.
