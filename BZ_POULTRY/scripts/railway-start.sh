#!/bin/sh

PORT="${PORT:-8000}"

echo "=== BZ Farm Railway startup (PHP built-in server — NO Apache) ==="

if [ -z "$APP_KEY" ]; then
    echo "ERROR: APP_KEY is missing."
    echo "Run locally: php artisan key:generate --show"
    echo "Then add the output to Railway -> Variables -> APP_KEY"
    exit 1
fi

if [ -z "$DB_CONNECTION" ] || [ "$DB_CONNECTION" = "sqlite" ]; then
    echo "WARN: DB_CONNECTION is not set to mysql."
    echo "Add a MySQL service in Railway and set DB_CONNECTION=mysql"
fi

php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan storage:link 2>/dev/null || true

echo "Running migrations..."
if ! php artisan migrate --force --no-interaction; then
    echo "WARN: Migrations failed. Check MySQL is linked and DB_* variables are set."
fi

echo "Starting server on 0.0.0.0:${PORT}"
exec php artisan serve --host=0.0.0.0 --port="${PORT}"
