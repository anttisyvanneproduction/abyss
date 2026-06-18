#!/bin/sh
# Abyss Stack statusline — outputs current mode badge for Claude Code status bar.
FLAG="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/.abyss-active"

[ -f "$FLAG" ] || exit 0

MODE=$(cat "$FLAG" | tr -d '[:space:]')

case "$MODE" in
  off)    exit 0 ;;
  on)     echo "⚡ Abyss" ;;
  roast)  echo "🔥 Abyss:roast" ;;
  safe)   echo "🛡 Abyss:safe" ;;
  *)      echo "⚡ Abyss:$MODE" ;;
esac
