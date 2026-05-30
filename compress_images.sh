#!/usr/bin/env bash
# Compress new/changed JPEG images with jpegoptim.
# Tracks processed files in .compressed_images.log so already-compressed
# images are never touched again unless they change (e.g. replaced with a new photo).
#
# Usage:
#   ./compress_images.sh 2025/italy      # compress images in a specific folder
#   ./compress_images.sh 2025/           # compress all of a year folder
#   ./compress_images.sh --dry-run 2025/italy
#   ./compress_images.sh --quality=75 2025/italy

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/.compressed_images.log"
QUALITY=80
DRY_RUN=false
TARGET_DIR=""

for arg in "$@"; do
  case "$arg" in
    --dry-run)      DRY_RUN=true ;;
    --quality=*)    QUALITY="${arg#*=}" ;;
    --*)            echo "Unknown option: $arg" >&2; exit 1 ;;
    *)              TARGET_DIR="$arg" ;;
  esac
done

if [[ -z "$TARGET_DIR" ]]; then
  echo "Usage: $0 <folder> [--dry-run] [--quality=N]" >&2
  echo "  <folder>  path to compress (e.g. 2025/italy or 2025/)" >&2
  exit 1
fi

# Resolve to absolute path and verify it exists inside the repo
TARGET_ABS="$(cd "$SCRIPT_DIR" && cd "$TARGET_DIR" 2>/dev/null && pwd)" || {
  echo "Error: folder not found: $TARGET_DIR" >&2; exit 1
}
if [[ "$TARGET_ABS" != "$SCRIPT_DIR"* ]]; then
  echo "Error: folder must be inside the repo: $TARGET_DIR" >&2; exit 1
fi

if ! command -v jpegoptim &>/dev/null; then
  echo "Error: jpegoptim not found. Install with: sudo apt install jpegoptim" >&2
  exit 1
fi

# Load log into associative array: rel_path -> "size:mtime"
declare -A processed
if [[ -f "$LOG_FILE" ]]; then
  while IFS=$'\t' read -r path size mtime; do
    [[ -n "$path" ]] && processed["$path"]="$size:$mtime"
  done < "$LOG_FILE"
fi

compressed=0
skipped=0
errors=0
saved_bytes=0

while IFS= read -r -d '' img; do
  rel="${img#"$SCRIPT_DIR"/}"
  cur_size=$(stat -c "%s" "$img")
  cur_mtime=$(stat -c "%Y" "$img")

  # Skip if already processed and file hasn't changed
  if [[ -n "${processed[$rel]+_}" && "${processed[$rel]}" == "$cur_size:$cur_mtime" ]]; then
    (( skipped++ )) || true
    continue
  fi

  if [[ "$DRY_RUN" == true ]]; then
    echo "[dry-run] would compress: $rel  ($(( cur_size / 1024 ))K)"
    (( compressed++ )) || true
    continue
  fi

  if jpegoptim --max="$QUALITY" --strip-all --quiet "$img"; then
    new_size=$(stat -c "%s" "$img")
    new_mtime=$(stat -c "%Y" "$img")
    delta=$(( cur_size - new_size ))
    (( saved_bytes += delta )) || true
    processed["$rel"]="$new_size:$new_mtime"
    printf "compressed: %-60s %dK -> %dK\n" "$rel" "$(( cur_size/1024 ))" "$(( new_size/1024 ))"
    (( compressed++ )) || true
  else
    echo "ERROR: jpegoptim failed on $img" >&2
    (( errors++ )) || true
  fi
done < <(find "$TARGET_ABS" -type f \( -name "*.jpg" -o -name "*.jpeg" \) -print0)

# Write updated log (only when not a dry-run)
if [[ "$DRY_RUN" == false ]]; then
  {
    for path in "${!processed[@]}"; do
      read -r size mtime <<< "${processed[$path]//:/ }"
      printf '%s\t%s\t%s\n' "$path" "$size" "$mtime"
    done
  } > "$LOG_FILE"
fi

echo ""
if [[ "$DRY_RUN" == true ]]; then
  echo "Dry run: $compressed images would be compressed, $skipped already up-to-date"
else
  echo "Done: $compressed compressed (saved $(( saved_bytes / 1024 ))K), $skipped skipped, $errors errors"
fi
