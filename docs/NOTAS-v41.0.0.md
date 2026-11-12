## SKILL DEY v41.0.0 — la v38.14.1, ahora también en Claude Code, Gemini CLI y Antigravity CLI

**ES** · Parte de la v38.14.1: en OpenCode todo funciona igual. Lo nuevo es que el **mismo guardián** ahora corre en Claude Code, Gemini CLI y Antigravity CLI.

### Instalar
1. Descarga `SKILL-DEY-v41.0.0.zip` (abajo) y descomprímelo. Necesitas Node.js 20+ y, recomendado, Git.
2. Doble clic en `INSTALAR.bat` (Windows) o `INSTALAR.command` (macOS/Linux). Detecta tus IAs y deja SKILL DEY en cada una; al final confirma la versión.
3. Reinicia tu IA y escribe normal.

En Claude Code también puedes: `/plugin marketplace add IngDey/SKILL-DEY-Enterprise-Agentic-Framework-AI-Development-Suite` y `/plugin install skill-dey@skill-dey`.

### Novedades
- **Guardián de la v38 en Claude Code, Gemini CLI y Antigravity CLI:** solo cambia lo que pides (pregunta antes de tocar otro archivo), no reescribe archivos enteros, razona antes de tocar (`Entendí · Causa · Plan`), avisa el impacto de cada edición, deshace (`deshaz`, `deshaz solo <archivo>`, `vuelve a antes de <pedido>`), verifica gratis al terminar y vuelve solo al estado sano si rompe algo que funcionaba, y recuerda dónde quedaron.
- **Una sola fuente de reglas** (`app/skill_dey-lib/guardia.ts`) para las cuatro IAs. El guardián de OpenCode decide exactamente igual que en la v38.14.1 (probado lado a lado).
- **Más protección:** bloquea `curl … | sh` y equivalentes de PowerShell; reconoce claves de Anthropic, OpenAI, Google, GitHub, Slack y AWS temporales.
- **Arreglado:** responder *"sí"* con tilde no se tomaba como autorización (en OpenCode y en las demás).
- **Servidor MCP:** protocolo hasta 2025-11-25; nuevas `skill_dey_verificar`, `skill_dey_deshacer` (con rehacer e historial) y `skill_dey_congelar`; marca qué herramientas son destructivas; menos tokens por mensaje que la v38 (1.019 frente a 1.049) con 3 herramientas más.
- **Nueva skill `politicas-ia`:** política de uso seguro de IA para las personas de la empresa.
- **Calidad:** 36 pruebas automáticas en Windows, macOS y Linux; `claude plugin validate` y `gemini extensions validate` sin avisos.

### Límites conocidos
- Cambio de modelo según la tarea o al agotarse el cupo, y tablero de consumo: solo en OpenCode.
- En Gemini y Antigravity no se exige el "Entendí · Causa · Plan" (no entregan la conversación de forma legible).
- El paquete de Antigravity sigue la especificación oficial, pero aún no se probó con `agy` en un equipo real.

---

**EN** · Built on v38.14.1 (OpenCode behaves exactly the same). The **same guardian** now runs in Claude Code, Gemini CLI and Antigravity CLI: changes only what you ask, no whole-file rewrites, reason before touching, edit impact, undo, free verification at the end with automatic rollback if it breaks what worked, and session continuity. Also: one rule source for all four AIs, `curl | sh` blocking, modern secret patterns, a fix for accented "sí" approvals, a modern MCP server (protocol up to 2025-11-25, verify/undo/freeze, fewer tokens), the new `politicas-ia` skill and 36 automated tests on Windows, macOS and Linux.

MIT © 2026 Ing. Dey (@IngDey)
