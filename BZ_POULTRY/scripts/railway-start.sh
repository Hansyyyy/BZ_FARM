#!/bin/sh

PORT="${PORT:-8000}"

echo "=== BZ Farm Railway startup (PHP built-in server — NO Apache) ==="

if [ -z "$APP_KEY" ]; then
    echo "ERROR: APP_KEY is missing."
    echo "Run locally: php artisan key:generate --show"
    echo "Then add the output to Railway -> Variables -> APP_KEY"
    exit 1
fi

if [ -z "$MYSQLHOST" ] && [ -z "$MYSQL_URL" ]; then
    echo "ERROR: MySQL is not linked to this web service."
    echo "Railway -> Web service -> Variables -> + New Variable -> Add Reference"
    echo "Select MySQL and add: MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE"
    exit 1
fi

php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan storage:link 2>/dev/null || true

echo "Running migrations..."
if ! php artisan migrate --force --no-interaction; then
    echo "ERROR: Migrations failed."
    exit 1
fi

echo "Seeding default users and starter data..."
php artisan db:seed --force --no-interaction

echo "Starting server on 0.0.0.0:${PORT}"
exec php artisan serve --host=0.0.0.0 --port="${PORT}"
