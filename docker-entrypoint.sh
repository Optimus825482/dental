#!/bin/sh
set -e

echo "🦷 DENT-ALP OS — Starting..."

# Run migrations
echo "📦 Running database migrations..."
./node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma || echo "⚠️ Migration skipped (no migrations found)"

# Seed only if SEED_DB=true
if [ "$SEED_DB" = "true" ]; then
  echo "🌱 Seeding database..."
  ./node_modules/.bin/tsx prisma/seed.ts || echo "⚠️ Seed failed"
  echo "✅ Seed complete."
fi

echo "🚀 Starting Next.js..."
exec node server.js
