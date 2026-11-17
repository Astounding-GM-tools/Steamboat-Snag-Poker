#!/usr/bin/env bash
# Puts the chart's tiles and the band's records on the R2 bucket (snag-assets.astounding.games).
# You run it; nothing here runs in a build. See docs/assets.md for the one-time rclone setup.
#
#   scripts/upload-assets.sh [options] <target>
#
# Targets
#   tiles          public/maptiles/<map>/  ->  <bucket>/maptiles/<map>/
#                  tiles/**.webp immutable for a year; tiles.json, route.json, legs/*.json 5 minutes
#   music          public/music/pre-1926/*.mp3  ->  <bucket>/music/   (immutable for a year)
#                  Always re-sends (four files), so it also fixes their headers.
#   victor         public/music/victor_1926/*.mp3  ->  <bucket>/music/
#                  REFUSED before 2027-01-01 (not public domain until then).
#   put DIR PREFIX any folder -> <bucket>/PREFIX/ (Content-Type by extension, Cache-Control from
#                  --cache, default 1 hour). The 1926 guard applies here too.
#   verify         curl -I the public URLs: status, type, cache-control, range support, CORS.
#
# Options
#   --dry-run      list what would go (counts, sizes, headers); upload nothing. With rclone and the
#                  remote set up, also asks the bucket what is new (rclone --dry-run: lists only).
#   --remote NAME  rclone remote (default: $R2_REMOTE or "r2")
#   --bucket NAME  bucket name (default: $R2_BUCKET; required for uploads)
#   --map NAME     tile set under public/maptiles (default: mrc-1894)
#   --cache VALUE  Cache-Control for "put"
#   --transfers N  parallel uploads (default 32)
#
# Run from anywhere: paths are from the main checkout's public/ (worktrees don't have the assets),
# overridable with ASSETS_PUBLIC=/path/to/public.
set -euo pipefail

IMMUTABLE='public, max-age=31536000, immutable'
SHORT='public, max-age=300'
PUBLIC_HOST='https://snag-assets.astounding.games'
GAME_ORIGIN='https://snag.astounding.games'
# The day the 1926 Victor sides enter the US public domain. The guard is lifted on this date, not before.
VICTOR_FREE=20270101

die() { echo "upload-assets: $*" >&2; exit 1; }

# ---- where the assets are -------------------------------------------------------------------------
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="$(cd "$here/.." && pwd)"
main_checkout="$(git -C "$repo" worktree list --porcelain 2>/dev/null | awk '/^worktree /{print substr($0,10); exit}')"
public="${ASSETS_PUBLIC:-}"
if [[ -z "$public" ]]; then
  for p in "$repo/public" "${main_checkout:-$repo}/public"; do
    [[ -d "$p/maptiles" || -d "$p/music" ]] && { public="$p"; break; }
  done
fi
public="${public:-$repo/public}"

# ---- options --------------------------------------------------------------------------------------
dry=0 remote="${R2_REMOTE:-r2}" bucket="${R2_BUCKET:-}" map=mrc-1894 cache='public, max-age=3600' transfers=32
args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run|-n) dry=1 ;;
    --remote) remote="$2"; shift ;;
    --bucket) bucket="$2"; shift ;;
    --map) map="$2"; shift ;;
    --cache) cache="$2"; shift ;;
    --transfers) transfers="$2"; shift ;;
    -h|--help) sed -n '2,32p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) die "unknown option $1 (try --help)" ;;
    *) args+=("$1") ;;
  esac
  shift
done
[[ ${#args[@]} -ge 1 ]] || die "which target? tiles | music | victor | put DIR PREFIX | verify (try --help)"
target="${args[0]}"

# ---- the 1926 guard -------------------------------------------------------------------------------
# Hard: by path (anything under a victor_1926 folder) and by name (every 1926 Victor side we hold,
# plus whatever sits in public/music/victor_1926 today, wherever a copy of it has wandered).
# Before 2027-01-01 a single hit stops the whole run, dry run or not; no flag overrides it.
today="${VICTOR_TODAY:-$(date -u +%Y%m%d)}"   # VICTOR_TODAY only for testing the guard
victor_names='harmonyblues harmonyblues2 midnightmama missouriwobble1 missouriwobble2 muscleshoals thicklipstomp2 whitelightenin yazooblues1 yazooblues2'
if [[ -d "$public/music/victor_1926" ]]; then
  for f in "$public/music/victor_1926"/*.mp3; do
    [[ -e "$f" ]] || continue
    b="$(basename "$f" .mp3)"; victor_names+=" $(tr '[:upper:]' '[:lower:]' <<<"$b")"
  done
fi
victor_free() { [[ "$today" -ge "$VICTOR_FREE" ]]; }
# Reads a file list (paths relative to the source) on stdin; dies on the first 1926 file.
guard() {
  victor_free && { cat >/dev/null; return 0; }
  local hits
  # One awk pass (166k tile paths): a fork per path took a quarter of an hour.
  hits="$(awk -v names="$victor_names" -v dest="/$2/" '
    BEGIN { n = split(names, a, " "); for (i = 1; i <= n; i++) bad[a[i]] = 1; destbad = (dest ~ /\/victor_1926\//) }
    { p = "/" $0; base = tolower($0); sub(/.*\//, "", base); sub(/\.[^.]*$/, "", base)
      if (destbad || p ~ /\/victor_1926\// || (base in bad)) { print "  1926 Victor: " $0 > "/dev/stderr"; h++ } }
    END { print h + 0 }')"
  [[ $hits -eq 0 ]] || die "REFUSED: $hits file(s) from the 1926 Victor sessions in $1. Not public domain until 2027-01-01, and a public bucket is distribution. Nothing was uploaded."
}

# ---- listing --------------------------------------------------------------------------------------
# Summary of a source: counts and size per group. $1 dir, $2 find filter args (as a string).
summary() {
  local dir="$1"; shift
  (cd "$dir" && find . -type f ! -name .DS_Store "$@" -print0 | xargs -0 -n 2000 sh -c 'if stat -f %z . >/dev/null 2>&1; then stat -f "%z %N" "$@"; else stat -c "%s %n" "$@"; fi' sh) |
    awk '{ size = $1; p = substr($0, index($0, " ") + 3); n = split(p, s, "/");
           g = (s[1] == "tiles" && n >= 3) ? "tiles/" s[2] : (n > 1 ? s[1] "/" : p);
           c[g]++; b[g] += size; C++; B += size }
         function h(x) { u = "B"; if (x >= 1024) { x /= 1024; u = "KB" } if (x >= 1024) { x /= 1024; u = "MB" } if (x >= 1024) { x /= 1024; u = "GB" } return sprintf(u == "B" ? "%d %s" : "%.1f %s", x, u) }
         END { for (g in c) printf "    %-24s %8d files  %10s\n", g, c[g], h(b[g]) | "sort -V"; close("sort -V");
               printf "    %-24s %8d files  %10s\n", "total", C, h(B) }'
}
listing() { (cd "$1" && find . -type f ! -name .DS_Store "${@:2}" | sed 's|^\./||'); }

need_rclone() {
  command -v rclone >/dev/null || die "rclone isn't installed (brew install rclone; see docs/assets.md)"
  rclone listremotes | grep -qx "$remote:" || die "no rclone remote \"$remote\" (rclone config; see docs/assets.md)"
  [[ -n "$bucket" ]] || die "which bucket? --bucket NAME or R2_BUCKET=NAME"
}
have_remote() { command -v rclone >/dev/null && rclone listremotes 2>/dev/null | grep -qx "$remote:" && [[ -n "$bucket" ]]; }

# One rclone pass. $1 src, $2 dest prefix, $3 cache-control, $4 content-type ("" = by extension),
# then the files to include (rclone filter patterns; none = everything). --checksum: re-runs send only what changed (MD5 against R2's ETag).
pass() {
  local src="$1" dest="$2" cc="$3" ct="$4"; shift 4
  local hdr=(--header-upload "Cache-Control: $cc")
  [[ -n "$ct" ]] && hdr+=(--header-upload "Content-Type: $ct")
  # Filter rules in order, first match wins: never .DS_Store, never anything under victor_1926.
  local filters=(--filter '- .DS_Store' --filter '- victor_1926/**') inc
  for inc in "$@"; do filters+=(--filter "+ $inc"); done
  [[ $# -gt 0 ]] && filters+=(--filter '- **')
  local run=(rclone copy "$src" "$remote:$bucket/$dest" --checksum --fast-list --s3-no-check-bucket
             --transfers "$transfers" --checkers 64 "${filters[@]}" "${hdr[@]}")
  if [[ $dry -eq 1 ]]; then
    if have_remote; then
      echo "  rclone dry run against $remote:$bucket/$dest (lists, uploads nothing):"
      "${run[@]}" --dry-run 2>&1 | grep -c 'Skipped copy' | awk '{ print "    would send " $1 " file(s) new or changed" }' || true
    else
      echo "  (no rclone remote set up yet: can't ask the bucket what's already there)"
    fi
  else
    "${run[@]}" --progress --stats-one-line
  fi
}

show() {  # dry-run header for a pass
  echo "  -> $remote:${bucket:-<bucket>}/$1"
  echo "     Cache-Control: $2"
  echo "     Content-Type:  ${3:-by extension}"
}

# ---- targets --------------------------------------------------------------------------------------
case "$target" in
  tiles)
    src="$public/maptiles/$map"
    [[ -f "$src/tiles.json" ]] || die "no tile set at $src"
    listing "$src" | guard "$src" "maptiles/$map"
    [[ $dry -eq 1 ]] || need_rclone
    echo "Tiles: $src"
    if [[ $dry -eq 1 ]]; then
      summary "$src" -path './tiles/*' -name '*.webp'
      show "maptiles/$map/tiles/" "$IMMUTABLE" image/webp
    fi
    pass "$src" "maptiles/$map" "$IMMUTABLE" image/webp '/tiles/**.webp'
    if [[ $dry -eq 1 ]]; then
      summary "$src" -name '*.json'
      show "maptiles/$map/{tiles,route}.json, legs/" "$SHORT" application/json
    fi
    # The JSON last, so a new tiles.json never points at tiles not there yet.
    pass "$src" "maptiles/$map" "$SHORT" 'application/json; charset=utf-8' /tiles.json /route.json '/legs/*.json'
    other="$(listing "$src" ! -name '*.webp' ! -name '*.json' | head -5)"
    [[ -z "$other" ]] || echo "  not sent (neither .webp nor .json): $(tr '\n' ' ' <<<"$other")"
    ;;

  music|victor)
    if [[ "$target" == victor ]]; then
      victor_free || die "REFUSED: the 1926 Victor sides can't go up before 2027-01-01 (today is $today). Nothing was uploaded."
      src="$public/music/victor_1926"
    else
      src="$public/music/pre-1926"
    fi
    [[ -d "$src" ]] || die "no records at $src"
    # music: by name, so a 1926 side copied into pre-1926 is caught; victor (after the date) passes.
    [[ "$target" == victor ]] || listing "$src" -name '*.mp3' | guard "$src" music
    [[ $dry -eq 1 ]] || need_rclone
    echo "Records: $src"
    if [[ $dry -eq 1 ]]; then
      summary "$src" -name '*.mp3'
      listing "$src" -name '*.mp3' | sed 's/^/      /'
      show "music/" "$IMMUTABLE" audio/mpeg
      echo "     (always re-sent, so the headers are set even on files already there)"
    else
      # --no-check-dest: four PUTs, and it rewrites the headers of the copies already up.
      rclone copy "$src" "$remote:$bucket/music" --no-check-dest --s3-no-check-bucket \
        --filter '- victor_1926/**' --filter '+ /*.mp3' --filter '- **' --header-upload "Cache-Control: $IMMUTABLE" --header-upload 'Content-Type: audio/mpeg' \
        --progress --stats-one-line
    fi
    ;;

  put)
    [[ ${#args[@]} -eq 3 ]] || die "put DIR PREFIX (e.g. put public/portraits portraits)"
    src="${args[1]}" prefix="${args[2]%/}"
    [[ -d "$src" ]] || die "no folder $src"
    listing "$src" | guard "$src" "$prefix"
    [[ $dry -eq 1 ]] || need_rclone
    echo "Folder: $src"
    [[ $dry -eq 1 ]] && { summary "$src"; show "$prefix/" "$cache" ""; }
    pass "$src" "$prefix" "$cache" ""
    ;;

  verify)
    command -v curl >/dev/null || die "curl isn't installed"
    first_tile="tiles/0/0/0.webp"
    deep="$( (cd "$public/maptiles/$map" 2>/dev/null && find tiles -name '*.webp' -path 'tiles/10/*' | head -1) || true)"
    urls=("maptiles/$map/tiles.json" "maptiles/$map/route.json" "maptiles/$map/$first_tile")
    [[ -n "$deep" ]] && urls+=("maptiles/$map/$deep")
    urls+=(music/tulsablues.mp3 music/asilikeit.mp3)
    for u in "${urls[@]}"; do
      echo "$PUBLIC_HOST/$u"
      curl -sSI -H "Origin: $GAME_ORIGIN" "$PUBLIC_HOST/$u" | tr -d '\r' |
        grep -iE '^(HTTP/|content-type|content-length|cache-control|accept-ranges|access-control-allow-origin|cf-cache-status)' | sed 's/^/    /'
    done
    echo "Range (a seek in a record: want 206 and content-range):"
    curl -sS -o /dev/null -r 0-1023 -w '    %{http_code}  %header{content-range}\n' "$PUBLIC_HOST/music/tulsablues.mp3" 2>/dev/null ||
      curl -sS -o /dev/null -r 0-1023 -w '    %{http_code}\n' "$PUBLIC_HOST/music/tulsablues.mp3"
    echo "A 1926 side must NOT be there before 2027 (want 404):"
    curl -sS -o /dev/null -w '    music/midnightmama.mp3  %{http_code}\n' "$PUBLIC_HOST/music/midnightmama.mp3"
    ;;

  *) die "unknown target $target (tiles | music | victor | put | verify)" ;;
esac
