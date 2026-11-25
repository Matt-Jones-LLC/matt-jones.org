# Matt Jones, LLC company site: instructions for AI agents

This file is the rulebook for every AI tool that works here (Claude Code, Codex, ChatGPT).
`CLAUDE.md` imports it. Read `README.md` before making changes.

This repository is the company website for matt-jones.org and the starting point for new
projects. Leadership: Matt Jones, Founder & CEO. He is the only person named on the site.

## This repository

| Path | What it is |
| --- | --- |
| `site/` | The company website. The only folder that is published. |
| `scripts/` | Setup, checks, deployment, and the new-project starter |
| `tests/` | Site tests (pytest) and browser-monitoring tests (Node) |
| `docs/` | Hosting and monitoring records, and workflow templates that are not enabled |

## Commands

```bash
bash scripts/setup.sh                                   # install uv, Python, locked dependencies
uv run python -m http.server 4173 --directory site      # preview the site
bash scripts/check.sh                                   # Bash syntax, Ruff, pytest
node --test tests/monitoring.test.cjs                   # browser-monitoring behavior
```

- Use `uv add <package>` and `uv run <command>` for Python. Never use raw pip. Commit
  `pyproject.toml` and `uv.lock` together.
- After editing Python, run `uv run ruff check --fix .` and `uv run pytest`.
- Run `bash scripts/check.sh` before every commit.

## Releasing

`bash scripts/deploy-pages.sh` pushes `main` and copies `site/` to the `pages` branch, which
GitHub Pages serves at matt-jones.org. It is a production release: run it only when Matt asks.
The domain setup and its rollback are recorded in `docs/hosting.md`.

## Content rules for this site

- matt-jones.org is Matt's professional page: who he is, what he is working on, his experience
  and how to reach him, written in plain resume language. It has its own look in
  `site/assets/main.css`: no images, no web fonts, no shared banner.
- **Held back since 2026-11-24.** coolmatt.games, coolmattgames.io and flashisdead.com are not ready
  to be public and all forward to this page. Describe that work here, marked "In development", but
  do not link to those addresses, print them, or publish their art. `tests/test_site.py` enforces
  this. Change it only when Matt says a site is ready.
- Every statement about Matt's experience must come from his own resume or from the projects
  themselves. Do not add figures, titles or employers he has not supplied.
- Nothing private goes in `site/`: no `.env`, `AGENTS.md`, `CLAUDE.md`, `README.md`, or lock files.
  `tests/test_site.py` enforces this.
- `scripts/new-project.sh` creates new projects. They get their own repository under
  `Matt-Jones-LLC`, private by default, with their own `AGENTS.md` and `CLAUDE.md`.

<!-- ecosystem:start
This block is identical in every Matt Jones, LLC repository. Edit the copy in
Matt-Jones-LLC/matt-jones.org first, then copy it unchanged to the other repositories
in the same piece of work.
-->
## The ecosystem

Matt Jones, LLC is the company. Cool Matt Games is its games brand. The three websites, their
repositories, and the services around them are one system: a change in one place often has a
counterpart somewhere else, so check this map before you start.

Status as of 2026-11-22. Confirm anything listed under "Not finished yet" before relying on it.

| Address | Purpose | Repository | Publishes from | DNS at |
| --- | --- | --- | --- | --- |
| matt-jones.org | Company site | `Matt-Jones-LLC/matt-jones.org` | `pages` branch, a copy of `site/` | Squarespace |
| coolmatt.games | Main arcade: finished games | `matt-jones-org/cool-matt-games` | GitHub Actions on every push to `main` | GoDaddy |
| coolmattgames.io | Lab: experiments | `Matt-Jones-LLC/coolmattgames.io` | `pages` branch, a copy of `site/` | GoDaddy |

### Not finished yet

- **coolmattgames.io is not live as the lab.** GoDaddy still forwards the domain to coolmatt.games.
  The lab is reachable only at https://matt-jones-llc.github.io/coolmattgames.io/. Do not write
  that the lab has launched on its own domain.
- **The arcade repository is still under the personal account `matt-jones-org`.** The plan is to
  transfer it to the `Matt-Jones-LLC` organization, keeping its history, license, and Pages setup.

### Services

- **GitHub.** `Matt-Jones-LLC` is the organization and the home for company work. `matt-jones-org`
  is Matt's personal account. New repositories go under `Matt-Jones-LLC` and start private.
- **Hosting.** All three sites are static files on GitHub Pages. There is no server.
- **Email.** Google Workspace on matt-jones.org. Website work never edits the MX, SPF, DKIM, DMARC,
  or verification records.
- **Datadog (US1, `datadoghq.com`).** One Browser RUM application, "Matt Jones LLC Websites",
  covers all three sites. They are told apart by tags:

  | Site | `service` | `env` |
  | --- | --- | --- |
  | matt-jones.org | `matt-jones-company` | `production` |
  | coolmatt.games | `cool-matt-games` | `production` |
  | coolmattgames.io | `cool-matt-games-lab` | `experimental` |

  Diagnostics stay off until a visitor turns them on, and stay off under Global Privacy Control or
  Do Not Track. There is no session replay. Only the application ID and the public client token
  (`pub…`) belong in a repository. Datadog's GitHub and AWS integrations are not connected.
- **AWS.** An account exists and is empty. No site depends on it. Do not create AWS resources or
  move DNS or hosting there unless Matt asks for that specific change: it costs money and nothing
  needs it yet.
- **AI tools.** Claude Code and Codex (ChatGPT) both work in these repositories. `AGENTS.md` is the
  single rulebook and `CLAUDE.md` imports it. Put a new rule in `AGENTS.md`, never only in
  `CLAUDE.md`, so both tools follow it.

### Rules that hold in every repository

- Work on a feature branch and open a pull request. Do not push to `main` or `pages`, and do not
  run a deploy script, unless Matt asks for that release.
- Never commit `.env` files, API keys, application keys, credentials, or local AI-tool sign-in
  state. Setup and startup scripts must never create repositories, commit, push, or deploy.
- Keep production and the lab separate. A lab release must never publish to coolmatt.games. An
  experiment reaches the main arcade only through a reviewed pull request to the arcade repository.
- The sites are plain HTML, CSS, and JavaScript with no build step. Add a framework, a build step,
  or a request to another server only when a real requirement calls for it.
- `assets/monitoring.js` has the same logic on all three sites, and each site has its own
  `assets/monitoring-config.js`. Change the logic on all three together, and keep it opt-in.
- Keep keyboard access, visible focus, reduced-motion support, and narrow-screen layouts working.
- Do not invent employees, customers, testimonials, traction, or services.
- DNS records, domain settings, repository transfers, billing, and third-party integrations are
  Matt's to change. Describe the exact change and ask; do not make it yourself.
- When you finish, say what changed, how you verified it, and what is still not done.
<!-- ecosystem:end -->
