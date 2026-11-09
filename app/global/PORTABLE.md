# SKILL_DEY fuera de OpenCode

> Creado por **Ing. Dey** ([@IngDey](https://github.com/IngDey))

- **Claude Code, Gemini CLI y Antigravity CLI:** ya no hace falta nada manual. El instalador deja el paquete nativo de cada una, con el guardián en vivo (bloqueos, copia antes de cada cambio, `deshaz`, cero errores). Mira `MULTI-IA.md`.
- **Cursor, Codex, Copilot y otras:**
  1. **Reglas:** `node ~/.config/opencode/skill_dey/skill_dey.mjs multi-ia .` dentro de tu proyecto.
  2. **Revisiones por código (0 tokens):** `node ~/.config/opencode/skill_dey/skill_dey.mjs revisar <carpeta>` (y `documentar`, `seguridad`, `validar`, `produccion`, `organizar`…). Pídele a tu IA que los corra antes de entregar.
  3. Sin guardián en vivo: haz `git commit` tú como punto de retorno antes de cambios grandes.
