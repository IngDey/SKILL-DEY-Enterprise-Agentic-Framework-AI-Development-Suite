#!/usr/bin/env bash
# Linux / macOS: detecta el sistema y usa Node si existe; si no, instalador de respaldo. Muestra y confirma la versión.
cd "$(dirname "$0")"
V="$(cat app/skill_dey/VERSION 2>/dev/null || echo '?')"
printf '\n  SKILL_DEY v%s · instalador (OpenCode, Claude Code, Gemini, Antigravity)\n\n' "$V"
if command -v node >/dev/null 2>&1 && node -e "process.exit(Number(process.versions.node.split('.')[0]) < 18 ? 1 : 0)"; then node app/instalador/instalar.mjs; else bash app/instalador/instalar-sin-node.sh; fi || printf '\n  [!] El instalador terminó con error (mira el mensaje de arriba).\n'
OCD="${OPENCODE_CONFIG_DIR:-$HOME/.config/opencode}"
I="$(cat "$OCD/skill_dey/VERSION" 2>/dev/null || echo '?')"
if [ "$I" = "$V" ]; then printf '\n  [OK] Versión instalada: v%s (confirmado)\n' "$I"; else printf '\n  [!] Esperaba v%s y quedó v%s: vuelve a ejecutar el instalador\n' "$V" "$I"; fi
printf '  Cierra y abre tu IA. En OpenCode, para comprobar: /skill_dey version\n'
