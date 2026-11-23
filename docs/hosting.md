# Current deployment — November 20, 2026

- `Matt-Jones-LLC/matt-jones.org` is public and publishes `pages:/` through GitHub Pages.
- The custom domain `matt-jones.org` moved from the redirect repository to the company repository. HTTPS is enforced and the certificate covers the apex and www; www redirects to the apex.
- The existing apex DNS already points to GitHub Pages. No email DNS was edited. The www CNAME currently points at `matt-jones-org.github.io` and resolves correctly; aligning it to `matt-jones-llc.github.io` is recommended at the next DNS maintenance.
- Deploy with `bash scripts/deploy-pages.sh`. GitHub Actions authorization is not needed for this branch-based deployment.
- Old redirect repository: `matt-jones-org/matt-jones-org-redirect`. Its domain assignment was removed; its source remains available for rollback.
- `coolmattgames.io` was cut over on November 22, 2026: GoDaddy forwarding removed, apex A records and the `www` CNAME pointed at GitHub Pages, and the domain attached to `Matt-Jones-LLC/coolmattgames.io`. The experimental repository is separate from production.

The following is the original cutover reference. Its initial-state descriptions are historical, not current status.

# Hosting and domain cutover

## Current state and desired state

| Domain | Current setup at preparation | Desired setup |
| --- | --- | --- |
| matt-jones.org | GitHub Pages, `matt-jones-org/matt-jones-org-redirect` | Company website in this repository |
| coolmatt.games | GitHub Pages, `matt-jones-org/website` | Stable arcade; eventual organization ownership |
| coolmattgames.io | GoDaddy forwarding to coolmatt.games | Independent experimental arcade |

The existing website checkout has uncommitted work. Do not transfer or replace it from an old snapshot without accounting for those changes and any active branches/PRs.

## Hosting choice before launch

Matt-Jones-LLC is currently on GitHub Free. Pages requires a public repository on that plan. This repository begins private, matching the requested starter default. Choose public source, a GitHub plan supporting private-source Pages, or a different host supporting private GitHub repositories before enabling deployment. Do not make source public implicitly.

## Enable workflow templates

The CLI token used to prepare this repository has no `workflow` scope, so GitHub rejected an initial push containing active Actions files. The complete templates are in `docs/workflows/`. Follow the scope-refresh and copy commands in README.md before expecting CI or Pages runs.

## Company website cutover

1. Preview and approve `site/`. Save the old redirect repository's Pages settings and current revision as rollback references.
2. Resolve the hosting choice. If using Pages, enable **Settings → Pages → Source: GitHub Actions** in this repository and run **Publish company website** once without a custom domain. Inspect its preview URL.
3. Verify domain ownership under the organization’s Pages settings; add the exact TXT challenge GitHub supplies at Squarespace. If a personal-account verification blocks the organization, resolve that ownership change deliberately.
4. Remove `matt-jones.org` from the old redirect repository’s Pages setting, then assign it to this repository. A custom domain can be attached to only one Pages site at a time.
5. Keep existing GitHub Pages apex A/AAAA records if they match GitHub’s current documentation. Change website `www` CNAME to `matt-jones-llc.github.io` when the organization owns the Pages destination. Do not replace the entire DNS zone.
6. Wait for the certificate, enable HTTPS, and check the apex, www, company homepage, and a legacy `/games/...` link. The company 404 page forwards game paths to the main arcade while preserving query strings and fragments.
7. Leave Google Workspace MX, SPF, DKIM, DMARC, and verification records untouched.

Rollback: detach the domain from the new Pages site, reattach it to the original redirect repository, restore the old website CNAME if changed, and verify HTTPS. Keep both repositories intact until cutover has been checked.

## Stable arcade and experimental arcade

Prefer transferring the existing production repository to the organization, then renaming it to `cool-matt-games`, rather than creating a divergent copy. Review active PRs, GitHub App access, branch rules, Pages settings, and domain verification first. After transfer, update clone remotes and the www DNS target if required; verify production before proceeding.

Create `coolmattgames.io` as a separate repository with its own deployment and prominent “Experimental” label. Seed it from an explicitly selected production commit once unfinished work is reconciled. Preserve the source license. Use separate browser-storage prefixes, such as `cmg-lab:<game>:...`, for clarity. Browsers already isolate storage by origin.

The lab may change backgrounds, scripting strategies, UI, and games independently. Promote chosen changes through a reviewed PR to production; never configure the lab deployment to upload production files or reuse its custom domain.

At GoDaddy, remove `.io` forwarding only after the lab site is ready. Set website DNS to the chosen host’s documented values, attach the domain, and verify HTTPS. Until then the existing redirect remains in place.

## References

- [GitHub Pages availability](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Managing custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Claude cloud environments](https://code.claude.com/docs/en/cloud-environments)
- [Codespaces configuration](https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration)
