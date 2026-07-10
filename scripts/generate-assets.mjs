/**
 * Generates PNG icons / OG preview / splash for MOTH//LAMP using pure Node canvas-free PNG.
 * Minimal valid PNGs with a moth-inspired palette — original project art.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const iconsDir = path.join(root, 'public', 'icons');
const shotsDir = path.join(root, 'public', 'screenshots');
fs.mkdirSync(iconsDir, { recursive: true });
fs.mkdirSync(shotsDir, { recursive: true });

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function writePng(file, width, height, rgbaFn) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a = 255] = rgbaFn(x, y, width, height);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const compressed = zlib.deflateSync(raw);
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  console.log('wrote', file);
}

function mothPixel(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;
  // night sky
  let r = 10,
    g = 6,
    b = 24;
  // moon
  const mdx = nx - 0.78;
  const mdy = ny - 0.22;
  if (mdx * mdx + mdy * mdy < 0.02) {
    r = 179;
    g = 229;
    b = 252;
  }
  // lamp glow
  const ldx = nx - 0.85;
  const ldy = ny - 0.7;
  if (ldx * ldx + ldy * ldy < 0.04) {
    r = Math.min(255, r + 180);
    g = Math.min(255, g + 160);
    b = Math.min(255, b + 40);
  }
  // moth body
  const cx = 0.42;
  const cy = 0.5;
  const dx = (nx - cx) * 2.2;
  const dy = (ny - cy) * 2.8;
  if (dx * dx + dy * dy < 0.035) {
    r = 215;
    g = 204;
    b = 200;
  }
  // wings
  if (Math.abs(nx - 0.35) < 0.08 && Math.abs(ny - 0.48) < 0.1 && ny < 0.55) {
    r = 255;
    g = 224;
    b = 178;
  }
  if (Math.abs(nx - 0.5) < 0.08 && Math.abs(ny - 0.48) < 0.1 && ny < 0.55) {
    r = 255;
    g = 224;
    b = 178;
  }
  // title bar accent
  if (ny > 0.9) {
    r = 255;
    g = 241;
    b = 118;
  }
  return [r, g, b, 255];
}

writePng(path.join(iconsDir, 'icon-192.png'), 192, 192, mothPixel);
writePng(path.join(iconsDir, 'icon-512.png'), 512, 512, mothPixel);
writePng(path.join(iconsDir, 'og-preview.png'), 1200, 630, mothPixel);
writePng(path.join(iconsDir, 'splash.png'), 640, 360, mothPixel);
writePng(path.join(shotsDir, 'title.png'), 1280, 720, mothPixel);
writePng(path.join(shotsDir, 'gameplay.png'), 1280, 720, (x, y, w, h) => {
  const base = mothPixel(x, y, w, h);
  // neon alley tint
  if (x / w > 0.5) {
    return [
      Math.min(255, base[0] + 40),
      Math.min(255, base[1] + 10),
      Math.min(255, base[2] + 60),
      255,
    ];
  }
  return base;
});

// Screenshot generation instructions
fs.writeFileSync(
  path.join(shotsDir, 'README.md'),
  `# Screenshots

Generated placeholders ship for Base.dev listing. For marketing polish:

1. \`npm run dev\`
2. Capture 1280×720 (or device) of: Title, Backyard combat, Neon Alley, Boss, Victory
3. Replace files in this folder
4. Keep captions in \`BASE_DEV_LISTING.md\`

Do not include real wallet addresses or personal data in screenshots.
`,
);

console.log('Asset generation complete.');
