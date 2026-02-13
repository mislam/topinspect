#!/usr/bin/env sh
set -e

find . -name "node_modules" -type d -prune -exec rm -rf '{}' +