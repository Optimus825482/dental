#!/bin/sh
set -e

echo "🦷 DENT-ALP OS — Starting..."
echo "📦 DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo 'yes' || echo 'NO!')"
echo "📦 DB Host: $(echo $DATABASE_URL | sed 's/.*@\(.*\):.*/\1/')"

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

# Schema push
echo "📦 Pushing database schema..."
DATABASE_URL="$DATABASE_URL" ./node_modules/.bin/prisma db push --schema=./prisma/schema.prisma --accept-data-loss || echo "⚠️ DB push failed"

# Seed
if [ "$SEED_DB" = "true" ]; then
  echo "🌱 Seeding database..."
  node --import tsx prisma/seed.ts || echo "⚠️ Seed failed"
fi

echo "🚀 Starting Next.js..."
exec node server.js
