#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
EXT_DIR="$ROOT_DIR/masakiclaw_chrome"
DIST_DIR="$ROOT_DIR/dist"

if ! command -v zip >/dev/null 2>&1; then
  echo "zip command not found." >&2
  exit 1
fi

VERSION="$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$EXT_DIR/manifest.json" | head -n 1)"
if [ -z "$VERSION" ]; then
  echo "Could not read extension version from manifest.json." >&2
  exit 1
fi

required_files="
manifest.json
background.js
content-script.js
popup.html
popup.js
styles.css
download.html
download.js
download.css
masaki.png
icons/icon-16.png
icons/icon-32.png
icons/icon-48.png
icons/icon-128.png
"

for file in $required_files; do
  if [ ! -f "$EXT_DIR/$file" ]; then
    echo "Missing required file: $file" >&2
    exit 1
  fi
done

mkdir -p "$DIST_DIR"
OUTPUT="$DIST_DIR/masakiclaw_chrome_$VERSION.zip"
rm -f "$OUTPUT"

cd "$EXT_DIR"
zip -r "$OUTPUT" \
  manifest.json \
  background.js \
  content-script.js \
  popup.html \
  popup.js \
  styles.css \
  download.html \
  download.js \
  download.css \
  masaki.png \
  icons

echo "Created $OUTPUT"
