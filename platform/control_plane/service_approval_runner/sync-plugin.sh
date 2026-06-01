#!/usr/bin/env bash
# Refresh the baked-in copy of the service-onboarding plugin from a local
# checkout. Run before `docker build` so the image ships current SKILL.md
# files, schemas, and bundled snapshots.
#
# Usage: ./sync-plugin.sh [/path/to/service-onboarding]
set -euo pipefail

SRC="${1:-${SERVICE_ONBOARDING_SRC:-$HOME/dev/LL/service-onboarding}}"
DEST="$(cd "$(dirname "$0")" && pwd)/plugin"

if [[ ! -d "$SRC" ]]; then
  echo "ERROR: plugin source not found at $SRC" >&2
  echo "Pass the path explicitly or set SERVICE_ONBOARDING_SRC." >&2
  exit 1
fi

echo "Syncing plugin from $SRC -> $DEST"
rm -rf "$DEST"
mkdir -p "$DEST"

for name in .claude .claude-plugin .mcp.json commands skills rules schemas tools data; do
  if [[ -e "$SRC/$name" ]]; then
    cp -R "$SRC/$name" "$DEST/$name"
  fi
done

echo "Done. Plugin contents:"
ls -la "$DEST"
