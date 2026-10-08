# SKILL_DEY portable — para Claude Code, Cursor, Codex u otra IA (fuera de OpenCode)

> Creado por **Ing. Dey** ([@IngDey](https://github.com/IngDey))

El guardián (bloqueos y verificación en vivo) solo corre dentro de OpenCode. Pero las **reglas** y las **revisiones por código** sí son portables:

1. **Reglas:** pega el contenido de `agents/skill_dey.md` (entre los marcadores SKILL_DEY-AGENTE) en el archivo de instrucciones de tu IA (CLAUDE.md, .cursorrules, AGENTS.md…). Así cualquier IA sigue la ley de prioridades, la escalera de esfuerzo, el plan y la salida comprimida.
2. **Revisiones por código (0 tokens), en cualquier terminal con Node:**
   - `node ~/.config/opencode/skill_dey/skill_dey.mjs revisar <carpeta>` — sintaxis, tipos, lint + seguridad/lógica
   - `node .../skill_dey.mjs documentar|empalme|reglas|notas|validar|produccion|organizar|formato|pdf <carpeta>`
   Pídele a tu IA que corra estos comandos antes de entregar; el resultado es exacto y no depende del modelo.
3. Lo único que NO viaja: los bloqueos automáticos en tiempo real (secretos, comandos peligrosos, copia por turno). En otras IA, haz `git commit` tú como punto de retorno.
