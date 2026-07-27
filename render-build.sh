#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Enabling Corepack for Yarn 4..."
corepack enable

echo "Installing dependencies..."
yarn install --immutable

echo "Building NestJS API..."
yarn turbo run build --filter=@bamblu/api
