# AWS hosting for matt-jones.org

Status as of November 23, 2026: **built and serving a preview. Not yet live on matt-jones.org.**
Visitors to matt-jones.org still reach GitHub Pages until the DNS cutover below is done.

matt-jones.org stays the main address. This replaces the company-site half of the earlier plan
that made mattjonesllc.com the main address (draft pull request #3).

## What exists

| Thing | Value |
| --- | --- |
| AWS account | 467008424757 (was empty before this work; Flash Is Dead is hosted in a different account) |
| Stack | `matt-jones-company-site` in us-east-2, from `infra/company-site.cloudformation.json` |
| Storage | S3 bucket `matt-jones-company-site-sitebucket-l1ubttp4fzso`: private, encrypted, versioned, old versions expire after 30 days |
| CDN | CloudFront distribution `E20F8RXXFZAJRQ` |
| Preview address | https://d29oey55glk03d.cloudfront.net. Since 2026-11-24 it redirects (302) to matt-jones.org; see below. |
| Certificate | `arn:aws:acm:us-east-1:467008424757:certificate/de81a842-d964-4a2a-95c7-a300ecbbad3a` for matt-jones.org and www.matt-jones.org. Requested; waiting for DNS validation. |

There are no servers. The bucket blocks all public access and only this distribution can read
it. The CloudFront function sends every host other than matt-jones.org (www and the cloudfront.net
preview address) to the same path on matt-jones.org with a 302, adds a trailing slash to
directory URLs, and serves `index.html` for them. Missing pages return the site's 404 page with a
real 404 status. Responses carry AWS's managed security headers (HSTS, nosniff, frame and
referrer policies).

Not set up: a budget alert (it needs a notification email), a GitHub deploy role, and automatic
deploys. Costs at this size and traffic should be very small, but nothing here caps spending.

## The preview address forwards (since 2026-11-24)

Matt asked for every address that is not matt-jones.org to send visitors there, so the preview is
no longer a second public copy of the site. The files are still in the bucket, but the preview
address no longer shows them. To check the bucket's content before the DNS cutover, read the
objects directly or test the function in the CloudFront console; do not remove the redirect
without asking Matt. The checks below were made on 2026-11-23, before this change.

## Checked on the preview address

- Home page, 404 page, styles, scripts, icons, `robots.txt` and `sitemap.xml` return 200 with the
  right content types, and each file is byte-for-byte the same as `site/` in this repository.
- `/nope` redirects to `/nope/`, which returns 404 with the site's 404 page. Query strings survive
  the redirect.
- Plain `http://` redirects to `https://`.
- Reading the bucket directly returns 403.
- Diagnostics stay off on the preview host because it is not in `monitoring-config.js`.

Not checked yet: anything on the real domain names, including the www redirect. That is only
possible after the certificate is issued and attached.

## Cutover steps

DNS is at Squarespace and is Matt's to change. Email records (MX, SPF, DKIM, DMARC, verification
TXT) are never touched.

### 1. Validate the certificate (safe now; changes nothing visitors see)

Add two CNAME records at Squarespace:

| Host | Type | Value |
| --- | --- | --- |
| `_42f83eaa2417bec9c955aee31506e300` | CNAME | `_77bd7c9c75c27e62cd95e5d9324aa500.wzccmgtwzk.acm-validations.aws.` |
| `_4cf60a5894e42ed2b15fae4823376fcd.www` | CNAME | `_3164566323640e9759d2afba3af77382.wzccmgtwzk.acm-validations.aws.` |

Leave them in place afterwards; AWS uses them to renew the certificate.

### 2. Attach the domain names (after the certificate shows ISSUED)

Update the stack with `CertificateArn` set to the certificate above. CloudFront then accepts
matt-jones.org and www.matt-jones.org. This still changes nothing for visitors.

### 3. Point the domain at AWS

| Host | Now | Change to |
| --- | --- | --- |
| `www` | CNAME `matt-jones-org.github.io` | CNAME `d29oey55glk03d.cloudfront.net` |
| `@` | A `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` | Remove all four, add ALIAS `d29oey55glk03d.cloudfront.net` |
| `@` | AAAA `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` | Remove all four |

Squarespace lists ALIAS as a supported record type for the root of a domain, and the domain does
not use DNSSEC, which some reports say blocks it. Some third parties report trouble with
Squarespace ALIAS records, so check the site right after the change. If it does not work, restore
the old records and move DNS to Route 53 as a separate, planned change.

The current A records have a long cache time (about four hours), so the switch can take that long
to reach everyone.

### 4. After it works

Check the home page, a missing page, and the www redirect on the real names. Then update the
hosting line in `AGENTS.md`, and change the www redirect in the template from 302 to 301.

## Rollback

Put the `www` CNAME and the eight `@` records back to the values in the "Now" column. GitHub Pages
is left exactly as it was, with its custom domain and the `pages` branch, so it starts serving
again as soon as DNS points back.

## Releasing an update

Upload the changed files from `site/` to the bucket (not `CNAME` or dotfiles) with
`Cache-Control: public,max-age=300,must-revalidate` and the right content type. CloudFront picks
up changes within five minutes. The first upload was done through the AWS connector with
short-lived signed upload links, because the `aws` command-line tool is not installed here.
