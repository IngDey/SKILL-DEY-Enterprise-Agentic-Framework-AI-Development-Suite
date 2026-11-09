## SKILL DEY v40.0.0 — nativo en Claude Code, Gemini CLI y Antigravity CLI

**ES** · SKILL DEY deja de ser solo de OpenCode: ahora se instala de forma nativa en **Claude Code, Gemini CLI y Antigravity CLI**, con el **mismo guardián en vivo** en las cuatro IAs.

### Instalar
1. Descarga `SKILL-DEY-v40.0.0.zip` (abajo) y descomprímelo. Necesitas Node.js 20+ (y se recomienda Git).
2. Doble clic en `INSTALAR.bat` (Windows) o `INSTALAR.command` (macOS/Linux). Detecta tus IAs y deja SKILL DEY en cada una.
3. Reinicia tu IA y escribe normal.

En Claude Code también puedes: `/plugin marketplace add IngDey/SKILL-DEY-Enterprise-Agentic-Framework-AI-Development-Suite` y `/plugin install skill-dey@skill-dey`.

### Novedades
- **Guardián en vivo en Claude Code, Gemini CLI y Antigravity CLI** (hooks): copia antes de cada pedido, `deshaz`, bloqueos, sintaxis al instante y cero errores al cerrar. Una sola fuente de reglas para las cuatro IAs.
- **Más protección de datos:** bloquea borrar o vaciar bases de datos y tablas, `DELETE` sin `WHERE`, `migrate:fresh`, `prisma migrate reset`, `git reset --hard` y `curl … | sh`. Más patrones de secretos (Anthropic, OpenAI, Google, GitHub, Slack).
- **`deshaz` instantáneo en Claude Code**, sin gastar tokens del modelo.
- **Servidor MCP moderno:** protocolo hasta 2025-11-25, anotaciones de solo lectura/destructiva, nuevas herramientas `skill_dey_verificar`, `skill_dey_deshacer`, `skill_dey_rehacer`, `skill_dey_historial`, `skill_dey_congelar`, `skill_dey_multi_ia`.
- **Nueva skill `politicas-ia`:** política de uso seguro de IA para las personas de la empresa.
- **Instalador único** para OpenCode, Claude Code, Gemini CLI y Antigravity CLI.
- **Calidad:** 30 pruebas automáticas en Windows, macOS y Linux (GitHub Actions), `claude plugin validate` y `gemini extensions validate` sin errores.
- **Corrección:** `git push -f` sin nombre de rama no se detectaba como push forzado.

### Límites conocidos
- El cambio automático de modelo y el tablero de consumo siguen siendo solo de OpenCode.
- El paquete de Antigravity sigue la especificación oficial, pero aún no se probó con `agy` en un equipo real.

---

**EN** · SKILL DEY is no longer OpenCode-only: it now installs natively in **Claude Code, Gemini CLI and Antigravity CLI**, with the **same live guardian** in all four AIs. Highlights: live guardian via hooks, stronger database protection, zero-token undo in Claude Code, a modern MCP server (protocol up to 2025-11-25, tool annotations, undo/redo/verify tools), a new `politicas-ia` skill for safe AI use at work, one installer for every AI, and 30 automated tests on Windows, macOS and Linux.

MIT © 2026 Ing. Dey (@IngDey)
