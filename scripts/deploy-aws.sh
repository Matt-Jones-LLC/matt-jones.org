#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
: "${AWS_SITE_BUCKET:?Set the dedicated site bucket from stack outputs}"
: "${AWS_DISTRIBUTION_ID:?Set the matching CloudFront distribution ID}"
: "${AWS_REGION:=us-east-2}"
export AWS_REGION AWS_PAGER=""
node scripts/package-aws.cjs
# Existing filenames are not content-hashed; do not mark them immutable.
aws s3 sync _aws_site/ "s3://${AWS_SITE_BUCKET}/" --delete --cache-control 'public,max-age=300,must-revalidate' --only-show-errors
invalidation_id=$(aws cloudfront create-invalidation --distribution-id "$AWS_DISTRIBUTION_ID" --paths '/*' --query 'Invalidation.Id' --output text)
aws cloudfront wait invalidation-completed --distribution-id "$AWS_DISTRIBUTION_ID" --id "$invalidation_id"
