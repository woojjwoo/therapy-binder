#!/bin/bash
set -e
PROJECT="$HOME/projects/therapy-binder"
cd "$PROJECT"
echo "Running Jest..."
npx jest --no-coverage --silent && echo "Tests pass" || { echo "Tests FAILED"; exit 1; }
echo "Checking native-only flags..."
grep -r "requireAuthentication:s*true" src/ app/ --include="*.ts" --include="*.tsx" 2>/dev/null && echo "ERROR: breaks Expo Go" && exit 1 || echo "Clean"
echo "Checking bundle..."
HTTP=$(curl -s "http://localhost:8081/node_modules/expo-router/entry.bundle?platform=ios&dev=true&hot=false" -o /dev/null -w "%{http_code}" 2>/dev/null)
echo "Bundle HTTP: $HTTP"
[ "$HTTP" = "200" ] && echo "ALL CLEAR" || echo "BUNDLE FAILED"
