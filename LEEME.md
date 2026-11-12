# SKILL DEY 41

El estándar de desarrollo con IA para tus apps: entiende lo que pides, construye **sin romper** la app, no entrega nada con **errores**, con pruebas profesionales, seguridad, documentación, video de capacitación y el menor gasto de tokens posible.

Nativo en **OpenCode, Claude Code, Gemini CLI y Antigravity CLI**, con el mismo guardián en vivo en las cuatro. También funciona con Cursor, Windsurf, Claude Desktop, Cline, Copilot y Codex (reglas + servidor MCP).

## Instalar (elige tu sistema)
- **Mac / Linux:** doble clic en `INSTALAR.command` (o en terminal: `bash INSTALAR.command`).
- **Windows:** doble clic en `INSTALAR.bat`.

Necesitas Node.js 20+ (y se recomienda Git). Al final el instalador confirma la versión instalada. El instalador detecta qué IAs tienes y deja SKILL DEY en cada una. Si tu IA pregunta "¿confías en esta carpeta?", respondes tú. Luego cierra y abre tu IA.

También puedes instalarlo desde tu IA:
- **Claude Code:** `/plugin marketplace add IngDey/SKILL-DEY-Enterprise-Agentic-Framework-AI-Development-Suite` y luego `/plugin install skill-dey@skill-dey`
- **Gemini CLI:** `gemini extensions install ./hosts/gemini-cli`
- **Antigravity CLI:** `agy plugin install ./hosts/antigravity`

## Usar
No necesitas comandos: escribe normal. `deshaz` revierte el último cambio (`deshaz solo <archivo>`, `vuelve a antes de <pedido>`, `historial`, `¿dónde quedamos?`). `finalizar skill dey` / `iniciar skill dey` lo apagan y encienden. Detalle de instalación: `docs/LEEME-INSTALACION.md`.

## Carpetas de este paquete
- `app/` — la fuente única (motor, guardián, skills, agentes, instaladores).
- `hosts/` — los paquetes listos para Claude Code, Gemini CLI y Antigravity CLI.
- `docs/` — guía de instalación, notas de versión y registro de pruebas.
- `tests/` — pruebas automáticas (`npm test`).

---
Creado por **Ing. Dey** ([@IngDey](https://github.com/IngDey)) · Ingeniero de Sistemas, Especialista en Gerencia Informática, experto en IA, automatizaciones y análisis de procesos · Licencia MIT
