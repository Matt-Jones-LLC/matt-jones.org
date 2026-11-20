#!/usr/bin/env bash
set -euo pipefail
if [[ "${CLAUDE_CODE_REMOTE:-}" == "true" ]]; then
  bash "${CLAUDE_PROJECT_DIR:?Missing project directory}/scripts/setup.sh"
fi
