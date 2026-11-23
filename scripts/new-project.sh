#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
NAME=${1:-my-vibe-app}
MODE=${2:-}
if [[ $# -gt 2 || ! "$NAME" =~ ^[a-zA-Z0-9][a-zA-Z0-9_-]*$ || ( -n "$MODE" && "$MODE" != "--push" ) ]]; then
  printf 'Usage: %s [project-name] [--push]\n' "$0" >&2
  exit 2
fi
if [[ -e "$NAME" ]]; then
  printf 'Refusing to overwrite existing path: %s\n' "$NAME" >&2
  exit 1
fi
command -v git >/dev/null
git var GIT_AUTHOR_IDENT >/dev/null
if [[ "$MODE" == "--push" ]]; then
  command -v gh >/dev/null
  gh auth status >/dev/null
fi
bash "$ROOT/scripts/bootstrap.sh"
export PATH="$HOME/.local/bin:$PATH"
mkdir -- "$NAME"
cd -- "$NAME"
git init -b main
uv init --bare --python 3.12 --vcs none
uv add --dev ruff pytest
mkdir -p scripts tests .claude .devcontainer docs/workflows
cp "$ROOT/scripts/bootstrap.sh" scripts/
cp "$ROOT/scripts/cloud-session.sh" scripts/
cp "$ROOT/scripts/codespaces.sh" scripts/
cp "$ROOT/scripts/check.sh" scripts/
cp "$ROOT/.claude/settings.json" .claude/
cp "$ROOT/docs/workflows/check.yml" docs/workflows/
cp "$ROOT/.gitignore" .
cat > scripts/setup.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
bash "$ROOT/scripts/bootstrap.sh"
export PATH="$HOME/.local/bin:$PATH"
cd "$ROOT"
uv sync --locked
EOF
cat > .devcontainer/devcontainer.json <<'EOF'
{
  "name": "Matt Jones LLC · Python workspace",
  "image": "mcr.microsoft.com/devcontainers/python:1-3.12-bookworm",
  "features": {"ghcr.io/devcontainers/features/github-cli:1": {}},
  "postCreateCommand": "bash scripts/codespaces.sh",
  "remoteEnv": {"PATH": "${containerEnv:PATH}:/home/vscode/.local/bin"}
}
EOF
cat > AGENTS.md <<'EOF'
# Project instructions for AI agents

The rulebook for every AI tool here (Claude Code, Codex, ChatGPT). CLAUDE.md imports it.

- Use uv add <package> and uv run <command>. Never use raw pip.
- Start with bash scripts/setup.sh; keep uv.lock committed.
- After editing Python, run uv run ruff check --fix . and uv run pytest.
- Before committing, run bash scripts/check.sh.
- Never commit .env files, API keys, credentials, or .venv/.
- Startup prepares dependencies; it must not create repos, commit, push, or deploy.
- Add tests for actual behavior. Explain changes and verification.
EOF
cat > CLAUDE.md <<'EOF'
# Claude Code instructions

@AGENTS.md

Add or change rules in AGENTS.md, not here, so every AI tool follows them.
EOF
cat > main.py <<'EOF'
def greeting(name: str) -> str:
    return f"Hello, {name}!"


if __name__ == "__main__":
    print(greeting("world"))
EOF
cat > tests/test_main.py <<'EOF'
from main import greeting


def test_greeting_uses_the_supplied_name():
    assert greeting("Matt") == "Hello, Matt!"
EOF
cat >> pyproject.toml <<'EOF'

[tool.pytest.ini_options]
pythonpath = ["."]
testpaths = ["tests"]
EOF
printf '# %s\n\nA Matt Jones, LLC project.\n\n## Development\n\n```bash\nbash scripts/setup.sh\nuv run python main.py\nbash scripts/check.sh\nclaude\n```\n\nOpen in GitHub Codespaces for an automatically configured environment. For Claude cloud, use scripts/bootstrap.sh as the environment setup script; the committed session hook installs project dependencies after cloning. The check workflow template lives in docs/workflows/check.yml; copy it into .github/workflows after granting GitHub CLI the workflow scope.\n' "$NAME" > README.md
uv lock
bash scripts/check.sh
git add .
git commit -m "Initialize Claude-ready Python project"
if [[ "$MODE" == "--push" ]]; then
  gh repo create "Matt-Jones-LLC/$NAME" --private --source=. --remote=origin --push
fi
printf '\nReady: cd %s && claude\n' "$NAME"
