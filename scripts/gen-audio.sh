#!/bin/bash
# Gera placeholders de áudio pt-BR (macOS: say + afconvert) e o manifesto de assets.
# Uso: bash scripts/gen-audio.sh [voz]    — padrão: Luciana
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/gen-audio.mjs "$@"
