#!/usr/bin/env bash
# Synchronize this checkout, without changing its dependency lock or Git history.
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
bash "$ROOT/scripts/bootstrap.sh"
export PATH="$HOME/.local/bin:$PATH"
cd "$ROOT"
uv sync --locked
printf '\nReady. Preview: uv run python -m http.server 4173 --directory site\n'
