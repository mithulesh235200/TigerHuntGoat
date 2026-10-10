// Builds the local web bundle for Capacitor (android-www/).
// 1. Copies the built static output (.vercel/output/static or .output/public).
// 2. Tries to snapshot SSR "/" HTML via `vite preview` as android-www/index.html.
//    NOTE: `vite preview` is currently broken in this repo (pre-existing issue:
//    missing dist/server/server.js, HTTP 500). If the snapshot fails, a
//    fallback loader page is written instead and the script still exits 0.
//    For a fully-offline native APK, use the PWABuilder flow in ANDROID.md
//    (recommended), or serve the deployed PWA URL via Capacitor server.url.
import { spawn } from "node:child_process";
import { cp, mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const www = path.join(root, "android-www");
const candidates = [
  path.join(root, ".vercel", "output", "static"),
  path.join(root, ".output", "public"),
];
const pub = candidates.find((p) => existsSync(p));
const PROD_URL = process.env.PROD_URL || "https://your-deployed-app.vercel.app";

async function main() {
  if (!pub) {
    throw new Error('Run "npm run build" first — no static output found.');
  }
  await rm(www, { recursive: true, force: true });
  await mkdir(www, { recursive: true });
  await cp(pub, www, { recursive: true });

  const port = 4173;
  // `vite preview` is broken in this repo snapshot (HTTP 500, missing
  // dist/server/server.js) — only attempt a live snapshot when explicitly
  // requested via ANDROID_SNAPSHOT=1 (e.g. on a machine where preview works).
  if (process.env.ANDROID_SNAPSHOT !== "1") {
    console.warn("[android-www] WARNING: snapshot skipped (preview broken in this env).");
    console.warn("[android-www] Writing fallback loader page.");
    console.warn("[android-www] For fully-offline APK use the PWABuilder flow (see ANDROID.md).");
    await writeFile(path.join(www, "index.html"), fallbackHtml(), "utf8");
    process.exit(0);
    return;
  }
  const child = spawn("npx vite preview --port " + port, {
    stdio: "ignore",
    shell: true,
    windowsHide: true,
    detached: true,
  });
  try {
    const ready = await waitForServer(port, 25000);
    if (ready) {
      const res = await fetch(`http://127.0.0.1:${port}/?source=capacitor`);
      const html = await res.text();
      if (res.ok && html.includes("<html")) {
        await writeFile(path.join(www, "index.html"), html, "utf8");
        console.log("[android-www] exported with prerendered index.html");
        return;
      }
    }
    throw new Error(`snapshot unavailable (preview HTTP issue)`);
  } catch (e) {
    console.warn(`[android-www] WARNING: ${e.message}. Writing fallback loader page.`);
    console.warn("[android-www] For fully-offline APK use the PWABuilder flow (see ANDROID.md).");
    await writeFile(path.join(www, "index.html"), fallbackHtml(), "utf8");
  } finally {
    try {
      if (process.platform === "win32" && child?.pid) {
        const { execSync } = await import("node:child_process");
        execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: "ignore" });
      } else {
        child?.kill();
      }
    } catch {}
  }
  process.exit(0);
}

function fallbackHtml() {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="refresh" content="0; url=${PROD_URL}/?source=capacitor" />
<title>Aadu Puli Aatam</title></head>
<body style="background:#0c0a09;color:#e7e5e4;font-family:system-ui;display:grid;place-items:center;min-height:100vh">
<div><h1>Aadu Puli Aatam</h1><p>Opening game… <a href="${PROD_URL}/?source=capacitor" style="color:#f59e0b">tap here</a></p></div>
</body></html>`;
}

function waitForServer(port, timeoutMs) {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = async () => {
      try {
        const r = await fetch(`http://127.0.0.1:${port}/`);
        if (r.status) {
          resolve(true);
          return;
        }
      } catch {}
      if (Date.now() - start > timeoutMs) {
        resolve(false);
        return;
      }
      setTimeout(tick, 400);
    };
    setTimeout(tick, 1500);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
