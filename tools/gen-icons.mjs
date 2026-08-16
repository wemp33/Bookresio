// Bookresio — PWA icon generator. The logo is a bracketed serif "B", baby blue
// on creamy white, drawn as geometry rather than shipped as an image so every
// size is rendered exactly. No external dependencies.
//   node tools/gen-icons.mjs      (run from the Bookresio/ directory)
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'icons');

/* ---------- minimal PNG encoder ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function encodePNG(width, height, rgba) {
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter: none
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // truecolour + alpha
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- geometry of the letter "B" ----------------------------------
   Normalised 0..1 inside the glyph square. A vertical stem with bracketed
   serifs on the left, and two bowls on the right built as elliptical rings:
   the ring is wide where the curve runs vertically and narrow where it runs
   horizontally, which is what gives a serif face its thick/thin modulation.
   Each counter springs exactly off the right edge of the stem, so the strokes
   join without a step.                                                      */
const CAP_TOP = 0.17, CAP_BOT = 0.83;   // cap height
const WAIST = 0.478;                    // where the two bowls meet
const THIN = 0.042;                     // horizontal (thin) stroke
const SERIF_L = 0.185;                  // left edge of the serifs
const STEM_L = 0.265, STEM_R = 0.385;   // stem
const BR = 0.055;                       // bracket radius

const CX = 0.505;                       // centre of both bowls
const RXI = CX - STEM_R;                // counters spring off the stem
const CY1 = (CAP_TOP + WAIST) / 2, RYO1 = (WAIST - CAP_TOP) / 2, RYI1 = RYO1 - THIN, RXO1 = 0.220;
const CY2 = (WAIST + CAP_BOT) / 2, RYO2 = (CAP_BOT - WAIST) / 2, RYI2 = RYO2 - THIN, RXO2 = 0.244;

const XS = (1 - (SERIF_L + CX + RXO2)) / 2;   // shift that centres the glyph

const ell = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

function inGlyph(x0, y) {
  const x = x0 - XS;
  // stem
  if (x >= STEM_L && x <= STEM_R && y >= CAP_TOP && y <= CAP_BOT) return true;
  // the two serifs, left of the stem
  if (x >= SERIF_L && x <= STEM_L &&
      ((y >= CAP_TOP && y <= CAP_TOP + THIN) || (y >= CAP_BOT - THIN && y <= CAP_BOT))) return true;
  // upper bowl: everything right of the stem minus the counter; past the
  // spring point the outer ellipse takes over as the edge
  if (x >= STEM_R && y >= CAP_TOP && y <= WAIST &&
      !ell(x, y, CX, CY1, RXI, RYI1) && (x <= CX || ell(x, y, CX, CY1, RXO1, RYO1))) return true;
  // lower bowl
  if (x >= STEM_R && y >= WAIST && y <= CAP_BOT &&
      !ell(x, y, CX, CY2, RXI, RYI2) && (x <= CX || ell(x, y, CX, CY2, RXO2, RYO2))) return true;
  // brackets: a square tucked against the stem minus a circle => concave fillet
  for (const [yi, dir] of [[CAP_TOP + THIN, 1], [CAP_BOT - THIN, -1]]) {
    const cx = STEM_L - BR, cy = yi + dir * BR;
    const inBox = x >= cx && x <= STEM_L && (dir > 0 ? y >= yi && y <= cy : y <= yi && y >= cy);
    if (inBox && Math.hypot(x - cx, y - cy) >= BR) return true;
  }
  return false;
}

/* ---------- colours ---------- */
const CREAM_HI = [0xfe, 0xfc, 0xf7];
const CREAM_LO = [0xf1, 0xe9, 0xdb];
const BLUE = [0x5b, 0x93, 0xc7];

function lerp(a, b, t) { return a + (b - a) * t; }

function renderIcon(size, { padding = 0.13, radius = null } = {}) {
  const SS = 4; // supersampling
  const buf = Buffer.alloc(size * size * 4);
  const inner = 1 - 2 * padding;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = (x + (sx + 0.5) / SS) / size;
          const fy = (y + (sy + 0.5) / SS) / size;

          let bgA = 1;
          if (radius !== null) {
            const cx = Math.min(Math.max(fx, radius), 1 - radius);
            const cy = Math.min(Math.max(fy, radius), 1 - radius);
            bgA = Math.hypot(fx - cx, fy - cy) <= radius ? 1 : 0;
          }

          // ground: a very quiet cream gradient across the diagonal
          const t = Math.min(1, Math.max(0, (fx + fy) / 2));
          const bg = [0, 1, 2].map(i => lerp(CREAM_HI[i], CREAM_LO[i], t));

          const lx = (fx - padding) / inner;
          const ly = (fy - padding) / inner;
          const on = lx >= 0 && lx <= 1 && ly >= 0 && ly <= 1 && inGlyph(lx, ly);

          const px = on ? BLUE : bg;
          r += px[0] * bgA; g += px[1] * bgA; b += px[2] * bgA; a += 255 * bgA;
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      buf[i] = Math.round(r / n);
      buf[i + 1] = Math.round(g / n);
      buf[i + 2] = Math.round(b / n);
      buf[i + 3] = Math.round(a / n);
    }
  }
  return encodePNG(size, size, buf);
}

fs.mkdirSync(OUT, { recursive: true });

const targets = [
  ['icon-180.png', 180, { padding: 0.15 }],           // apple-touch-icon (iOS rounds it itself)
  ['icon-192.png', 192, { padding: 0.15 }],
  ['icon-512.png', 512, { padding: 0.15 }],
  ['icon-maskable-512.png', 512, { padding: 0.24 }],  // safe zone for Android masks
  ['favicon-64.png', 64, { padding: 0.10, radius: 0.22 }],
];

for (const [name, size, opts] of targets) {
  fs.writeFileSync(path.join(OUT, name), renderIcon(size, opts));
  console.log('ok:', name, size + 'x' + size);
}

/* ---------- vector version ---------- */
const px = v => +((v + XS) * 100).toFixed(2);   // x, centred
const py = v => +(v * 100).toFixed(2);          // y
const s = v => +(v * 100).toFixed(2);           // radius / length

const outline = [
  `M${px(SERIF_L)} ${py(CAP_TOP)}`,
  `H${px(CX)}`,
  `A${s(RXO1)} ${s(RYO1)} 0 0 1 ${px(CX + RXO1)} ${py(CY1)}`,
  `A${s(RXO1)} ${s(RYO1)} 0 0 1 ${px(CX)} ${py(WAIST)}`,
  `A${s(RXO2)} ${s(RYO2)} 0 0 1 ${px(CX + RXO2)} ${py(CY2)}`,
  `A${s(RXO2)} ${s(RYO2)} 0 0 1 ${px(CX)} ${py(CAP_BOT)}`,
  `H${px(SERIF_L)}`,
  `V${py(CAP_BOT - THIN)}`,
  `H${px(STEM_L - BR)}`,
  `A${s(BR)} ${s(BR)} 0 0 0 ${px(STEM_L)} ${py(CAP_BOT - THIN - BR)}`,
  `V${py(CAP_TOP + THIN + BR)}`,
  `A${s(BR)} ${s(BR)} 0 0 0 ${px(STEM_L - BR)} ${py(CAP_TOP + THIN)}`,
  `H${px(SERIF_L)}`,
  'Z',
].join(' ');

const counter = (cy, ryi) => [
  `M${px(CX - RXI)} ${py(cy)}`,
  `A${s(RXI)} ${s(ryi)} 0 1 1 ${px(CX + RXI)} ${py(cy)}`,
  `A${s(RXI)} ${s(ryi)} 0 1 1 ${px(CX - RXI)} ${py(cy)}`,
  'Z',
].join(' ');

const d = [outline, counter(CY1, RYI1), counter(CY2, RYI2)].join(' ');

fs.writeFileSync(path.join(OUT, 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#FAF6EF"/>
  <path fill-rule="evenodd" d="${d}" fill="#5B93C7"/>
</svg>
`);
console.log('ok: favicon.svg');
console.log('\nlogo path (paste into index.html):\n' + d);
