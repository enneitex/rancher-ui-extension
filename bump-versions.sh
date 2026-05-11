#!/usr/bin/env bash
set -euo pipefail

BUMP=${1:-patch}

if [[ ! "$BUMP" =~ ^(major|minor|patch)$ ]]; then
  echo "Usage: $0 [major|minor|patch]" >&2
  exit 1
fi

bump_semver() {
  local version=$1
  local major minor patch
  IFS='.' read -r major minor patch <<< "$version"
  case "$BUMP" in
    major) echo "$((major + 1)).0.0" ;;
    minor) echo "${major}.$((minor + 1)).0" ;;
    patch) echo "${major}.${minor}.$((patch + 1))" ;;
  esac
}

ROOT=$(cd "$(dirname "$0")" && pwd)
changed=0

echo "Bumping $BUMP version for all extensions..."
echo ""

for pkg_json in "$ROOT"/pkg/*/package.json; do
  [[ -f "$pkg_json" ]] || continue

  name=$(grep '"name"' "$pkg_json" | head -1 | sed 's/.*"name": *"\([^"]*\)".*/\1/')
  current=$(grep '"version"' "$pkg_json" | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/')
  next=$(bump_semver "$current")

  sed -i "s/\"version\": \"${current}\"/\"version\": \"${next}\"/" "$pkg_json"

  printf "  %-15s %s  →  %s\n" "$name" "$current" "$next"
  changed=$((changed + 1))
done

echo ""
echo "$changed extension(s) bumped ($BUMP)"
