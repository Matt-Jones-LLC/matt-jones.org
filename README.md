# Matt Jones, LLC

**Independent software. Original experiences. Room to build what comes next.**

Matt Jones, LLC is the company behind **[Cool Matt Games](https://coolmatt.games)**. We build original browser experiences and explore new ideas through hands-on experimentation. This repository is the company’s home base: its website, development conventions, and a repeatable starting point for new projects.

**Matt Jones — Founder & CEO**

## Three addresses. Three clear purposes.

| Address | Purpose | Intended repository |
| --- | --- | --- |
| **matt-jones.org** | The company: our work, leadership, and contact information. Professional, focused, and separate from the arcade’s visual identity. | `Matt-Jones-LLC/matt-jones.org` — this repository |
| **[coolmatt.games](https://coolmatt.games)** | The main arcade. Finished games and the stable player experience. | `Matt-Jones-LLC/cool-matt-games` — proposed migration of the existing arcade |
| **coolmattgames.io** | The experimental arcade. Test games, alternate backgrounds, different scripting methods, and new ideas. | `Matt-Jones-LLC/coolmattgames.io` — experimental arcade |

The lab is a separate release surface, not a redirect or a second name for the same site. A successful experiment can graduate to the main arcade through a reviewed change; deploying the lab must never deploy production.

### Current launch status

**The company site is live at [matt-jones.org](https://matt-jones.org), with HTTPS.** This repository is public. GitHub Pages publishes the root of the `pages` branch; only files from `site/` are copied there.

The main arcade still lives in `matt-jones-org/website`. The experimental arcade has its own public repository, [Matt-Jones-LLC/coolmattgames.io](https://github.com/Matt-Jones-LLC/coolmattgames.io), with a GitHub Pages preview while custom-domain DNS is being arranged.

Datadog browser integration is included on all three sites. Public RUM configuration is in `assets/monitoring-config.js` under each site's web root. The shared **Matt Jones LLC Websites** RUM application is configured; diagnostics send only after visitor opt-in. See [monitoring](docs/monitoring.md).

The optional Actions templates remain in `docs/workflows/`; the CLI login lacks `workflow` scope. **Pages works without them.** To enable CI later, grant that scope and copy `check.yml` to `.github/workflows/`. The optional `pages.yml` template is an alternative deployment method; change Pages source to Actions before using it.

## What belongs here

Company content, shared development instructions, and the scripts that make a new project easy to start. Games and unrelated applications should have their own repositories under the organization, with their own dependencies, previews, and releases.

```text
site/                  Company website; the only folder published
  index.html           Company, work, leadership, contact
  assets/              Styles and brand mark
scripts/
  bootstrap.sh         Install uv and Python; safe before a clone exists
  setup.sh             Synchronize this checkout from uv.lock
  cloud-session.sh     Refresh dependencies in Claude cloud sessions
  codespaces.sh        Set up the checkout and install Claude Code
  new-project.sh       Create a separate Python project; optionally push it
  check.sh             Bash syntax, Ruff, and tests
.claude/settings.json  Cloud session startup hook
.devcontainer/         GitHub Codespaces environment
docs/workflows/        Ready-to-enable checks and Pages workflow templates
AGENTS.md              Shared instructions for Claude Code, Codex, and ChatGPT
CLAUDE.md              Imports AGENTS.md for Claude Code
uv.lock                Committed Python dependency resolution
```

## Start building

### Option A: GitHub Codespaces

Open this repository on GitHub, choose **Code → Codespaces → Create codespace on main**. The dev container installs Python 3.12, uv, the locked development dependencies, GitHub CLI, and Claude Code. Codespaces compute is subject to GitHub’s account quotas and billing settings.

In its terminal:

```bash
claude
```

Complete Claude sign-in when prompted. To preview the company website:

```bash
uv run python -m http.server 4173 --directory site
```

Open forwarded port **4173**. Keep the preview private while reviewing unpublished work.

### Option B: Claude’s cloud environment

Connect the Claude GitHub App to **Matt-Jones-LLC** and allow this repository. In [Claude Code](https://claude.ai/code), create or edit a cloud environment named **Matt Jones LLC**.

- Use Limited network access with package-manager access enabled. Tool installation may also need `astral.sh`, `github.com`, and GitHub release-download hosts; permit the specific host if a download is blocked.
- Paste the contents of [`scripts/bootstrap.sh`](scripts/bootstrap.sh) into the environment’s **Setup script**. This script is self-contained and does not require the repository to be cloned yet.
- Select this repository and start a session. The committed SessionStart hook runs `uv sync --locked` after the clone is available, including when a cached environment is reused.
- Store credentials in the environment’s secret settings, never in committed files.

The repository is ready for this connection; creating it does not install the Claude GitHub App or save a cloud environment in your Claude account.

A useful first prompt:

> Read README.md and AGENTS.md. Run the checks, then implement one focused improvement. Explain the behavior change and how you verified it. Keep production and experimental arcade releases separate.

### Option C: On your computer

```bash
gh repo clone Matt-Jones-LLC/matt-jones.org
cd matt-jones.org
bash scripts/setup.sh
export PATH="$HOME/.local/bin:$PATH"
claude
```

`setup.sh` installs uv and Python when needed, but does not install Claude locally. If Claude Code is missing, follow [Anthropic’s installation instructions](https://code.claude.com/docs/en/setup).

## Remote Control: continue from your phone

In a terminal where Claude Code is installed and signed in:

```bash
claude remote-control
```

`claude rc` is the short form. Follow the connection URL or QR code in your browser or the Claude mobile app. In an existing interactive Claude session, use `/remote-control`.

Remote Control keeps execution on the machine running Claude. On a laptop, that machine must stay awake; inside Codespaces, the codespace must remain running and may stop under its idle timeout. Claude-hosted cloud sessions are a separate option for work that should run independently of your laptop. See [the official Remote Control guide](https://code.claude.com/docs/en/remote-control).

## Start a new project

From a parent directory where you keep projects:

```bash
bash /path/to/matt-jones.org/scripts/new-project.sh my-vibe-app
```

This creates a new folder with Python 3.12, uv, Ruff, pytest, an initial test, AGENTS.md and CLAUDE.md, Codespaces configuration, a Claude cloud hook, and a local Git commit. It refuses to overwrite an existing folder. To also create and push a **private** organization repository:

```bash
bash /path/to/matt-jones.org/scripts/new-project.sh my-vibe-app --push
```

GitHub CLI must be signed in with permission to create organization repositories, and Git author name/email must be configured. The script does not launch Claude or publish a website. If a push fails, the local project is preserved for recovery.

This is a **Python starter**, not a mandatory game stack. Existing browser games can remain plain HTML/CSS/JavaScript. Add a frontend framework or a server only when the project needs one.

## Quality and contribution

```bash
uv add <package>             # Runtime dependency
uv add --dev <package>       # Development dependency
bash scripts/check.sh       # Bash syntax, lint, tests
```

After editing Python, run `uv run ruff check --fix .` and `uv run pytest`. Commit `pyproject.toml` and `uv.lock` together. Review the site at desktop and phone widths when changing its layout. Use a focused branch and pull request for follow-up changes.

Never commit `.env` files, API keys, `.venv/`, or Claude authentication files. Startup scripts prepare a workspace; they never create repositories, commit, push, or deploy.

## Publishing

The company website uses buildless HTML/CSS with optional Datadog browser diagnostics. After testing and committing source changes on `main`:

```bash
bash scripts/check.sh
node --test tests/monitoring.test.cjs
bash scripts/deploy-pages.sh
```

The deploy script requires a clean checkout, pushes `main`, copies only `site/` into a temporary checkout of the existing `pages` branch, and pushes a normal commit. It never force-pushes and preserves the custom-domain CNAME. GitHub Pages then builds the branch automatically.

[Hosting instructions](docs/hosting.md) record domain ownership, email preservation, release separation, and rollback.

## Contact and ownership

**Matt Jones, LLC** · [matt@matt-jones.org](mailto:matt@matt-jones.org)

No open-source license is granted by this repository. Existing projects retain their own licenses; moving the arcade does not remove its Apache 2.0 license or attribution.
