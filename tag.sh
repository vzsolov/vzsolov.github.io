#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <tag>"
  exit 1
fi

TAG="$1"

git tag "$TAG"
git push origin "$TAG"

echo "Tagged and pushed: $TAG"
