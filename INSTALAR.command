#!/usr/bin/env bash
# macOS / Linux — doble clic
cd "$(dirname "$0")"
if command -v node >/dev/null 2>&1; then node app/instalador/instalar.mjs; else bash app/instalador/instalar-sin-node.sh; fi
echo; read -n 1 -s -r -p "Presiona una tecla para cerrar"
