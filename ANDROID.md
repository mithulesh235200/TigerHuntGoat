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
npm run build
npm run android:export   # copies build into android-www/
npm run android:sync     # syncs into android/app/src/main/assets
npm run android:open     # opens Android Studio → Run / Build APK
```

Notes:
- `npm run android:build` does build + export + sync in one step.
- `android-www/index.html` is a fallback loader pointing at your deployed URL
  (set `PROD_URL=https://your-app.vercel.app` when exporting). A prerendered
  snapshot is attempted only with `ANDROID_SNAPSHOT=1`, because
  `vite preview` is broken in this repo snapshot (pre-existing HTTP 500 from
  missing `dist/server/server.js`).
- Online rooms use Supabase realtime and need internet; vs-AI and hotseat
  modes are local and work offline.

## Next updates checklist (for the following iteration)

- [x] App icons are drawn tiger/goat artwork (`node scripts/make-icons.mjs` regenerates them; maskable = goat)
- [ ] Add Play-store screenshots + feature graphic
- [ ] Verify `vite preview` 500 fix after upstream template update, then enable
      static snapshot by default in `scripts/export-android.mjs`
- [ ] Optional: push notifications / deep links for online-room invites
