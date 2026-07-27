#!/usr/bin/env bash
set -o errexit

echo "Using Yarn via Corepack..."
corepack prepare yarn@4.5.3 --activate

echo "Installing dependencies..."
yarn install --immutable

echo "Building NestJS API..."
yarn turbo run build --filter=@bamblu/api