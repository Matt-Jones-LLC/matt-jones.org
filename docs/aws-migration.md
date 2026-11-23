# AWS migration and Datadog monitoring

## Verified inventory — November 22, 2026

- GitHub: `Matt-Jones-LLC/matt-jones.org` (`site/`), `Matt-Jones-LLC/cool-matt-games` (public assets at root), `Matt-Jones-LLC/coolmattgames.io` (`site/`). All three are static sites.
- AWS account 217202382383: no S3 buckets, no CloudFront distributions, no IAM OIDC providers, no Datadog-named IAM roles. No Amplify apps or active CloudFormation stacks in us-east-2. This is not an inventory of every service in every region.
- AWS console reports free plan, $100 credits remaining, expiry May 22, 2027, and $0 current-month cost.
- Datadog: eight monitors (seven host monitors and one cost monitor), zero Synthetic tests. AWS integration displays its onboarding page; no integration role exists in AWS.
- Existing opt-in RUM uses the shared application documented in `monitoring.md`. No session replay, user identification, or changed consent behavior is proposed.
- Matt approved a $50/month combined hosting and additional monitoring budget. Reserve at most $30 for AWS and $20 for additional monitoring across all three sites, including eventual Flash hosting; usage alerts are not hard spending caps. Check actual account pricing and existing Datadog charges before activation. The template limits the AWS budget parameter to $30, but this only controls alert thresholds. Do not activate services whose projected combined incremental cost exceeds $50; review usage and reduce or disable optional monitoring if the allowance is threatened. No cloud hard spending cap is claimed.
- `flashisdead.com` is a newly purchased, separate future video/animation site under Matt Jones, LLC. It has no repository or approved content yet. It is not an alias for either arcade, and this stack does not provision it. Video delivery must fit the same budget.

## Confirmed domain setup

| Site | Primary domain | Redirect aliases | Source |
| --- | --- | --- | --- |
| Matt Jones LLC | mattjonesllc.com | matt-jones.org and both www names | Matt-Jones-LLC/matt-jones.org |
| Cool Matt Games | coolmatt.games | coolmattgames.io and both www names | Matt-Jones-LLC/cool-matt-games |
| Flash Is Dead | flashisdead.com | www decision pending | No repository yet; future standalone video/animation site |

Aliases share their primary site's distribution, certificate and origin. HTTPS 302 redirects during the rollback window retain paths and query strings. Existing experimental source in `coolmattgames.io` stays in GitHub but does not get an independent AWS origin, role, workflow or paid monitor. Flash Is Dead is the third logical site; no Flash resources or monitoring are provisioned until its source, content and delivery costs are reviewed within the SAME $50 total. Do not add self-hosted video delivery or transcoding before that review.

## Prepared architecture

`infra/sites.cloudformation.json` creates two private, encrypted, versioned S3 buckets, each with its own CloudFront distribution, origin access control, directory-index function, and deployment role. The stack also creates a single GitHub OIDC provider and account-level AWS budget notifications. Deploy in us-east-2. Certificates, when added, must be in us-east-1.

There are no servers, NAT gateways, databases, paid WAF rules, or background video transcoding jobs. S3 blocks public access. CloudFront signs origin requests. Each deploy role trusts only the exact repository's `main` branch and can write only its own bucket and invalidate only its own distribution. No long-lived AWS credentials go into GitHub.

The default stack creates preview `cloudfront.net` hostnames. It does not edit DNS. Optional per-site certificate parameters attach the all primary and redirect-domain aliases after ACM certificates are validated. Existing GitHub Pages hosting remains available for rollback.

`directory-index.js` mirrors the inline CloudFront Function in the template. `/games/shapes` redirects to `/games/shapes/`, retaining query values; directory requests resolve to `index.html`. Missing objects return the site's 404 page with HTTP 404, never a fake successful homepage.

## Provision and publish previews

1. Review the IAM trust and bucket policies in the template. Deploy the stack after access approval, using `CAPABILITY_IAM`, a budget-notification email, and monthly AWS budget 30. Check for an existing GitHub OIDC provider again before creating the stack; the inventory above was empty.
2. Capture all stack outputs. In each repository set `AWS_DEPLOY_ROLE_ARN`, `AWS_SITE_BUCKET`, `AWS_DISTRIBUTION_ID` from that site's outputs. Never reuse another site's values. Set `AWS_DEPLOY_ENABLED=true` only after those values and the workflow are reviewed.
3. Merge the site-specific migration PR and run the AWS workflow on `main`. The workflow also runs on subsequent main pushes once enabled. The CLI token currently lacks `workflow` scope; use the connected GitHub app or GitHub UI if it cannot push the workflow.
4. Packaging uses a public-asset allowlist for the root-based arcade and only `site/` for the company. Operational files and CNAME are excluded. `scripts/deploy-aws.sh` syncs the dedicated bucket, removes stale assets, creates an invalidation, and waits for completion. S3 versions retain rollback copies for 30 days. Deployments are serialized per repo, but a multi-file sync is not atomic; use the previous Git SHA to redeploy if validation fails.
5. Check preview homepage, every game route with and without trailing slash, CSS/JS/audio assets, keyboard controls and a deliberately missing URL. Verify 404 status and HTTPS. RUM intentionally stays disabled on preview hosts.

## Account plan before production

Claude flagged, and AWS billing documentation confirms, that the current Free account plan ends after six months or when credits are exhausted and the account closes. The console shows May 22, 2027 as the current expiry. Move to a Paid account plan before production DNS cutover; review the billing terms and usage costs first. The prepared stack uses pay-as-you-go CloudFront configuration, not a flat-rate plan. Budget notifications do not enforce a hard spending cap. Source: [AWS account plans](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-plans.html).

## Custom domains and rollback

Obtain one ACM certificate in us-east-1 per distribution, covering all four names in its domain group below. Add only ACM validation CNAMEs at the existing DNS provider. Update certificate parameters after certificates are ISSUED, wait for CloudFront deployment, and test TLS before cutting traffic.

CloudFront does not provide fixed apex A addresses. Confirm whether each current DNS provider supports apex ALIAS/ANAME to CloudFront. If it does not, prepare Route 53 hosted zones and copy the COMPLETE existing zones before changing nameservers. Do not improvise apex IP addresses, and do not put an ordinary CNAME at an apex with MX records. Route 53 A/AAAA alias records point at the distribution. Keep mail MX, SPF, DKIM, DMARC, verification, CAA, and unrelated subdomains intact. DNS changes require a separate exact record review; this configuration does not modify them.

Record existing DNS, TTLs, deployed Git SHAs, Pages settings, and certificates before cutover. Validate both previews, then migrate the company and arcade after checks pass. Do not deploy the old lab as a separate public site. Keep Pages available through the DNS TTL and validation period. To roll back hosting, restore recorded DNS targets; to roll back a site release, deploy the recorded known-good Git SHA. Do not delete old buckets or Pages deployments during migration.

## Datadog

The prepared JSON files in `infra/datadog/` describe paused HTTP checks, one per primary site (company and arcade), every 15 minutes from one location. Validate the location against the account before creation. Require HTTP 200 and response time under 5 seconds; SSL verification remains enabled. Choose an explicit notification recipient before activating. Two checks generate approximately 5,760 scheduled runs per 30-day month, excluding retries. Confirm current contracted pricing and quota before activation. There is no separate alias monitor or Flash monitor yet; adding a third primary check later would total approximately 8,640 scheduled runs before retries and must still fit the $20 monitoring allowance. Verify every alias with HTTPS, path and repeated-query smoke checks at cutover without creating recurring paid alias checks.

Connect AWS with Datadog's supported CloudFormation flow. Review its actual IAM permissions and external ID before approval. Enable only needed CloudFront/S3 metrics in us-east-1 and us-east-2; CloudFront global metrics are in us-east-1. Avoid enabling all optional security scans, log forwarding, or resource collection by default. Review pricing before adding those products.

After integration, confirm the actual CloudFront metric names and distribution tags in Datadog, then add per-distribution 5xx alerts with traffic gating and collection delay. Do not create monitors against invented or absent metrics. Preserve the existing RUM opt-in implementation and verify new events on each real hostname after cutover. The account's current $45 forecast monitor is not a $50 combined AWS/Datadog cap.

## Validation and current state

Run `bash scripts/check.sh`, `node scripts/package-aws.cjs`, `node --test tests/aws.test.cjs tests/monitoring.test.cjs`, and `uvx --from cfn-lint cfn-lint infra/sites.cloudformation.json` here. Run each other repository's packager and shell syntax check too.

Preparation is not deployment. Record stack ID, outputs, deployment run URLs, live URLs, test IDs/results and cutover records here only after observed success.

References: [AWS OAC](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html), [Datadog HTTP tests](https://docs.datadoghq.com/synthetics/api_tests/http_tests/), [Datadog pricing](https://www.datadoghq.com/pricing/).

Workflow activation: `infra/aws-workflow.yml` is a template. Copy it to `.github/workflows/aws.yml` through an account authorized to write workflows before expecting any AWS deployments. The current CLI token lacks that scope; no workflow permission was broadened.

Review collaboration: [Claude migration review](https://claude.ai/chat/78a89a86-f97f-44a0-9f5c-7b8d1a260ec3). Claude independently checked repositories and public DNS; its AWS connector had expired and no Datadog connector was available there. AWS and Datadog inventory above came from Codex’s signed-in AWS console and Datadog connector.

## Deployment review — November 23, 2026

Matt authorized deployment and clarified that $50/month is a flexible target. Claude reviewed commits 2a94bb1 and 2a1e77e. Fixed network-path redirects from repeated leading slashes/backslashes, excluded credits/refunds from budget accounting, and updated company canonical URLs. Cross-host redirects are temporarily 302 during rollout; change to 301 only after validation and the rollback window. Google Workspace email and the existing Pages CNAME remain unchanged.

Datadog billing UI currently projects $18.03 for November (existing host $18, RUM about $0.03), with standard on-demand rates listed. Two 15-minute HTTP tests total 5,760 scheduled runs per 30 days: $4.15 at $7.20/10,000 before retries and any billing-unit rounding. Reserve $7.20 for scheduled checks while verifying actual billing. Existing usage is separate from migration increments. Low-traffic AWS planning assumptions: under 100 GB transfer, under 1 million viewer requests, less than 1 GB S3 including versions, at most 30 deployments/month, and 3–4 DNS zones. This is an estimate, not a quote or traffic guarantee. Sources: https://www.datadoghq.com/pricing/list/ and https://aws.amazon.com/cloudfront/pricing/pay-as-you-go/ and https://aws.amazon.com/route53/pricing/.

The AWS Settings upgrade UI offers a separate project spend limit that pauses resources at the threshold. $30 was selected during the upgrade flow; payment/upgrade completion remains pending. This control is distinct from AWS Budget notifications. Do not claim the upgrade or spend limit is active until confirmed. Infra integration, certificates, DNS cutover and workflow activation remain pending.
