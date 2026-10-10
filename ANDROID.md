# Android app — Aadu Puli Aatam

Two ways to ship Android. **Option A is recommended** (fully offline, verified).

## Option A — PWABuilder APK (recommended, fully offline)

The web app is a full PWA: `manifest.webmanifest`, `sw.js` service worker
(app-shell precache + offline fallback), install prompt, and offline badge.

1. Deploy the web app (Vercel) so it has a public HTTPS URL:
   `https://your-app.vercel.app`
2. Open https://www.pwabuilder.com and enter that URL.
3. Fix any warnings it reports, then **Package for Android** → download the
   `.aab` → upload to Google Play, or download the `.apk` for direct install.
4. On-device: open the site once in Chrome → **Install app** → the game then
   works **fully offline** (vs AI + local 2-player; online rooms need internet).

## Option B — Capacitor native shell (advanced)

A Capacitor project is scaffolded in `android/` (`appId: com.aadupuli.aatam`).

```bash
npm run android:build    # server build + snapshot + sync, in one step
npm run android:open     # opens Android Studio → Run / Build APK
```

How it works: `android:export` builds a runnable node server
(`NITRO_PRESET=node-server`), boots it, and snapshots the real SSR `/`
HTML into `android-www/index.html` next to the static assets — so the
bundle on-device is the actual game, playable fully offline (vs AI +
hotseat). Then `cap sync` copies it into `android/`.

Local preview: `npm run preview:static` serves the bundle on
http://localhost:4173 (zero dependencies).
Note: plain `vite preview` does NOT work in this repo snapshot — it expects
`dist/server/server.js`, which the nitro/vercel build never emits. That is an
upstream template issue, not a game bug; `preview:static` is the supported
local preview.

## Next updates checklist (for the following iteration)

- [x] App icons are drawn tiger/goat artwork (`node scripts/make-icons.mjs` regenerates them; maskable = goat)
- [x] Real offline Capacitor bundle (`npm run android:build` snapshots SSR HTML)
- [ ] Play-store screenshots: `node store/screenshots.mjs` (needs Playwright
      Chromium once) + convert `store/feature-graphic.svg` to 1024×500 PNG
- [ ] Optional: push notifications / deep links for online-room invites
