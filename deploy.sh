#!/bin/bash
set -e

cd /var/www/html/taysiir

echo "==> Pulling latest code"
git pull origin main

echo "==> Backend: installing deps + running migrations"
cd backend
npm install

# `migrate deploy` takes a database advisory lock, which the pooled Neon connection sometimes fails to
# get in time (P1002). Skip it when nothing is pending, and otherwise retry a few times.
if npx prisma migrate status 2>&1 | grep -q "Database schema is up to date"; then
  echo "No pending migrations"
else
  for attempt in 1 2 3 4; do
    if npx prisma migrate deploy; then break; fi
    if [ "$attempt" -eq 4 ]; then
      echo "Migrations failed after $attempt attempts"
      exit 1
    fi
    echo "Migration attempt $attempt failed, retrying in 15s"
    sleep 15
  done
fi
npx prisma generate
pm2 restart abdiaziz --update-env

echo "==> Frontend: installing deps + build"
cd ../frontend
npm install
npm run build

echo "==> Deploy complete"
