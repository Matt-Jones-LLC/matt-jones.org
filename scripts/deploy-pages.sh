#!/usr/bin/env bash
# Publish only site/ while preserving the existing Pages branch history.
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"
if [[ -n "$(git status --porcelain)" ]]; then
  printf 'Commit or stash changes before deploying.\n' >&2; exit 1
fi
git push origin main
git fetch origin pages
DEST=$(mktemp -d)
rmdir "$DEST"
cleanup() { git worktree remove "$DEST" >/dev/null 2>&1 || true; }
trap cleanup EXIT
git worktree add --detach "$DEST" origin/pages
rsync -a --delete --exclude .git "$ROOT/site/" "$DEST/"
REV=$(git rev-parse --short HEAD)
git -C "$DEST" add -A
if ! git -C "$DEST" diff --cached --quiet; then
  git -C "$DEST" commit -m "Publish site from $REV"
  git -C "$DEST" push origin HEAD:pages
else
  printf 'Published files already match this source.\n'
fi
