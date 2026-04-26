#!/bin/sh
set -eu

ROLE="${SERVICE_ROLE:-api}"
PORT_VALUE="${PORT:-10000}"

if [ "$ROLE" = "reverb" ]; then
  exec php artisan reverb:start --host=0.0.0.0 --port="$PORT_VALUE"
fi

# Default role: API
php artisan migrate --force
exec php artisan serve --host=0.0.0.0 --port="$PORT_VALUE"
