# JammzZzList

A Spotify-powered playlist builder, redesigned from the ground up with a real audio player,
a local audio library, and a genuine downloader — built around what Spotify's platform
actually allows.

## Why this looks different from a typical "Spotify app" tutorial

Two things about the original project changed the plan, and are worth knowing before you dig in:

1. **Spotify's implicit grant OAuth flow was sunset on Nov 27, 2025.** If you're coming from
   an older Jammming-style app using `response_type=token`, that login flow no longer works at
   all. This app uses **Authorization Code + PKCE** instead, which is what Spotify now requires
   for browser apps.
2. **There's no "download Spotify tracks as MP3" feature, on purpose.** Spotify's Developer/Widget
   Terms explicitly prohibit letting users download or save content from the platform, and Spotify
   also stopped returning `preview_url` (the 30-second clip) to most newly configured apps as of
   Nov 2024. So instead, this app is a **hybrid**:
   - **Spotify** powers search, discovery, and saving playlists back to your real Spotify account.
   - **A local library** (drag-and-drop your own audio files) gets full playback, a real
     Web-Audio-driven visualizer, and real downloads — single files or a whole playlist zipped
     with an M3U8/JSON/CSV manifest.
   - Spotify tracks play their preview when one is available and otherwise link out to Spotify.
     They never get a "Download" button — that's not a bug, it's the platform's rule.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Spotify

Create (or open) an app at the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
In **Settings → Redirect URIs**, add exactly:

- `http://127.0.0.1:5173/callback` — for local dev. It must be `127.0.0.1`, not `localhost` —
  Spotify no longer accepts `localhost` as a redirect host.
- `https://your-production-domain.example/callback` — for wherever you deploy this.

Copy `.env.example` to `.env` (already done for you, with your original client ID carried over)
and confirm the values:

```bash
VITE_SPOTIFY_CLIENT_ID="your_client_id_here"
VITE_SPOTIFY_REDIRECT_URI="http://127.0.0.1:5173/callback"
```

When you deploy, set `VITE_SPOTIFY_REDIRECT_URI` to your production callback URL in your host's
environment settings, and make sure that exact URL is also added in the Spotify dashboard.

### 3. Run it

```bash
npm run dev      # http://127.0.0.1:5173
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

### 4. Deploying

This is a client-routed SPA (React Router), so your host needs to serve `index.html` for any
path it doesn't recognize — otherwise a direct load of `/callback` or `/playlist/xyz` 404s.
A `public/_redirects` file is already included for Netlify (matching the `jammzzzlist.netlify.app`
domain from the original project's `.env`). Other hosts need their own equivalent: Vercel infers
this automatically for Vite projects, and most others have a similar "SPA fallback" or "rewrite"
setting.

## What's inside

```
src/
  lib/           Framework-free logic: Spotify PKCE auth + search + save, IndexedDB blob
                 storage, playlist export (zip/M3U/JSON/CSV), formatting helpers
  context/       App state: Theme, Toast, Library (playlists/tracks/favorites/history),
                 Player (queue/shuffle/repeat/visualizer), Downloads, Spotify auth
  components/    UI, grouped by common/ layout/ player/ playlist/
  pages/         Home, Search, Playlist, Library, Downloads, OAuth callback
```

State is plain React Context + `useReducer` — no external state library. Playlists, cached
track metadata, favorites, and play history live in `localStorage`; uploaded audio files live
in IndexedDB (binary data doesn't fit well in localStorage's quota). Playback runs through a
single persistent `<audio>` element routed through a Web Audio graph, so the visualizer can
tap real frequency data for local files. If a source is cross-origin and doesn't expose usable
data to the analyser, the visualizer falls back to an ambient animation automatically rather
than guessing up front — it just checks for a few frames of real signal.

## Design system — "Night Session"

Evolves the original brand (deep navy + violet) rather than replacing it:

- **Color**: indigo-black canvas (`#0B0E1A`, not true black) with an electric violet accent
  (`#7C5CFC`) for primary actions, and a warm ember accent (`#FF9D5C`) used sparingly for
  favorites, live indicators, and visualizer peaks. Light mode mirrors this on `#F7F7FC`.
  Every text/button color pairing is checked against WCAG AA.
- **Type**: Bricolage Grotesque for display/headings, Manrope for UI text, JetBrains Mono for
  durations, timestamps, and counts (a "transport readout" feel).
- **Signature motif**: the "zZz" in the wordmark becomes three live equalizer bars whenever
  something is playing.

All tokens are CSS custom properties in `src/index.css`, mapped into Tailwind v4 via `@theme`,
so `dark`/`light` is a single `data-theme` attribute flip rather than `dark:` classes sprinkled
everywhere.

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Play / pause |
| `←` / `→` | Seek -5s / +5s |
| `Shift + ←` / `Shift + →` | Previous / next track |
| `↑` / `↓` | Volume up / down |
| `M` | Mute |
| `S` | Toggle shuffle |
| `R` | Cycle repeat (off → all → one) |
| `/` | Jump to Search |

Shortcuts are disabled while typing in a text field.

## Known limitations

- **Spotify previews aren't guaranteed.** Depending on your app's access level, Spotify may
  return `preview_url: null` for some or all tracks. Those tracks are still searchable and
  saveable to playlists — they just won't play in-app. This is a Spotify-side limitation, not
  something a client can work around.
- **Local files live in the browser.** Uploaded audio is stored in this browser's IndexedDB —
  clearing site data removes it, and it doesn't sync across devices/browsers. Playlists that
  reference local tracks will show them as missing if opened somewhere else.
- **Download history is per-session.** The Downloads page's job list resets on reload; the
  files themselves are unaffected since they've already been saved by the browser.
