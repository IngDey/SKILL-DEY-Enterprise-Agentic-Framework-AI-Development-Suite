# SKILL_DEY fuera de OpenCode

- **Claude Code, Gemini CLI y Antigravity CLI:** ya no hace falta nada manual. El instalador deja el paquete nativo de cada una con el guardián en vivo (el mismo de OpenCode). Mira `MULTI-IA.md`.
- **Cursor, Codex, Copilot, Windsurf, Cline y otras:**
  1. **Reglas:** `node ~/.config/opencode/skill_dey/skill_dey.mjs multi-ia .` dentro de tu proyecto.
  2. **Revisiones por código (0 tokens), en cualquier terminal con Node:**
     - `node ~/.config/opencode/skill_dey/skill_dey.mjs revisar <carpeta>` — sintaxis, tipos, lint + seguridad/lógica
     - `node .../skill_dey.mjs documentar|empalme|reglas|notas|validar|produccion|organizar|formato|pdf <carpeta>`
     Pídele a tu IA que corra estos comandos antes de entregar; el resultado es exacto y no depende del modelo.
  3. Sin guardián en vivo: haz `git commit` tú como punto de retorno antes de cambios grandes.
