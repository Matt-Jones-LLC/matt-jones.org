# Browser monitoring

The same `assets/monitoring.js` is deployed on the company site, the main arcade, and the lab. Each has a separate `assets/monitoring-config.js` with public browser identifiers and its own service/environment:

| Website | Service | Environment |
| --- | --- | --- |
| matt-jones.org | matt-jones-company | production |
| coolmatt.games | cool-matt-games | production |
| coolmattgames.io | cool-matt-games-lab | experimental |

Datadog RUM collects page views, browser/device details, resource performance, long tasks, and errors only after a visitor enables diagnostics. Game pages additionally send `game_start` with a game slug. The lab sends predefined background and renderer choices. No session replay, automatic click tracking, user identification, save data, or cross-domain identity stitching is configured. Query strings and fragments are stripped from collected view/resource URLs. This is not a promise that arbitrary application error messages can never contain sensitive data; never put secrets or player-entered text in errors.

The footer allows withdrawal. Global Privacy Control and Do Not Track block collection even if a preference was saved previously. Consent is per browser origin. The main sites accept only their own domain and www; the lab also accepts its GitHub Pages preview host. Missing config and localhost fail closed. SDK failures never stop gameplay.

## Activation

Create a Browser RUM application in Datadog (one shared application can cover these sites with service and website tags, or use one application per site). Copy its application ID, **browser client token**, Datadog site/region and matching CDN URL into the public config. Never put API keys or application keys in browser code. RUM is subject to the Datadog account's plan and usage billing; this setup does not change the subscription or configure Synthetic test schedules.

The connected Datadog account had no RUM applications when checked. Integration code is deployed disabled until credentials are configured. After activation, opt in on each live site and verify an actual view event in Datadog, grouped by `service` and `env`. Do not call monitoring verified until those events arrive.

## Verification

The company repository includes `tests/monitoring.test.cjs`. Run `node --test tests/monitoring.test.cjs`. It checks default-off behavior, consent, withdrawal during SDK download, URL sanitization, privacy signals, preview blocking, and resilience to CDN failure.
