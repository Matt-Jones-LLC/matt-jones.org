#!/usr/bin/env bash
# Repeatable tool setup. Safe before a repository has been cloned.
set -euo pipefail
export PATH="$HOME/.local/bin:$PATH"
if ! command -v uv >/dev/null 2>&1; then
  installer=$(mktemp)
  trap 'rm -f "$installer"' EXIT
  curl --fail --silent --show-error --location https://astral.sh/uv/install.sh -o "$installer"
  UV_NO_MODIFY_PATH=1 sh "$installer"
fi
uv python install 3.12
uv --version
