// Builds the local web bundle for Capacitor (android-www/).
// Strategy: build a runnable node server (NITRO_PRESET=node-server),
// boot it, snapshot the SSR "/" HTML (proven 200), and combine it with
// the static assets. The game is 100% client-side after load, so the
// snapshot + cached assets run fully offline on-device.
// Falls back to a loader page if anything fails (exit 0, loud warning).
import { spawn } from "node:child_process";
import { cp, mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const www = path.join(root, "android-www");
const PROD_URL = process.env.PROD_URL || "https://your-deployed-app.vercel.app";

function fail(msg) {
  console.warn(`[android-www] WARNING: ${msg}`);
  console.warn("[android-www] Writing fallback loader page.");
  console.warn("[android-www] For a fully-offline APK use the PWABuilder flow (see ANDROID.md).");
}

async function main() {
  await rm(www, { recursive: true, force: true });
  await mkdir(www, { recursive: true });

  // 1. Server build (skips prerender; PRERENDER stays unset).
  try {
    execSync("npm run build", {
      cwd: root,
      env: { ...process.env, NITRO_PRESET: "node-server" },
      stdio: "ignore",
    });
  } catch {
    fail("node-server build failed.");
    await writeFile(path.join(www, "index.html"), fallbackHtml(), "utf8");
    process.exit(0);
    return;
  }

  const pubCandidates = [path.join(root, ".output", "public")];
  const pub = pubCandidates.find((p) => existsSync(p));
  const serverEntry = path.join(root, ".output", "server", "index.mjs");
  if (!pub || !existsSync(serverEntry)) {
    fail("build output missing.");
    await writeFile(path.join(www, "index.html"), fallbackHtml(), "utf8");
    process.exit(0);
    return;
  }
  await cp(pub, www, { recursive: true });

  // 2. Boot + snapshot.
  const port = 4173;
  const child = spawn(process.execPath, [serverEntry], {
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
    stdio: "ignore",
    detached: true,
    windowsHide: true,
  });
  try {
    const ready = await waitForServer(port, 25000);
    if (!ready) throw new Error("server did not start");
    const res = await fetch(`http://127.0.0.1:${port}/?source=capacitor`);
    const html = await res.text();
    if (!res.ok || !html.includes("<html")) throw new Error(`snapshot HTTP ${res.status}`);
    await writeFile(path.join(www, "index.html"), html, "utf8");
    console.log("[android-www] exported with prerendered index.html");
  } catch (e) {
    fail(e.message || "snapshot failed");
    await writeFile(path.join(www, "index.html"), fallbackHtml(), "utf8");
  } finally {
    try {
      if (process.platform === "win32" && child.pid) {
        execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: "ignore" });
      } else {
        child.kill();
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
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
    setTimeout(tick, 1200);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
