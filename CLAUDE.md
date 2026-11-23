# Claude Code instructions

@AGENTS.md

`AGENTS.md` is the shared rulebook for every AI tool in this repository (Claude Code, Codex,
ChatGPT). Add or change rules there, not here. Only notes that apply to Claude alone belong below.

## Claude only

- Cloud sessions run `scripts/cloud-session.sh` at startup through `.claude/settings.json`. It
  only synchronizes dependencies; it must never create repositories, commit, push, or deploy.
