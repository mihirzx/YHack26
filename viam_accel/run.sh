#!/bin/bash
set -e

cd "$(dirname "$0")"
echo "RUNNING UPDATED run.sh"
python3 main.py "$@"