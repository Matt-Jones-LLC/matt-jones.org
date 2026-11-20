# Matt Jones LLC — project instructions

This is the company website and development launchpad for the team behind Cool Matt Games.
Leadership: Matt Jones, Founder & CEO; Aaron Oviedo, Founding Advisor.
Read README.md before making changes. Public website files live only in `site/`.

## Workflow
- Use `uv add <package>` and `uv run <command>` for Python. Never use raw pip.
- Start with `bash scripts/setup.sh`. Commit pyproject.toml and uv.lock together.
- After editing Python, run `uv run ruff check --fix .` and `uv run pytest`.
- Before committing any change, run `bash scripts/check.sh`.
- Preview with `uv run python -m http.server 4173 --directory site`.
- Keep the site buildless HTML/CSS. Add a framework only for an actual requirement.
- Keep changes focused; explain behavior, verification, and remaining limitations.

## Product and content
- Matt Jones LLC is the company; Cool Matt Games is its games brand.
- matt-jones.org introduces the company. coolmatt.games is the play destination.
- coolmattgames.io is the planned experimental arcade: test games, alternate backgrounds, and scripting experiments. Do not claim it has launched.
- Do not invent employees, customers, testimonials, traction, or services.
- Preserve keyboard access, visible focus, reduced-motion support, and narrow-screen layouts.

## Git and deployment
- Never commit .env files, API keys, credentials, .venv, or local Claude auth state.
- New project repositories default to private under Matt-Jones-LLC.
- The cloud startup must never create repositories, commit, push, or deploy.
- Use feature branches for follow-up work. Do not overwrite unrelated work.
- Domain migration follows docs/hosting.md. Preserve existing game URLs and all email DNS.
