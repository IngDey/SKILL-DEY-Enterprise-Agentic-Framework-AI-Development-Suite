# SKILL_DEY

El estándar de desarrollo para tus apps: entiende lo que pides, construye **sin romper** la app, no entrega nada con **errores**, con pruebas profesionales, seguridad, documentación, video de capacitación y el menor gasto de tokens posible. Funciona en **OpenCode** y, como multi‑IA, también en Cursor, Windsurf, Claude Code/Desktop, Copilot, Codex, Gemini y Cline.

## Instalar (elige tu sistema)
- **Mac / Linux:** doble clic en `INSTALAR.command` (o en terminal: `bash INSTALAR.command`).
- **Windows:** doble clic en `INSTALAR.bat`.

Eso copia todo a `~/.config/opencode`, registra el servidor MCP en las IAs que tengas y deja el CLI listo. Cierra y abre OpenCode.

## Usar
No necesitas comandos: escribe normal y hace todo. Atajos: `/skill_dey ayuda`.

## Multi‑IA (otras IAs)
- Reglas para todas: dentro de tu proyecto → `node ~/.config/opencode/skill_dey/skill_dey.mjs multi-ia .`
- Registrar el MCP en tus IAs (un comando): `node ~/.config/opencode/skill_dey/registrar-mcp.mjs`
- CLI en cualquier terminal: `node ~/.config/opencode/skill_dey/skill_dey.mjs <revisar|seguridad|pruebas|capacitar|movil|organizar|documentar>`
- Guía completa de conexión: `~/.config/opencode/skill_dey/MULTI-IA.md`

## Carpetas de este paquete
- `app/` — todo lo que se instala (no necesitas abrirlo; lo usa el instalador).
- `docs/` — guía de instalación detallada y el registro de pruebas.

> El guardián automático en vivo (copias antes de cada cambio, verificación al cerrar, cambio de modelo, tablero de consumo) corre dentro de OpenCode. En otras IAs tienes las reglas + los chequeos (CLI/MCP).

---
Creado por **Ing. Dey** ([@IngDey](https://github.com/IngDey)) · Licencia MIT
