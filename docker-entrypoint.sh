#!/bin/sh
set -e

echo "🦷 DENT-ALP OS — Starting..."

# Run migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Seed only if SEED_DB=true (ilk deploy'da set edilir)
if [ "$SEED_DB" = "true" ]; then
  echo "🌱 Seeding database..."
  npx tsx prisma/seed.ts
  echo "✅ Seed complete."
fi

echo "🚀 Starting Next.js..."
exec node server.js
