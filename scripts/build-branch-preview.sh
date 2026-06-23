#!/usr/bin/env bash
set -euo pipefail

source_dir="${1:-}"
target_root="${2:-}"
preview_slug="${3:-}"

if [[ -z "$source_dir" || -z "$target_root" || -z "$preview_slug" ]]; then
  echo "Usage: $0 <source-dir> <target-root> <preview-slug>" >&2
  exit 2
fi

if [[ "$preview_slug" == "." || "$preview_slug" == ".." || "$preview_slug" == *"/"* || "$preview_slug" == *"\\"* ]]; then
  echo "Invalid preview slug: $preview_slug" >&2
  exit 2
fi

source_dir="$(cd "$source_dir" && pwd)"
target_root="$(mkdir -p "$target_root" && cd "$target_root" && pwd)"
dest="$target_root/preview/$preview_slug"

case "$dest" in
  "$target_root"/preview/*) ;;
  *)
    echo "Refusing to write outside preview root: $dest" >&2
    exit 2
    ;;
esac

rm -rf "$dest"
mkdir -p "$dest/data"

copy_path() {
  local path="$1"
  if [[ -e "$source_dir/$path" ]]; then
    mkdir -p "$dest/$(dirname "$path")"
    cp -R "$source_dir/$path" "$dest/$path"
  fi
}

copy_path index.html
copy_path css
copy_path js
copy_path assets
copy_path LICENSE
copy_path README.md

for file in "$source_dir"/data/*.json "$source_dir"/data/*.js; do
  [[ -e "$file" ]] || continue
  cp "$file" "$dest/data/$(basename "$file")"
done

if [[ -d "$source_dir/data/normalized" ]]; then
  mkdir -p "$dest/data"
  cp -R "$source_dir/data/normalized" "$dest/data/normalized"
fi

mkdir -p "$target_root/preview"
cat > "$target_root/preview/index.html" <<HTML
<!doctype html>
<html lang="es">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>UFOlogist previews</title>
<style>
body{margin:0;padding:40px;font-family:Inter,system-ui,sans-serif;background:#030812;color:#f4f7fb}
a{color:#18d7ff} li{margin:10px 0}
</style>
<h1>UFOlogist branch previews</h1>
<p>Previews estáticos publicados desde ramas de trabajo.</p>
<ul>
HTML

for dir in "$target_root"/preview/*; do
  [[ -d "$dir" ]] || continue
  name="$(basename "$dir")"
  printf '  <li><a href="./%s/">%s</a></li>\n' "$name" "$name" >> "$target_root/preview/index.html"
done

cat >> "$target_root/preview/index.html" <<HTML
</ul>
</html>
HTML

echo "Preview built at $dest"
