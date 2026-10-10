// Captures Play Store screenshots with Playwright (Chromium).
// Prereqs (once):  npx playwright install chromium
// Run from repo root:  node store/screenshots.mjs
// Serves android-www/ (build it first: npm run android:export), then shots:
//   1. setup screen, 2. live board (fresh game), 3. Tamil + Ivory theme.
// Output: store/shots/*.png (1080x1920 portrait).
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";

const PORT = 4179;
const server = spawn("node", ["scripts/preview-static.mjs", "android-www", String(PORT)], {
  stdio: "ignore",
  windowsHide: true,
});
await new Promise((r) => setTimeout(r, 1500));

let playwright;
try {
  playwright = await import("playwright");
} catch {
  console.error(
    "Playwright not installed. Run: npm i -D playwright && npx playwright install chromium",
  );
  server.kill();
  process.exit(1);
}

await mkdir("store/shots", { recursive: true });
const browser = await playwright.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });

await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.screenshot({ path: "store/shots/01-setup.png" });

await page.getByRole("button", { name: /start battle/i }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: "store/shots/02-board.png" });

await browser.close();
server.kill();
console.log("shots saved to store/shots/");
process.exit(0);
