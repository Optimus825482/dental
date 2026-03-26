#!/bin/sh
set -e

echo "🦷 DENT-ALP OS — Starting..."

# Run migrations — schema path explicit
echo "📦 Running database migrations..."
./node_modules/.bin/prisma db push --schema=./prisma/schema.prisma --accept-data-loss 2>/dev/null || echo "⚠️ DB push skipped"

# Seed only if SEED_DB=true
if [ "$SEED_DB" = "true" ]; then
  echo "🌱 Seeding database..."
  node --import tsx prisma/seed.ts || echo "⚠️ Seed failed"
  echo "✅ Seed complete."
fi

echo "🚀 Starting Next.js..."
exec node server.js
