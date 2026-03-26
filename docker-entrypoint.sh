#!/bin/sh
set -e

echo "🦷 DENT-ALP OS — Starting..."
echo "📦 DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo 'yes' || echo 'NO!')"

# Schema push
echo "📦 Pushing database schema..."
./node_modules/.bin/prisma db push --schema=./prisma/schema.prisma --accept-data-loss || echo "⚠️ DB push failed, continuing..."

# Seed
if [ "$SEED_DB" = "true" ]; then
  echo "🌱 Seeding database..."
  node --import tsx prisma/seed.ts || echo "⚠️ Seed failed"
  echo "✅ Seed complete."
fi

echo "🚀 Starting Next.js..."
exec node server.js
