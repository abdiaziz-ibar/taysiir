#!/bin/bash
set -e

cd /var/www/html/taysiir

echo "==> Pulling latest code"
git pull origin main

echo "==> Backend: installing deps + prisma generate"
cd backend
npm install
npx prisma generate
pm2 restart abdiaziz --update-env

echo "==> Frontend: installing deps + build"
cd ../frontend
npm install
npm run build

echo "==> Deploy complete"
