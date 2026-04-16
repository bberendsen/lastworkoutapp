#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-4200}"
PREVIEW_URL="http://localhost:${PORT}/homescreen?celebrationPreview=1"

echo "Starting Angular dev server on port ${PORT}..."
echo "Preview URL: ${PREVIEW_URL}"

if command -v open >/dev/null 2>&1; then
  (sleep 4 && open "${PREVIEW_URL}") >/dev/null 2>&1 &
fi

npm run start -- --port "${PORT}"
