# SKILL_DEY — instalación detallada (OpenCode y las demás IAs)

La versión está en `app/skill_dey/VERSION` y el instalador la muestra y la confirma al final. Instala en OpenCode y, si los tienes, también en Claude Code, Gemini CLI y Antigravity CLI.

## Instalar o actualizar
| Sistema | Qué hacer |
|---|---|
| **Windows** | Extrae el zip y haz doble clic en `INSTALAR.bat` |
| **macOS** | Extrae el zip y haz doble clic en `INSTALAR.command`. Si macOS lo bloquea, abre *Terminal* y pega: `bash ~/Downloads/SKILL-DEY-v41.0.0/instalar.sh` |
| **Linux** | `bash instalar.sh` |

- Si tienes Node usa el instalador principal; si no, uno de respaldo (PowerShell o bash).
- Reinstalar es seguro: actualiza todo y **conserva lo aprendido** (`~/.config/opencode/skill_dey/`).
- Al terminar verás `[OK] Versión instalada: vX (confirmado)`. Cierra y abre OpenCode y escribe `/skill_dey version`.

## Uso
Abre OpenCode en tu proyecto y escribe normal. `/skill_dey ayuda` lista los atajos. Para volver atrás escribe "deshaz".

## Pruebas en Chrome (consola, errores JS, red)
- Escribe **"revisa la consola en chrome"** o `/skill_dey chrome [url]`. Usa el Chrome, Edge o Brave que ya tienes instalado (no descarga nada si lo encuentra).
- Recorre las páginas y reporta errores y avisos de consola, excepciones JS, peticiones fallidas y respuestas 4xx/5xx. Deja capturas de las páginas con error en `.skill_dey/shots/sitio/`.
- `visible`: ves a Chrome navegando. Usa un perfil propio de skill_dey que recuerda tu inicio de sesión.
- `conectar`: usa un Chrome que ya tengas abierto con depuración. Si no lo encuentra, te da el comando exacto para abrirlo.
- Si la URL no es de tu equipo (producción) entra en **solo lectura**: máximo 15 páginas y nunca sigue enlaces que cambian datos (borrar, aprobar, pagar, enviar, salir…).
- Si interrumpes con Esc, el navegador y las pruebas se cortan al momento.

## Proyectos enormes
Si el proyecto tiene miles de archivos, skill_dey te sugiere abrir OpenCode en la subcarpeta que tiene el código (por ejemplo `server`). Además pausa la documentación automática y, si no hay git, guarda una copia de cada archivo antes de editarlo (deshacer sigue funcionando sin congelar).

## Base de datos: prohibido borrar
No elimina bases de datos ni tablas, no vacía datos (DROP, TRUNCATE, DELETE sin WHERE, migrate:fresh/reset) y no escribe esos comandos en archivos. El guardián lo bloquea. Antes de modificar datos reales exige un respaldo.

## Sin OpenCode (terminal, cualquier IA)
`node ~/.config/opencode/skill_dey/skill_dey.mjs ayuda` (incluye `chrome [carpeta] [url] --visible --conectar`). También queda un servidor MCP para Cursor, Windsurf, Claude Desktop y Cline (`skill_dey/MULTI-IA.md`).
