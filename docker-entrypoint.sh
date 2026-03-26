#!/bin/sh
set -e

echo "🦷 DENT-ALP OS — Starting..."

# DB'nin hazır olmasını bekle
echo "⏳ Waiting for database..."
for i in $(seq 1 30); do
  if node -e "
    const pg = require('pg');
    const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
    c.connect().then(() => { c.end(); process.exit(0); }).catch(() => process.exit(1));
  " 2>/dev/null; then
    echo "✅ Database ready!"
    break
  fi
  echo "  Attempt $i/30..."
  sleep 2
done

# Schema push — --url ile doğrudan DATABASE_URL geç
echo "📦 Pushing database schema..."
./node_modules/.bin/prisma db push --schema=./prisma/schema.prisma --url="$DATABASE_URL" --accept-data-loss || echo "⚠️ DB push failed"

# Seed
if [ "$SEED_DB" = "true" ]; then
  echo "🌱 Seeding database..."
  node --import tsx prisma/seed.ts || echo "⚠️ Seed failed"
fi

echo "🚀 Starting Next.js..."
exec node server.js
