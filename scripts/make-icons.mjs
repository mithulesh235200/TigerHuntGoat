// Regenerates PWA/Android icons with a drawn tiger face (no dependencies).
// Run: node scripts/make-icons.mjs
import { writeFile, mkdir } from "node:fs/promises";
import { deflateSync } from "node:zlib";

const DARK = [23, 20, 18];
const ORANGE = [245, 158, 11];
const DARK_ORANGE = [154, 52, 18];
const CREAM = [255, 247, 237];
const BROWN = [69, 26, 3];
const AMBER_DEEP = [180, 83, 9];
const BLACK = [28, 25, 23];
const WHITE = [255, 255, 255];

function canvas(s, bg) {
  const buf = Buffer.alloc(s * s * 3, 0);
  for (let i = 0; i < s * s; i++) {
    buf[i * 3] = bg[0];
    buf[i * 3 + 1] = bg[1];
    buf[i * 3 + 2] = bg[2];
  }
  return buf;
}
function px(buf, s, x, y, c) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= s || y >= s) return;
  const o = (y * s + x) * 3;
  buf[o] = c[0];
  buf[o + 1] = c[1];
  buf[o + 2] = c[2];
}
function circle(buf, s, cx, cy, r, c) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) px(buf, s, x, y, c);
}
function ellipse(buf, s, cx, cy, rx, ry, c) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
      if ((x - cx) ** 2 / rx ** 2 + (y - cy) ** 2 / ry ** 2 <= 1) px(buf, s, x, y, c);
}
function tri(buf, s, ax, ay, bx, by, cx, cy, c) {
  const sign = (x1, y1, x2, y2, x3, y3) => (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
  const minX = Math.floor(Math.min(ax, bx, cx));
  const maxX = Math.ceil(Math.max(ax, bx, cx));
  const minY = Math.floor(Math.min(ay, by, cy));
  const maxY = Math.ceil(Math.max(ay, by, cy));
  for (let y = minY; y <= maxY; y++)
    for (let x = minX; x <= maxX; x++) {
      const d1 = sign(x, y, ax, ay, bx, by);
      const d2 = sign(x, y, bx, by, cx, cy);
      const d3 = sign(x, y, cx, cy, ax, ay);
      if ((d1 >= 0 && d2 >= 0 && d3 >= 0) || (d1 <= 0 && d2 <= 0 && d3 <= 0)) px(buf, s, x, y, c);
    }
}
function bar(buf, s, x, y, w, h, c) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(buf, s, i, j, c);
}
function strokePath(buf, s, pts, r, c) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(dist / Math.max(0.5, r / 2)));
    for (let k = 0; k <= steps; k++) {
      circle(buf, s, x0 + ((x1 - x0) * k) / steps, y0 + ((y1 - y0) * k) / steps, r, c);
    }
  }
}

function drawTiger(s) {
  const buf = canvas(s, DARK);
  const cx = s / 2;
  const u = s / 64; // design unit
  // Ears
  tri(buf, s, cx - 18 * u, 20 * u, cx - 26 * u, 4 * u, cx - 6 * u, 14 * u, DARK_ORANGE);
  tri(buf, s, cx + 18 * u, 20 * u, cx + 26 * u, 4 * u, cx + 6 * u, 14 * u, DARK_ORANGE);
  // Head
  circle(buf, s, cx, 36 * u, 20 * u, DARK_ORANGE);
  circle(buf, s, cx, 36 * u, 18.5 * u, ORANGE);
  // Forehead stripes
  bar(buf, s, Math.round(cx - 1 * u), Math.round(19 * u), Math.max(2, Math.round(2 * u)), Math.round(8 * u), BROWN);
  bar(buf, s, Math.round(cx - 9 * u), Math.round(20 * u), Math.max(2, Math.round(2 * u)), Math.round(7 * u), BROWN);
  bar(buf, s, Math.round(cx + 7 * u), Math.round(20 * u), Math.max(2, Math.round(2 * u)), Math.round(7 * u), BROWN);
  // Cheek stripes
  bar(buf, s, Math.round(cx - 17 * u), Math.round(32 * u), Math.round(6 * u), Math.max(1, Math.round(1.6 * u)), BROWN);
  bar(buf, s, Math.round(cx + 11 * u), Math.round(32 * u), Math.round(6 * u), Math.max(1, Math.round(1.6 * u)), BROWN);
  // Eyes
  for (const ex of [cx - 8 * u, cx + 8 * u]) {
    ellipse(buf, s, ex, 33 * u, 4.8 * u, 3.8 * u, CREAM);
    circle(buf, s, ex, 33 * u, 2.6 * u, AMBER_DEEP);
    ellipse(buf, s, ex, 33 * u, 1.1 * u, 1.9 * u, BLACK);
    circle(buf, s, ex + 0.9 * u, 32.2 * u, 0.8 * u, WHITE);
  }
  // Muzzle + nose + mouth
  ellipse(buf, s, cx, 44.5 * u, 10 * u, 7 * u, CREAM);
  tri(buf, s, cx - 4 * u, 41 * u, cx + 4 * u, 41 * u, cx, 45.5 * u, BROWN);
  bar(buf, s, Math.round(cx), Math.round(45.5 * u), 1, Math.round(3 * u), BROWN);
  return buf;
}

function drawGoat(s) {
  const buf = canvas(s, [2, 44, 34]);
  const cx = s / 2;
  const u = s / 64;
  const HORN = [214, 211, 209];
  const HORN_DK = [87, 83, 78];
  const CREAM = [250, 250, 249];
  const EAR = [231, 229, 228];
  const NOSE = [214, 160, 142];
  // Curved ridged horns (behind head)
  const hornL = [
    [cx - 7 * u, 27 * u],
    [cx - 14 * u, 17 * u],
    [cx - 16 * u, 8 * u],
    [cx - 12 * u, 3 * u],
  ];
  const hornR = hornL.map(([x, y]) => [2 * cx - x, y]);
  strokePath(buf, s, hornL, 3 * u, HORN);
  strokePath(buf, s, hornR, 3 * u, HORN);
  // Horn ridge ticks
  bar(buf, s, Math.round(cx - 19 * u), Math.round(13 * u), Math.round(6 * u), Math.max(1, Math.round(1.4 * u)), HORN_DK);
  bar(buf, s, Math.round(cx - 17.5 * u), Math.round(19 * u), Math.round(6 * u), Math.max(1, Math.round(1.4 * u)), HORN_DK);
  bar(buf, s, Math.round(cx + 13 * u), Math.round(13 * u), Math.round(6 * u), Math.max(1, Math.round(1.4 * u)), HORN_DK);
  bar(buf, s, Math.round(cx + 11.5 * u), Math.round(19 * u), Math.round(6 * u), Math.max(1, Math.round(1.4 * u)), HORN_DK);
  // Drooping ears
  tri(buf, s, cx - 11 * u, 34 * u, cx - 21 * u, 37 * u, cx - 12 * u, 41 * u, EAR);
  tri(buf, s, cx + 11 * u, 34 * u, cx + 21 * u, 37 * u, cx + 12 * u, 41 * u, EAR);
  // Head + forelock
  ellipse(buf, s, cx, 37 * u, 10 * u, 12 * u, CREAM);
  tri(buf, s, cx - 5 * u, 27 * u, cx, 22 * u, cx + 5 * u, 27 * u, EAR);
  // Eyes with horizontal slit pupils
  for (const ex of [cx - 4.5 * u, cx + 4.5 * u]) {
    ellipse(buf, s, ex, 37 * u, 2.8 * u, 2.4 * u, WHITE);
    bar(
      buf, s,
      Math.round(ex - 2.4 * u), Math.round(37 * u - 0.9 * u),
      Math.round(4.8 * u), Math.max(1, Math.round(1.8 * u)),
      BLACK,
    );
  }
  // Nose + goatee beard
  ellipse(buf, s, cx, 44.5 * u, 3.2 * u, 2.4 * u, NOSE);
  tri(buf, s, cx - 2.5 * u, 47 * u, cx + 2.5 * u, 47 * u, cx, 53 * u, EAR);
  return buf;
}
function crc(table, buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(table, type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const cb = Buffer.alloc(4);
  cb.writeUInt32BE(crc(table, body));
  return Buffer.concat([len, body, cb]);
}
function toPng(rgb, s) {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  const raw = Buffer.alloc((s * 3 + 1) * s);
  for (let y = 0; y < s; y++) {
    raw[y * (s * 3 + 1)] = 0;
    rgb.copy(raw, y * (s * 3 + 1) + 1, y * s * 3, (y + 1) * s * 3);
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(s, 0);
  ihdr.writeUInt32BE(s, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    sig,
    chunk(table, "IHDR", ihdr),
    chunk(table, "IDAT", deflateSync(raw)),
    chunk(table, "IEND", Buffer.alloc(0)),
  ]);
}

const out = [
  ["public/icons/icon-192.png", 192, drawTiger],
  ["public/icons/icon-512.png", 512, drawTiger],
  ["public/icons/maskable-512.png", 512, drawGoat],
  ["public/icons/apple-touch-icon.png", 180, drawTiger],
];
await mkdir("public/icons", { recursive: true });
for (const [file, size, draw] of out) {
  await writeFile(file, toPng(draw(size), size));
  console.log("wrote", file);
}
