#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
export PATH="$HOME/.local/bin:$PATH"
for script in scripts/*.sh; do bash -n "$script"; done
uv run ruff check .
uv run pytest
