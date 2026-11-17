# Assets: the bucket, the upload, going live

The game ships without its heavy assets. A production build reads them from the R2 bucket served at
`https://snag-assets.astounding.games` (`.env.production`), and development reads `public/` (untracked):

| In the bucket | From (main checkout) | Cache-Control | Content-Type |
|---|---|---|---|
| `maptiles/mrc-1894/tiles/{z}/{x}/{y}.webp` | `public/maptiles/mrc-1894/tiles/` | `public, max-age=31536000, immutable` | `image/webp` |
| `maptiles/mrc-1894/tiles.json`, `route.json`, `legs/*.json` | `public/maptiles/mrc-1894/` | `public, max-age=300` | `application/json; charset=utf-8` |
| `music/*.mp3` (the 1924-25 OKeh sides) | `public/music/pre-1926/` | `public, max-age=31536000, immutable` | `audio/mpeg` |
| `music/*.mp3` (the 1926 Victor sides) | `public/music/victor_1926/` | not before **2027-01-01** | |

The script is `scripts/upload-assets.sh`. Run `--help` for the options. It only uploads when you run
it yourself; nothing in the build or deploy calls it.

The tile set is 166,429 files, 863 MB of actual data. `du` says 1.3 GB because it counts disk blocks.

## The 1926 guard

The Victor sides from 1926 enter the US public domain on 2027-01-01. A public bucket counts as
distribution, so the script refuses to send them before that date:

- **By path:** any file under a `victor_1926/` folder, or any destination under one.
- **By name:** all ten 1926 sides (Harmony Blues 1 and 2, Midnight Mama, Missouri Wobble 1 and 2,
  Muscle Shoals, Thick Lip Stomp, White Lightnin', Yazoo Blues 1 and 2). Names are checked
  case-insensitively, plus whatever is in `public/music/victor_1926/` that day. A copy dropped
  into `pre-1926/` or any other folder is still caught.
- **By date:** while `date -u` is before 2027-01-01, a single hit stops the whole run, dry run
  included, and nothing is sent. No flag overrides it. On or after that date, `victor` uploads
  them.

Tested: `music` with a 1926 side copied into `pre-1926`, `put` of `public/music` (13 hits), `put`
into a `victor_1926/` prefix, an upper-case name, and `victor` before and after the date
(`VICTOR_TODAY=20270101`, a testing hook).

## One-time setup

### 1. rclone

```bash
brew install rclone
```

### 2. An API token with the least rights

Cloudflare dashboard → **R2 Object Storage** → **Manage API tokens** → **Create API token**:

- **Permissions:** *Object Read & Write*. Not *Admin*: the script never creates or deletes buckets
  or changes their settings.
- **Specify bucket(s):** *Apply to specific buckets only* → the assets bucket.
- **TTL:** whatever you like. A short one is fine, since you can make a new token for each big
  upload.

The token page shows an **Access Key ID** and a **Secret Access Key** (copy them now; the secret
is shown once). It also shows the S3 endpoint, `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
The R2 overview page shows the bucket's name.

### 3. The rclone remote

Run `rclone config` → `n` (new remote) → name `r2` → storage `s3` → provider `Cloudflare` →
`env_auth` false → paste the access key and the secret → region `auto` → the endpoint above. Leave
the rest at the defaults. The secret stays in `~/.config/rclone/rclone.conf`, not in your shell
history. The remote should end up like this:

```ini
[r2]
type = s3
provider = Cloudflare
access_key_id = …
secret_access_key = …
region = auto
endpoint = https://<ACCOUNT_ID>.r2.cloudflarestorage.com
acl = private
no_check_bucket = true
```

Check it (this only lists):

```bash
rclone lsf r2:<bucket>/music
```

Then tell the script the bucket once per shell, or pass `--bucket` each time:

```bash
export R2_BUCKET=<bucket>
```

## Uploading

### Dry run first (sends nothing)

```bash
scripts/upload-assets.sh --dry-run tiles
```

```bash
scripts/upload-assets.sh --dry-run music
```

The dry run prints the count and size per zoom level and file group, and the headers each group
will get. Once the remote is set up, it also asks the bucket how many files are new or changed
(rclone `--dry-run`, which only lists). The tiles dry run takes a few seconds.

### The real thing

```bash
scripts/upload-assets.sh tiles
```

The tiles go up first, 32 at a time (`--transfers 64` if your line is fast), then the JSON last,
so a new `tiles.json` never points at tiles that aren't up yet. Re-running is safe and
incremental: `--checksum` compares each file's MD5 with the bucket's copy and skips matches, so an
interrupted upload picks up where it stopped.

Expect somewhere from tens of minutes to an hour or two, depending on your upload speed and how many
PUTs R2 accepts per second.

### Fix the headers on the four records already up

They went up without Cache-Control. This re-sends all four (four PUTs, 18 MB) with
`Cache-Control: public, max-age=31536000, immutable` and `Content-Type: audio/mpeg`:

```bash
scripts/upload-assets.sh music
```

Or, the same as a bare rclone one-liner:

```bash
rclone copy "$(git worktree list | head -1 | cut -d' ' -f1)/public/music/pre-1926" r2:$R2_BUCKET/music --no-check-dest --s3-no-check-bucket --include '*.mp3' --header-upload 'Cache-Control: public, max-age=31536000, immutable' --header-upload 'Content-Type: audio/mpeg'
```

### Anything else later

```bash
scripts/upload-assets.sh --dry-run put path/to/folder some/prefix
```

`put` sets Content-Type by extension and uses `--cache` for Cache-Control (default one hour). Use
`--cache 'public, max-age=31536000, immutable'` only for files that will never change at that path.
The 1926 guard applies to `put` too.

## Verifying

```bash
scripts/upload-assets.sh verify
```

This makes GET requests (headers shown, bodies thrown away) to the public host, sending `Origin: https://snag.astounding.games`
the way the game does. For each file it shows the status, content type, length, cache-control,
`accept-ranges`, `access-control-allow-origin` and `cf-cache-status`. It then checks a byte-range
request on a record (want `206` with `content-range`, which is what lets you seek in a record),
and that a 1926 side is *not* there (want `404`).

`verify` against the live bucket on 2026-11-17:

- The records were `200`, `audio/mpeg`, with `accept-ranges: bytes`, and the range request gave
  `206`.
- They had **no cache-control**, **no access-control-allow-origin** and
  `cf-cache-status: DYNAMIC`. That last one was a false alarm: HEAD requests (`curl -I`) always say
  DYNAMIC. A GET shows `MISS`, then `HIT`. The checklist below fixes the first two.
- The tiles and JSON were `404` (not up yet), and `midnightmama.mp3` was `404` (good).

To check one file by hand:

```bash
curl -s -o /dev/null -D - -H "Origin: https://snag.astounding.games" https://snag-assets.astounding.games/maptiles/mrc-1894/tiles/0/0/0.webp
```

## After MapWright re-tiles

Tiles are cached as *immutable* for a year, so a browser that has a tile never asks for it again.
That means **changed pixels must go to a new path**:

- **The picture changed** (re-rendered, recoloured, re-cut): rename the local folder (for example
  `public/maptiles/mrc-1894b/`), then run `scripts/upload-assets.sh --map mrc-1894b tiles`. Point
  `VITE_MAP_ROOT` in `.env.production` (and `.env.development`) at `…/maptiles/mrc-1894b/` and
  deploy. Once the new folder is live, the old one can go (`rclone purge r2:$R2_BUCKET/maptiles/mrc-1894`:
  your call, it can't be undone, and keeping it costs pennies).
- **Only new tiles, or only the JSON changed** (a new leg, a nudged route): re-run `tiles` into
  the same folder. `--checksum` sends only the new or changed files. The JSON's five-minute
  max-age lets it refresh by itself.

## Costs and limits (R2, as of late 2026: check Cloudflare's pricing page)

- **Free each month:** 10 GB-month of storage, 1 million Class A operations (writes and lists), and
  10 million Class B operations (reads). **Egress is free.**
- **The first tile upload:** about 166k PUTs plus a few hundred list calls, all Class A, so about a
  sixth of the free month. A re-run that finds nothing new costs only the listing (`--fast-list`
  keeps that to a few hundred calls). A full re-tile into a new folder costs another 166k.
- **Storage:** under 1 GB with the tiles and records.
- **Reads:** only cache misses reach R2 and count as Class B. Once the cache rule is on, the
  edge answers most requests.
- **Over the free tier** (Standard storage): writes about $4.50 per million, reads about $0.36 per
  million, storage about $0.015 per GB-month.
- **Per object:** the largest single PUT is 5 GB. No file here comes close.

## Go-live checklist

**Bucket**

- [ ] **Tiles uploaded:** `scripts/upload-assets.sh tiles`, then a re-run, which should send 0.
      `scripts/upload-assets.sh --dry-run tiles` should then show "would send 0" for both passes.
- [ ] **Spot-checked:** `scripts/upload-assets.sh verify` shows tiles.json, route.json, a z0 tile
      and a z10 tile all `200` with the right type and cache-control.
- [ ] **Records' headers fixed:** `scripts/upload-assets.sh music`. `verify` then shows
      `cache-control: public, max-age=31536000, immutable` on the mp3s.
- [ ] **No 1926 sides in the bucket** (`rclone lsf r2:$R2_BUCKET/music`): only `asilikeit`,
      `babydear`, `tulsablues` and `vinestreet`, at least until 2027-01-01.
      `verify` shows `midnightmama.mp3` as `404`.

**CORS: needed, not optional**

The game reads the bucket from another origin in two ways, and both need
`Access-Control-Allow-Origin`:

1. `legs.ts` `fetch()`es `tiles.json`, `route.json` and `legs/*.json`. Without the header, the map
   doesn't load **anywhere**.
2. On an iPhone, the player fades through Web Audio (`createMediaElementSource`, with
   `el.crossOrigin = 'anonymous'`). Without the header, **the records don't play on an iPhone at
   all**. Desktop browsers use `el.volume` and don't need it.

The tiles are plain `<img>` tags and don't need it.

- [ ] **The R2 CORS policy:** bucket → **Settings** → **CORS Policy** → **Add**:

  ```json
  [
    {
      "AllowedOrigins": ["https://snag.astounding.games"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["Range"],
      "ExposeHeaders": ["Content-Length", "Content-Range", "Accept-Ranges"],
      "MaxAgeSeconds": 86400
    }
  ]
  ```

  Add `http://localhost:4173` to `AllowedOrigins` if you want `vite preview` of a production build
  to read the bucket. Dev mode (`vite`) reads `public/` and doesn't need it.
- [ ] **A response-header rule as well, because of the edge cache.** R2 only adds the CORS header
      when the request carries an `Origin`. Cloudflare's cache doesn't key on `Origin`, so
      whichever request fills the cache decides whether the header is in the cached copy. A
      desktop browser asks for a record *without* `Origin`. If that response is cached, an iPhone
      then gets a copy with no CORS header and the record fails. The fix is a static header on
      every response: **Rules** → **Transform Rules** → **Modify Response Header** → when the
      hostname equals `snag-assets.astounding.games` → **Set static**
      `Access-Control-Allow-Origin` = `https://snag.astounding.games`.
      (Or make the player set `crossOrigin` on every deck, so every request sends `Origin`.)
- [ ] `verify` shows `access-control-allow-origin: https://snag.astounding.games` on the JSON and
      the mp3s.

**Edge cache**

- [ ] **A cache rule:** **Caching** → **Cache Rules** → **Create** → when the hostname equals
      `snag-assets.astounding.games` → **Eligible for cache**; Edge TTL *Use cache-control header
      if present*; Browser TTL *Respect origin*. Without it, `.json` isn't cached at all (it's not
      in Cloudflare's default extension list). Check with a GET, not `curl -I`: a HEAD request always says `DYNAMIC`.
- [ ] Run `verify` twice. The second run should show `cf-cache-status: HIT` (`MISS` the first
      time).

**The build**

- [ ] `.env.production` has `VITE_MAP_ROOT=https://snag-assets.astounding.games/maptiles/mrc-1894/`
      and `VITE_MUSIC_ROOT=https://snag-assets.astounding.games/music/`. Keep the trailing slashes:
      the code appends file names directly.
- [ ] A production build ships no assets. The command below should show `assets boat favicon.svg
      fonts icons index.html manifest.webmanifest`, with no `maptiles` and no `music`. (Checked
      2026-11-17 in a worktree.)

  ```bash
  npx vite build && ls dist
  ```

**Dates**

- [ ] **The Victor sides stay local until 2027-01-01.** On or after that date:
      `scripts/upload-assets.sh --dry-run victor`, then `scripts/upload-assets.sh victor`, then the
      bandstand playlist.

**The live site** (after the deploy from `main`)

- [ ] **The opening shot loads tiles:** no grey squares. In the dev tools' Network tab, the tiles
      come from `snag-assets…` with `200`, and nothing is blocked by CORS in the console.
- [ ] **Music plays after a tap**, and the credit shows. Seeking or looping works (range requests).
- [ ] **iPhone Safari:** the map loads, music plays after a tap, and it fades in and out (the Web
      Audio path, the one that needs CORS). Test with a cold cache: a private tab, or clear the
      site's data.
- [ ] **A second load** is fast, with tiles from the disk cache.
