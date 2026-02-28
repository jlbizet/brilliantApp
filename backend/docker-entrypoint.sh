#!/bin/sh
set -e

echo "🦷 Starting Dental CRM Backend..."

# Set timezone from TZ environment variable (defaults to Montevideo)
export TZ=${TZ:-America/Montevideo}
echo "🌍 Using timezone: $TZ"

# Set default DB_HOST if not provided
DB_HOST=${DB_HOST:-postgres}

# Wait for database to be ready
echo "⏳ Waiting for database at $DB_HOST:5432..."
while ! nc -z $DB_HOST 5432; do
  sleep 1
done
echo "✅ Database is ready!"

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Optional: Seed database (only in development)
if [ "$NODE_ENV" = "development" ] && [ "$SEED_DATABASE" = "true" ]; then
  echo "🌱 Seeding database..."
  npx prisma db seed
fi

# Start application
echo "🚀 Starting application..."
exec node dist/src/main.js
