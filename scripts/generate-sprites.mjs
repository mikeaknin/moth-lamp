/**
 * MOTH//LAMP — top-tier NES / SNES sprite sheets
 * Every character is a HAND-AUTHORED pixel map (no ellipse / blob fillers).
 * Limited palettes, hard outlines, readable silhouettes at native size.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../public/assets/sprites');
fs.mkdirSync(OUT, { recursive: true });

// ── PNG writer ──────────────────────────────────────────────
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function writePng(file, w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    const row = y * (w * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const o = row + 1 + x * 4;
      raw[o] = rgba[i];
      raw[o + 1] = rgba[i + 1];
      raw[o + 2] = rgba[i + 2];
      raw[o + 3] = rgba[i + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  console.log('  ', path.basename(file), `${w}x${h}`);
}

function canvas(w, h) {
  return { w, h, data: new Uint8ClampedArray(w * h * 4) };
}
function put(c, x, y, col) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const i = (y * c.w + x) * 4;
  c.data[i] = col[0];
  c.data[i + 1] = col[1];
  c.data[i + 2] = col[2];
  c.data[i + 3] = col[3] ?? 255;
}
function hex(h) {
  const n = h.startsWith('#') ? h.slice(1) : h;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16), 255];
}
const T = [0, 0, 0, 0];

/** Draw from string map: space / . / 0 = transparent */
function blitMap(c, ox, oy, rows, pal) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === ' ' || ch === '.' || ch === '0') continue;
      const col = pal[ch];
      if (col) put(c, ox + x, oy + y, col);
    }
  }
}

function fromMap(rows, pal) {
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  const c = canvas(w, h);
  blitMap(c, 0, 0, rows, pal);
  return c;
}

function save(name, c) {
  writePng(path.join(OUT, `${name}.png`), c.w, c.h, c.data);
}

// ── NES / SNES palettes ─────────────────────────────────────
const O = hex('#0c0814'); // universal outline
const P = {
  O,
  // moth
  bodyD: hex('#7a5848'),
  bodyM: hex('#c49a7a'),
  bodyL: hex('#efd4b8'),
  fur: hex('#d8b090'),
  wingD: hex('#8b5a2b'),
  wingM: hex('#d4a05a'),
  wingL: hex('#f0d090'),
  wingH: hex('#fff2d0'),
  pat: hex('#c44a18'),
  patD: hex('#7a2808'),
  eye: hex('#ffe14a'),
  eyeW: hex('#ffffff'),
  blastD: hex('#006878'),
  blast: hex('#20c8e0'),
  blastC: hex('#d0ffff'),
  cyan: hex('#18ffff'),
  cyanD: hex('#0088a0'),
  red: hex('#e83838'),
  redL: hex('#ff8080'),
  // env
  night: hex('#0a0618'),
  night2: hex('#120c28'),
  hillD: hex('#1a1438'),
  hillM: hex('#2a2150'),
  hillL: hex('#3d3468'),
  moon: hex('#e8f4ff'),
  moonS: hex('#90caf9'),
  star: hex('#ffffff'),
  starD: hex('#90caf9'),
};

// ═══════════════════════════════════════════════════════════
// MOTH 32×32 — 4 hand frames (wing cycle)
// Legend: O outline  D bodyD  M body  L light  F fur
//         d wingD  m wingM  w wingL  h wingH  p/q pattern
//         e eye  i eye white  b blast  c core  x blast dark
// ═══════════════════════════════════════════════════════════
const mothPal = {
  O: P.O,
  D: P.bodyD,
  M: P.bodyM,
  L: P.bodyL,
  F: P.fur,
  U: P.fur,
  d: P.wingD,
  m: P.wingM,
  w: P.wingL,
  h: P.wingH,
  p: P.pat,
  q: P.patD,
  e: P.eye,
  i: P.eyeW,
  b: P.blast,
  c: P.blastC,
  x: P.blastD,
};

// Dense NES moth — solid silhouette, 4 wing poses
// Frame 0 — wings mid
const moth0 = [
  '................................',
  '........ii.............ii.......',
  '.......ieei...........ieei......',
  '........DD.............DD.......',
  '.........DD...........DD........',
  '..........DDOOOOOOOODD..........',
  '.........OODMLLLLLLMDOO.........',
  '........OODMLeieieLMDOO........',
  '.......OODMMFFFFFFFFMMDOO.......',
  '..OhwmdOODMMMFFFFFMMMDOOdmwhO...',
  '.OhwmmddODMMMMUUUUMMMDOddmmwhO..',
  'OhwmmmddODMMMMMMMMMMMDOddmmmwhO.',
  'hwmmmmdpODMMMDDDDDMMMDO pdmmmwh ',
  'wmmmqdppODMMMDDDDDMMMDO ppdqmmmw',
  'wmmmmdp.ODMMMMMMMMMMDO. pdmmmmw',
  '.wmmmdp.OODMMMMMMMMDOO. pdmmmw.',
  '.wmdp...OODMMMMMMMMDOO...pdmw..',
  '..dp....OOODMMMMMMDOOO....pd...',
  '..p......OODMMMMMMDOO......p...',
  '..........OODDDDDDOO...........',
  '...........OO....OO............',
  '..........DD......DD...........',
  '.........D..........D..........',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
];

// Frame 1 — wings full open
const moth1 = [
  '................................',
  '........ii.............ii.......',
  '.......ieei...........ieei......',
  '........DD.............DD.......',
  '.........DD...........DD........',
  'Ohwmmmmd.DDOOOOOOOODD.dmmmwhO...',
  'hwmmmmmdpOODMLLLLLLMDOOpdmmmmwh.',
  'wmmmmmddpOODMLeieieLMDOOppdmmmmw',
  'wmmmddppOODMMFFFFFFFFMMDOOpdmmmw',
  'mmmmdp..OODMMMFFFFFMMMDOO..pdmmm',
  'mmmdp...ODMMMMUUUUMMMDO...pdmmmm',
  'mmdp....ODMMMMMMMMMMMDO...pdmmm.',
  'mdp.....ODMMMDDDDDMMMDO....pdmm.',
  'dp......ODMMMDDDDDMMMDO.....pdm.',
  'p.......ODMMMMMMMMMMDO......pd..',
  '........OODMMMMMMMMDOO.......p..',
  '.........OODMMMMMMDOO...........',
  '..........OODMMMMDOOO...........',
  '...........OODDDDDOO............',
  '............OO....OO............',
  '...........DD......DD...........',
  '..........D..........D..........',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
];

// Frame 2 — wings mid-down
const moth2 = [
  '................................',
  '........ii.............ii.......',
  '.......ieei...........ieei......',
  '........DD.............DD.......',
  '.........DD...........DD........',
  '..........DDOOOOOOOODD..........',
  '.........OODMLLLLLLMDOO.........',
  '........OODMLeieieLMDOO........',
  '.......OODMMFFFFFFFFMMDOO.......',
  '......OODMMMFFFFFMMMDOO........',
  '..OhwmOODMMMMUUUUMMMDOOmwhO....',
  '.OhwmmddODMMMMMMMMMMMDOddmwhO..',
  'OhwmmmddpODMMMDDDDDMMMDO pdmmwhO',
  'hwmmmqdppODMMMDDDDDMMMDO ppdqmwh',
  'wmmmmmdp.ODMMMMMMMMMMDO. pdmmmw',
  '.wmmmdp..OODMMMMMMMMDOO. pdmmw.',
  '..wmdp...OODMMMMMMMMDOO..pdmw..',
  '...dp....OOODMMMMMMDOOO...pd...',
  '...p......OODMMMMMMDOO.....p...',
  '...........OODDDDDDOO..........',
  '............OO....OO...........',
  '...........DD......DD..........',
  '..........D..........D.........',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
];

// Frame 3 — wings tucked / glide
const moth3 = [
  '................................',
  '........ii.............ii.......',
  '.......ieei...........ieei......',
  '........DD.............DD.......',
  '.........DD...........DD........',
  '..........DDOOOOOOOODD..........',
  '.........OODMLLLLLLMDOO.........',
  '........OODMLeieieLMDOO........',
  '.......OODMMFFFFFFFFMMDOO.......',
  '......OODMMMFFFFFMMMDOO........',
  '.....OODMMMMUUUUMMMDOO.........',
  '....OmODMMMMMMMMMMMDO mO.......',
  '...OwmODMMMDDDDDMMMDO mwO......',
  '..OhwmdODMMMDDDDDMMMDO dmwhO...',
  '.Ohwmdp.ODMMMMMMMMMMDO.pdmwhO..',
  'Ohwmdp..OODMMMMMMMMDOO.pdmwhO..',
  'hwmdp...OODMMMMMMMMDOO..pdmwh..',
  'wmdp....OOODMMMMMMDOOO...pdmw..',
  '.dp......OODMMMMMMDOO.....pd...',
  '..p.......OODDDDDDOO.......p...',
  '...........OO....OO............',
  '..........DD......DD...........',
  '.........D..........D..........',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
];

// Add blaster nozzle on right of thorax for each moth frame after blit
function addBlaster(c) {
  // nozzle at ~x20-25, y14-17
  const pts = [
    [19, 14, P.O],
    [20, 14, P.blastD],
    [21, 14, P.blast],
    [22, 14, P.blastC],
    [23, 14, P.blast],
    [24, 14, P.O],
    [19, 15, P.O],
    [20, 15, P.blast],
    [21, 15, P.blastC],
    [22, 15, P.blastC],
    [23, 15, P.blast],
    [24, 15, P.blast],
    [25, 15, P.O],
    [19, 16, P.O],
    [20, 16, P.blastD],
    [21, 16, P.blast],
    [22, 16, P.blast],
    [23, 16, P.blastD],
    [24, 16, P.O],
  ];
  for (const [x, y, col] of pts) put(c, x, y, col);
}

function mothFrame(rows) {
  // Guarantee NES tile size even if a hand map row is off by 1
  const padded = rows.map((r) => r.replace(/ /g, '.').padEnd(32, '.').slice(0, 32));
  while (padded.length < 32) padded.push('................................');
  const c = fromMap(padded.slice(0, 32), mothPal);
  addBlaster(c);
  return c;
}

function mothDash() {
  // motion blur streak form
  return fromMap(
    [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '.....b..b.......................',
      '....bcccccccc...................',
      '...bccciiiiiccccc...............',
      '..bccciiiiiiiiccccc.............',
      '.bccciiiiiiiiiicccccc...........',
      'bccciiiiiiiiiiiiccccccc.........',
      'bccciiiiiiiiiiiicccccccc........',
      '.bccciiiiiiiiiiccccccc..........',
      '..bccciiiiiiccccccc.............',
      '...bccciicccccc.................',
      '....bccbcccc....................',
      '.....bb.........................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
    ],
    {
      b: P.cyanD,
      c: P.cyan,
      i: hex('#e0ffff'),
    },
  );
}

function mothHurt() {
  return fromMap(
    [
      '................................',
      '.........i...............i......',
      '........e.e.............e.e.....',
      '.........r...............r......',
      '..........r.............r.......',
      '...........r...........r........',
      '............ORRRRRRO............',
      '...........ORRLLLRRO............',
      '..........OORLeieLRRO...........',
      '.........O.ORRLFLRRO.O..........',
      '....OhwmrO.ORRFFFFRRO.OrmwhO....',
      '...Ohwmmr..ORRRFURRRO..rmmwhO...',
      '..Ohwmmrr..ORRRUUURRO..rrmmwhO..',
      '.Ohwmmrp...O.RRRRRRR.O...prmmwhO',
      'Ohwmmrp....O.RRRxxRRO....prmmwhO',
      'h wmmqrp...O.RRxxxRRO...prqmmw h',
      ' wmmrp.....O.RRxxxRRO.....prmmw ',
      '  mmrp.....O.RRRRRRRO.....prmm  ',
      '  mrp......OORRRRRRROO......prm ',
      '  rp........ORRRRRRRO........pr ',
      '  p.........OORRRRROO.........p ',
      '.............OOxxxOO............',
      '..............O..O..............',
      '.............r....r.............',
      '............r......r............',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
    ],
    {
      O: P.O,
      R: P.red,
      L: P.redL,
      r: P.red,
      e: P.eyeW,
      i: P.eyeW,
      F: hex('#ffab91'),
      U: hex('#ffccbc'),
      x: hex('#b71c1c'),
      d: hex('#ff8a65'),
      m: hex('#ffab91'),
      w: hex('#ffccbc'),
      h: hex('#ffe0b2'),
      p: hex('#ff6e40'),
      q: hex('#e64a19'),
    },
  );
}

// ═══════════════════════════════════════════════════════════
// ENEMIES 24×24 — unique silhouettes, 2-frame flap
// ═══════════════════════════════════════════════════════════
const out = O;

function enemyGnat(f) {
  // small green swarm fly — solid NES body
  const pal = {
    O: out,
    D: hex('#33691e'),
    M: hex('#7cb342'),
    L: hex('#c5e1a5'),
    e: hex('#ffffff'),
    i: hex('#0c0814'),
    w: hex('#e8f5e9'),
  };
  const wing = f === 0
    ? [
        '........................',
        '..ww..............ww....',
        '.wLLw............wLLw...',
        '..ww...OOOOOO.....ww....',
      ]
    : [
        '........................',
        '........................',
        '..ww...OOOOOO.....ww....',
        '.wLLw.ODMMMMDO...wLLw...',
      ];
  const body = [
    '.....ODMLLLMDO..........',
    '....ODMLeieLMDO.........',
    '....ODMMFFFFMDO.........',
    '....ODMMMMMMMDO.........',
    '....ODMMMMMMMDO.........',
    '.....ODMMMMMDO..........',
    '......ODMMMDO...........',
    '.......ODDDO............',
    '......O....O............',
    '.....O......O...........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ];
  // assemble
  const rows = f === 0
    ? [...wing, '.....ODMMMMDO...........', ...body.slice(0, 19)]
    : [...wing, '....ODMLeieLMDO.........', ...body.slice(1, 20)];
  // force 24 rows of 24
  const fixed = rows.map((r) => r.padEnd(24, '.').slice(0, 24)).slice(0, 24);
  while (fixed.length < 24) fixed.push('........................');
  return fromMap(fixed, pal);
}

function enemyMosquito(f) {
  const pal = {
    O: out,
    D: hex('#880e4f'),
    M: hex('#e91e63'),
    L: hex('#f8bbd0'),
    e: hex('#ffffff'),
    i: hex('#0c0814'),
    n: hex('#4a148c'),
    w: hex('#fce4ec'),
  };
  const flap = f === 0 ? 0 : 1;
  const rows = [
    '........................',
    '.........O..............',
    '.........n..............',
    '.........n..............',
    '........OOO.............',
    '.......ODMDO............',
    '......ODMLMDO...........',
    '.....ODMLeieLDO.........',
    '.....ODMMFFMMDO.........',
    '....ODMMMFFMMMDO........',
    '....ODMMMMMMMMDO........',
    '.....ODMMMMMMDO.........',
    '......ODMMMMDO..........',
    '.......ODMMDO...........',
    '........ODDO............',
    '.........OO.............',
    '..........nn............',
    '...........nn...........',
    '............n...........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ];
  const c = fromMap(rows, pal);
  put(c, 4, 6 + flap, pal.w);
  put(c, 3, 7 + flap, pal.w);
  put(c, 5, 7 + flap, pal.L);
  put(c, 16, 6 + flap, pal.w);
  put(c, 17, 7 + flap, pal.w);
  put(c, 15, 7 + flap, pal.L);
  // stinger tip
  put(c, 18, 11, pal.D);
  put(c, 19, 11, pal.M);
  return c;
}

function enemyBeetle(f) {
  const pal = {
    O: out,
    D: hex('#3e2723'),
    M: hex('#6d4c41'),
    L: hex('#a1887f'),
    H: hex('#d7ccc8'),
    e: hex('#ffee58'),
    i: hex('#0c0814'),
    s: hex('#5d4037'),
  };
  const bob = f;
  const rows = [
    '........................',
    '........................',
    '......OOOOOOOO..........',
    '.....ODSSSSSSDO.........',
    '....ODSSHHHHSSDO........',
    '....ODSHHHHHHSDO........',
    '....ODSSMMMMSSDO........',
    '....ODSMMFFMMSDO........',
    '....ODSMLeieLMSDO.......',
    '....ODSMMMMMMMSDO.......',
    '....ODSSMMMMSSDO........',
    '....O.DSSSSSSD.O........',
    '.....O.DDDDDD.O.........',
    '......O......O..........',
    '.....O........O.........',
    '....O..........O........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ];
  // shift shell shine by frame
  const c = fromMap(rows, pal);
  if (bob) {
    put(c, 8, 4, pal.H);
    put(c, 9, 4, pal.H);
  }
  // armored legs
  put(c, 5, 13 + bob, pal.D);
  put(c, 6, 14 + bob, pal.M);
  put(c, 14, 13 + bob, pal.D);
  put(c, 13, 14 + bob, pal.M);
  return c;
}

function enemyHeckler(f) {
  // purple fly with speech-bubble hat
  const pal = {
    O: out,
    D: hex('#4527a0'),
    M: hex('#7e57c2'),
    L: hex('#d1c4e9'),
    e: hex('#fff176'),
    i: hex('#0c0814'),
    y: hex('#fff59d'),
    Y: hex('#f9a825'),
    w: hex('#ede7f6'),
  };
  const flap = f === 0 ? 0 : 1;
  const rows = [
    '......YYYYYYYY..........',
    '.....YyyyyyyyyY.........',
    '.....Yy......yY.........',
    '.....YyyyyyyyyY.........',
    '......YYYYYYYY..........',
    '.........YY.............',
    '.......OOOOOO...........',
    '......ODMMMMDO..........',
    '.....ODMLLLMDO..........',
    '....ODMLeieLMDO.........',
    '....ODMMFFFFMDO.........',
    '....ODMMMMMMMDO.........',
    '.....ODMMMMMDO..........',
    '......ODMMMDO...........',
    '.......ODDDO............',
    '........O..O............',
    '.......O....O...........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ];
  const c = fromMap(rows, pal);
  put(c, 3, 8 + flap, pal.w);
  put(c, 2, 9 + flap, pal.w);
  put(c, 15, 8 + flap, pal.w);
  put(c, 16, 9 + flap, pal.w);
  // bubble tail
  put(c, 9, 5, pal.Y);
  put(c, 8, 5, pal.Y);
  return c;
}

function enemyDoomWasp(f) {
  const pal = {
    O: out,
    D: hex('#e65100'),
    M: hex('#ff9800'),
    L: hex('#ffe0b2'),
    B: hex('#212121'),
    e: hex('#ffeb3b'),
    i: hex('#0c0814'),
    w: hex('#fff8e1'),
    s: hex('#ff6d00'),
  };
  const flap = f === 0 ? 0 : 1;
  const rows = [
    '........................',
    '........O....O..........',
    '.......OLO..OLO.........',
    '........O....O..........',
    '.......OOOOOO...........',
    '......ODMLLMDO..........',
    '.....ODMLeieLMDO........',
    '.....ODMMBBMMDO.........',
    '....ODMMMLMMMDO.........',
    '....ODMMBBMMMDO.........',
    '....ODMMMMMMMDO.........',
    '.....ODMMMMMDO..........',
    '......ODMMMDO...........',
    '.......ODDDO............',
    '........O..Oss..........',
    '.......O....Os..........',
    '.............s..........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ];
  const c = fromMap(rows, pal);
  put(c, 2, 5 + flap, pal.w);
  put(c, 1, 6 + flap, pal.w);
  put(c, 3, 6 + flap, pal.L);
  put(c, 16, 5 + flap, pal.w);
  put(c, 17, 6 + flap, pal.w);
  put(c, 15, 6 + flap, pal.L);
  return c;
}

function enemyWebSpinner(f) {
  const pal = {
    O: out,
    D: hex('#455a64'),
    M: hex('#78909c'),
    L: hex('#cfd8dc'),
    e: hex('#ffffff'),
    i: hex('#0c0814'),
    w: hex('#eceff1'),
    t: hex('#b0bec5'),
  };
  const bob = f;
  const rows = [
    '........................',
    '....O..............O....',
    '.....O............O.....',
    '......O..........O......',
    '.......OOOOOOOOOO.......',
    '......ODMMMMMMMMDO......',
    '.....ODMLLLLLLLMDO......',
    '....ODMLeie..eieLMDO....',
    '....ODMMFFFFFFFFMMDO....',
    '....ODMMMMMMMMMMMMDO....',
    '.....ODMMMMMMMMMMDO.....',
    '......ODMMMMMMMMDO......',
    '.......ODDDDDDDDO.......',
    '......O..........O......',
    '.....O............O.....',
    '....O..............O....',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ];
  const c = fromMap(rows, pal);
  // legs twitch
  put(c, 2, 8 + bob, pal.t);
  put(c, 21, 8 + bob, pal.t);
  put(c, 1, 12 + bob, pal.t);
  put(c, 22, 12 + bob, pal.t);
  return c;
}

function enemyLampLeech(f) {
  const pal = {
    O: out,
    D: hex('#4a148c'),
    M: hex('#8e24aa'),
    L: hex('#e1bee7'),
    G: hex('#fff176'),
    g: hex('#ffecb3'),
    e: hex('#ea80fc'),
    i: hex('#0c0814'),
    s: hex('#ce93d8'),
  };
  const suck = f === 0 ? 0 : 1;
  const rows = [
    '........................',
    '........................',
    '.......OOOOOO...........',
    '......ODMMMMDO..........',
    '.....ODMLLLMDO..........',
    '....ODMLeieLMDO.........',
    '....ODMMFFFFMDO.........',
    '....ODMMMMMMMDO.........',
    '.....ODMMMMMDO..........',
    '......ODMMMDO...........',
    '.......ODMDO............',
    '........ODO.............',
    '.........O..............',
    '........GgG.............',
    '.......GgggG............',
    '........GgG.............',
    '.........s..............',
    '.........s..............',
    '........s.s.............',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ];
  const c = fromMap(rows, pal);
  if (suck) {
    put(c, 10, 16, pal.G);
    put(c, 11, 17, pal.g);
    put(c, 12, 16, pal.G);
  }
  return c;
}

const ENEMY_FN = {
  gnat: enemyGnat,
  mosquito: enemyMosquito,
  beetle: enemyBeetle,
  heckler: enemyHeckler,
  doomWasp: enemyDoomWasp,
  webSpinner: enemyWebSpinner,
  lampLeech: enemyLampLeech,
};

// ═══════════════════════════════════════════════════════════
// STAGE BOSSES — hand-authored NES silhouettes (no ellipse fills)
// boss_briar 48×40 · boss_neon 48×40 · boss_tyrant 64×48
// ═══════════════════════════════════════════════════════════

/** Briar Colossus — dense NES beetle boss (armor plates + thorns) */
function bossBriar(f) {
  const bob = f === 1 ? 1 : 0;
  const rage = f === 2;
  const O = out;
  const D = hex('#2c1810');
  const M = hex('#5d4037');
  const L = hex('#8d6e63');
  const H = hex('#d7ccc8');
  const G = hex('#1b5e20');
  const g = hex('#43a047');
  const t = hex('#33691e');
  const e = hex('#ffee58');
  const i = hex('#ffffff');
  const R = hex('#c62828');
  const c = canvas(48, 40);

  // Solid dome shell — stepped NES armor (not soft ellipse gradient)
  const shell = [
    // y relative, half-widths per row
    [4, 8],
    [5, 12],
    [6, 14],
    [7, 16],
    [8, 17],
    [9, 18],
    [10, 18],
    [11, 19],
    [12, 19],
    [13, 19],
    [14, 19],
    [15, 18],
    [16, 18],
    [17, 17],
    [18, 16],
    [19, 15],
    [20, 13],
    [21, 11],
    [22, 9],
    [23, 6],
  ];
  for (const [yy, half] of shell) {
    const y = yy + bob;
    for (let dx = -half; dx <= half; dx++) {
      const x = 24 + dx;
      const edge = Math.abs(dx) >= half - 1 || yy === 4 || yy === 23;
      const ridge = yy === 10 || yy === 16;
      let col = M;
      if (edge) col = O;
      else if (ridge) col = D;
      else if (yy < 9) col = L;
      else if (yy < 12) col = H;
      else if (yy > 19) col = D;
      put(c, x, y, col);
    }
  }
  // Center armor crest
  for (let y = 8; y <= 18; y++) {
    put(c, 24, y + bob, D);
    put(c, 23, y + bob, L);
    put(c, 25, y + bob, L);
  }
  // Eyes in sockets
  for (const ex of [17, 29]) {
    put(c, ex, 12 + bob, O);
    put(c, ex + 1, 12 + bob, O);
    put(c, ex + 2, 12 + bob, O);
    put(c, ex, 13 + bob, O);
    put(c, ex + 1, 13 + bob, e);
    put(c, ex + 2, 13 + bob, i);
    put(c, ex, 14 + bob, O);
    put(c, ex + 1, 14 + bob, O);
    put(c, ex + 2, 14 + bob, O);
  }
  // Mandibles
  for (let i2 = 0; i2 < 5; i2++) {
    put(c, 13 - i2, 18 + bob + Math.floor(i2 / 2), i2 === 0 ? O : D);
    put(c, 12 - i2, 19 + bob + Math.floor(i2 / 2), M);
    put(c, 34 + i2, 18 + bob + Math.floor(i2 / 2), i2 === 0 ? O : D);
    put(c, 35 + i2, 19 + bob + Math.floor(i2 / 2), M);
  }
  // Legs (6)
  for (const lx of [12, 16, 20, 28, 32, 36]) {
    put(c, lx, 24 + bob, O);
    put(c, lx, 25 + bob, D);
    put(c, lx, 26 + bob, t);
    put(c, lx, 27 + bob, G);
    put(c, lx + (lx < 24 ? -1 : 1), 28 + bob, g);
  }
  // Thorn crown
  const spikes = [
    [16, 3],
    [20, 2],
    [24, 1],
    [28, 2],
    [32, 3],
  ];
  for (const [sx, sy] of spikes) {
    put(c, sx, sy + bob, O);
    put(c, sx, sy + 1 + bob, rage ? R : t);
    put(c, sx, sy + 2 + bob, G);
    put(c, sx, sy + 3 + bob, g);
  }
  if (rage) {
    put(c, 18, 9 + bob, R);
    put(c, 30, 9 + bob, R);
    put(c, 24, 8 + bob, R);
  }
  return c;
}

/** Neon Overlord — dense purple body + speech crown */
function bossNeon(f) {
  const flap = f % 2;
  const rage = f === 2;
  const O = out;
  const D = hex('#311b92');
  const M = hex('#7e57c2');
  const L = hex('#d1c4e9');
  const Y = hex('#fff59d');
  const y = hex('#f9a825');
  const e = hex('#18ffff');
  const i = hex('#ffffff');
  const P = hex('#ff4081');
  const W = hex('#b39ddb');
  const c = canvas(48, 40);

  // Speech bubble crown
  for (let yy = 1; yy <= 10; yy++) {
    for (let xx = 8; xx <= 39; xx++) {
      const edge = yy === 1 || yy === 10 || xx === 8 || xx === 39;
      put(c, xx, yy, edge ? y : Y);
    }
  }
  // Bubble tail
  put(c, 22, 11, y);
  put(c, 21, 12, y);
  put(c, 20, 13, y);
  // !! pixels
  for (const bx of [16, 20]) {
    put(c, bx, 3, D);
    put(c, bx, 4, D);
    put(c, bx, 5, D);
    put(c, bx, 6, D);
    put(c, bx, 8, D);
  }
  put(c, 28, 3, P);
  put(c, 29, 4, P);
  put(c, 30, 5, P);
  put(c, 31, 6, P);
  put(c, 28, 8, P);

  // Body (solid stepped oval)
  for (let yy = 14; yy <= 30; yy++) {
    const half = yy < 17 ? 8 + (yy - 14) : yy > 26 ? 10 - (yy - 26) : 11;
    for (let dx = -half; dx <= half; dx++) {
      const x = 24 + dx;
      const edge = Math.abs(dx) >= half - 1 || yy === 14 || yy === 30;
      let col = M;
      if (edge) col = O;
      else if (yy < 18) col = L;
      else if (yy > 26) col = D;
      put(c, x, yy, col);
    }
  }
  // Eyes
  for (const ex of [18, 28]) {
    put(c, ex, 19, O);
    put(c, ex + 1, 19, e);
    put(c, ex + 2, 19, i);
    put(c, ex, 20, O);
    put(c, ex + 1, 20, e);
    put(c, ex + 2, 20, O);
  }
  // Wings
  const wy = 15 + flap;
  for (let i2 = 0; i2 < 11; i2++) {
    put(c, 5 + i2, wy, O);
    put(c, 6 + i2, wy + 1, W);
    put(c, 6 + i2, wy + 2, L);
    put(c, 42 - i2, wy, O);
    put(c, 41 - i2, wy + 1, W);
    put(c, 41 - i2, wy + 2, L);
  }
  // Legs
  put(c, 18, 31, O);
  put(c, 18, 32, D);
  put(c, 29, 31, O);
  put(c, 29, 32, D);
  if (rage) {
    put(c, 17, 17, P);
    put(c, 18, 18, P);
    put(c, 30, 17, P);
    put(c, 29, 18, P);
  }
  return c;
}

/** Porchlight Tyrant — final boss, 64×48, lamp heart, 3 phases */
function bossTyrant(f) {
  const wingDrop = f === 0 ? 0 : f === 1 ? 1 : 2;
  const rage = f === 2;
  const pal = {
    O: out,
    D: hex('#0d1448'),
    M: hex('#1a237e'),
    L: hex('#5c6bc0'),
    H: hex('#9fa8da'),
    W: hex('#151b54'),
    w: hex('#3949ab'),
    s: hex('#283593'),
    G: hex('#fff176'),
    g: hex('#ffca28'),
    e: rage ? hex('#ff5252') : hex('#18ffff'),
    i: hex('#ffffff'),
    R: hex('#ff5252'),
    a: hex('#ff8a80'),
  };
  const rows = [
    '................................................................',
    '..............WWWWWW..................WWWWWW....................',
    '..........WWWWWwwwWWW..............WWWwwwWWWWW..................',
    '........WWWwwwssswwwWWW..........WWWwwwssswwwWWW................',
    '......WWWwwsssssssswwWWW........WWWwwsssssssswwWWW..............',
    '.....WWwwssHHHHHHssswwWW........WWwwssHHHHHHssswwWW.............',
    '....WWwssHHLLLLLLHHsswWW........WWwssHHLLLLLLHHsswWW............',
    '....WWssHHLLLLLLLLHHssWW........WWssHHLLLLLLLLHHssWW............',
    '....WWssHLLLLLLLLLLHssWW........WWssHLLLLLLLLLLHssWW............',
    '.....WWssHLLLLLLLLHssWW..........WWssHLLLLLLLLHssWW.............',
    '......WWwwssHHHHHHsswwWW..........WWwwssHHHHHHsswwWW............',
    '.......WWWwwsssssswwwWW............WWWwwsssssswwwWW.............',
    '..........WWWWWWWWWW..................WWWWWWWWWW................',
    '...............OOOOOOOOOOOOOOOOOOOOOO...........................',
    '.............OODDDMMMMMMMMMMMMMMDDDOO...........................',
    '...........OODDMMMMHHHHHHHHHHMMMMDDOO...........................',
    '..........ODDMMHHHLLLLLLLLLLHHHMMDDO............................',
    '.........ODDMMHLLLLeiii..iiieLLLHMMDDO..........................',
    '........ODDMMHLLLLeiiii..iiiiieLLLHMMDDO........................',
    '........ODDMMHLLLLeiiii..iiiiieLLLHMMDDO........................',
    '........ODDMMHLLLLLLeii..iieLLLLLHMMDDO.........................',
    '........ODDMMHHLLLLLLLL..LLLLLLLHHMMDDO.........................',
    '........ODDMMMHHLLLLLL....LLLLLHHMMMDDO.........................',
    '........ODDMMMMHHHLL........LLHHHMMMDDO.........................',
    '........ODDMMMMMHH....OgggO....HHMMMMDDO........................',
    '........ODDMMMMMMH...OgGGGgO...HMMMMMDDO........................',
    '........ODDMMMMMMH...OgGiGgO...HMMMMMDDO........................',
    '........ODDMMMMMMH...OgGGGgO...HMMMMMDDO........................',
    '........ODDMMMMMMH....OgggO....HMMMMMDDO........................',
    '........ODDMMMMMMHH..........HHMMMMMDDO.........................',
    '.........ODDMMMMMMHHHHHHHHHHHHMMMMMDDO..........................',
    '..........ODDMMMMMMMMMMMMMMMMMMMMDDO............................',
    '...........OODDMMMMMMMMMMMMMMMMDDOO.............................',
    '.............OODDDMMMMMMMMMMDDDOO...............................',
    '...............OOOOOOOOOOOOOOOO.................................',
    '.................O..........O...................................',
    '................OO..........OO..................................',
    '...............ODD..........DDO.................................',
    '..............ODMM..........MMDO................................',
    '.............ODMM............MMDO...............................',
    '............ODDM..............MDDO..............................',
    '...........O.O..................O.O.............................',
    '................................................................',
    '................................................................',
    '................................................................',
    '................................................................',
    '................................................................',
    '................................................................',
  ];
  const c = fromMap(
    rows.map((r) => r.padEnd(64, '.').slice(0, 64)).slice(0, 48),
    pal,
  );
  // Wing flutter offset
  if (wingDrop > 0) {
    for (let i = 0; i < 14; i++) {
      put(c, 3 + i, 13 + wingDrop + (i % 2), pal.W);
      put(c, 60 - i, 13 + wingDrop + (i % 2), pal.W);
      put(c, 4 + i, 14 + wingDrop, pal.w);
      put(c, 59 - i, 14 + wingDrop, pal.s);
    }
  }
  if (rage) {
    put(c, 22, 16, pal.R);
    put(c, 23, 17, pal.a);
    put(c, 40, 16, pal.R);
    put(c, 39, 17, pal.a);
    put(c, 31, 25, pal.i);
    put(c, 32, 25, pal.i);
    put(c, 31, 26, pal.G);
    put(c, 32, 26, pal.G);
  }
  return c;
}

function bossFrame(f) {
  // legacy alias → tyrant
  return bossTyrant(f);
}

// ═══════════════════════════════════════════════════════════
// PROJECTILES / FX / UI — crisp hand pixels
// ═══════════════════════════════════════════════════════════
function bulletPlayer() {
  return fromMap(
    [
      '..............',
      '..bbb.........',
      'bbbcciiiicbbb.',
      'bbbcccciicbbb.',
      'bbbcciiiicbbb.',
      '..bbb.........',
      '..............',
    ],
    {
      b: hex('#0288d1'),
      c: hex('#4dd0e1'),
      i: hex('#e0ffff'),
    },
  );
}

function bulletPierce() {
  return fromMap(
    [
      '................',
      '..pp............',
      'pppiiippiipp....',
      'pppiiiiiiiipp...',
      'pppiiippiipp....',
      '..pp............',
      '................',
    ],
    {
      p: hex('#9c27b0'),
      i: hex('#f3e5f5'),
    },
  );
}

function bulletEnemy() {
  return fromMap(
    [
      '.........',
      '...rrr...',
      '..rriir..',
      '.rriiiir.',
      '..rriir..',
      '...rrr...',
      '.........',
      '.........',
      '.........',
    ],
    {
      r: hex('#ff5252'),
      i: hex('#ffebee'),
    },
  );
}

function bulletHeckler() {
  return fromMap(
    [
      '................',
      '.YYYYYYYYYYYYY..',
      '.YyyyyyyyyyyyY..',
      '.Yy..ii..ii..Y..',
      '.Yy..........Y..',
      '.Yy..iiiiii..Y..',
      '.YyyyyyyyyyyyY..',
      '.YYYYYYYYYYYYY..',
      '..Y.............',
      '.Y..............',
      'Y...............',
      '................',
    ],
    {
      Y: hex('#f9a825'),
      y: hex('#fff59d'),
      i: hex('#1a1440'),
    },
  );
}

function glowOrb() {
  return fromMap(
    [
      '................',
      '......OOOO......',
      '....OOggggOO....',
      '...OgGGGGGGgO...',
      '..OgGGiiiiGGgO..',
      '..OgGii..iiGgO..',
      '.OgGGi....iGGgO.',
      '.OgGGi....iGGgO.',
      '..OgGii..iiGgO..',
      '..OgGGiiiiGGgO..',
      '...OgGGGGGGgO...',
      '....OOggggOO....',
      '......OOOO......',
      '................',
      '................',
      '................',
    ],
    {
      O: hex('#e65100'),
      g: hex('#ffca28'),
      G: hex('#fff176'),
      i: hex('#fffde7'),
    },
  );
}

function boom(f) {
  // expanding star burst — discrete rings
  const sizes = [3, 5, 7, 9, 11];
  const r = sizes[f] ?? 11;
  const cols = [
    { core: hex('#ffffff'), mid: hex('#fff59d'), edge: hex('#ffca28') },
    { core: hex('#fff59d'), mid: hex('#ffca28'), edge: hex('#ff8f00') },
    { core: hex('#ffca28'), mid: hex('#ff8f00'), edge: hex('#ff6e40') },
    { core: hex('#ff8f00'), mid: hex('#ff6e40'), edge: hex('#5d4037') },
    { core: hex('#ff6e40'), mid: hex('#5d4037'), edge: hex('#3e2723') },
  ][f];
  const c = canvas(28, 28);
  const cx = 13;
  const cy = 13;
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      // diamond / cross NES explosion (not soft circle)
      const d = dx + dy;
      const d2 = Math.max(dx, dy);
      if (d === r || (d2 === r && d <= r + 2)) put(c, x, y, cols.edge);
      else if (d < r && d > r - 3) put(c, x, y, cols.mid);
      else if (d <= Math.max(1, r - 3) && d2 <= Math.max(1, r - 2)) put(c, x, y, cols.core);
      // cross spikes
      if (f < 4 && ((dx === 0 && dy <= r + 1) || (dy === 0 && dx <= r + 1))) {
        if (dx + dy === r + 1) put(c, x, y, cols.edge);
      }
    }
  }
  return c;
}

function power(kind) {
  const map = {
    spread: { O: hex('#01579b'), M: hex('#4fc3f7'), L: hex('#e1f5fe') },
    rapid: { O: hex('#bf360c'), M: hex('#ff7043'), L: hex('#fbe9e7') },
    shield: { O: hex('#1b5e20'), M: hex('#69f0ae'), L: hex('#e8f5e9') },
    companion: { O: hex('#f9a825'), M: hex('#ffee58'), L: hex('#fffde7') },
    lampRefill: { O: hex('#ff8f00'), M: hex('#fff59d'), L: hex('#fffde7') },
    pierce: { O: hex('#6a1b9a'), M: hex('#ea80fc'), L: hex('#f3e5f5') },
  };
  const p = map[kind];
  // diamond power-up gem
  return fromMap(
    [
      '................',
      '.......OO.......',
      '......OMMO......',
      '.....OMLLMO.....',
      '....OMLLLLMO....',
      '...OMLLiiLLMO...',
      '..OMLLiiiiLLMO..',
      '.OMLLiiiiiiLLMO.',
      '..OMLLiiiiLLMO..',
      '...OMLLiiLLMO...',
      '....OMLLLLMO....',
      '.....OMLLMO.....',
      '......OMMO......',
      '.......OO.......',
      '................',
      '................',
    ],
    {
      O: p.O,
      M: p.M,
      L: p.L,
      i: hex('#ffffff'),
    },
  );
}

function spark() {
  return fromMap(
    [
      '..i..',
      '.ili.',
      'ilili',
      '.ili.',
      '..y..',
    ],
    {
      i: hex('#ffffff'),
      l: hex('#ffecb3'),
      y: hex('#ff6e40'),
    },
  );
}

function heart() {
  return fromMap(
    [
      '..........',
      '.rr..rr...',
      'rrrrrrrr..',
      'rriiiirr..',
      'rriiiirr..',
      '.rrrrrr...',
      '..rrrr....',
      '...rr.....',
      '....r.....',
      '..........',
    ],
    {
      r: hex('#ff5252'),
      i: hex('#ff8a80'),
    },
  );
}

function web() {
  return fromMap(
    [
      'w..............w............',
      '.w............w.............',
      '..w..........w..............',
      '...w........w...............',
      '....w......w................',
      '.....w....w.................',
      '......w..w..................',
      '.......ww...................',
      'wwwwwwwwwwwwwwwwwwwwwwwwwwww',
      '.......ww...................',
      '......w..w..................',
      '.....w....w.................',
      '....w......w................',
      '...w........w...............',
      '..w..........w..............',
      '.w............w.............',
      'w..............w............',
      '......w..w..................',
      '.....w....w.................',
      '....w......w................',
    ],
    { w: hex('#eceff1') },
  );
}

// ═══════════════════════════════════════════════════════════
// ENV TILES — intentional NES backgrounds (tileable, crisp)
// ═══════════════════════════════════════════════════════════
function stars() {
  const c = canvas(128, 128);
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      // subtle vertical band dither
      const band = Math.floor(y / 32);
      const base = band === 0 ? hex('#080414') : band === 1 ? hex('#0a0618') : band === 2 ? hex('#0c0820') : hex('#100a24');
      put(c, x, y, base);
    }
  }
  // hand-placed star field (deterministic)
  const pts = [
    [8, 6, 1],
    [22, 14, 0],
    [40, 4, 1],
    [55, 20, 0],
    [70, 9, 1],
    [88, 18, 0],
    [100, 5, 1],
    [115, 22, 0],
    [12, 40, 0],
    [30, 48, 1],
    [48, 36, 0],
    [66, 50, 1],
    [84, 42, 0],
    [102, 55, 1],
    [120, 38, 0],
    [6, 70, 1],
    [24, 78, 0],
    [42, 66, 1],
    [60, 80, 0],
    [78, 72, 1],
    [96, 85, 0],
    [114, 68, 1],
    [16, 100, 0],
    [34, 110, 1],
    [52, 98, 0],
    [70, 112, 1],
    [88, 104, 0],
    [106, 118, 1],
    [18, 28, 0],
    [75, 30, 1],
    [95, 12, 0],
    [50, 90, 1],
  ];
  for (const [x, y, bright] of pts) {
    if (bright) {
      put(c, x, y, P.star);
      put(c, x + 1, y, P.starD);
      put(c, x, y + 1, P.starD);
      put(c, x - 1, y, P.starD);
      put(c, x, y - 1, P.starD);
    } else {
      put(c, x, y, P.starD);
    }
  }
  return c;
}

function moon() {
  return fromMap(
    [
      '........................................',
      '.............OOOOOOOO...................',
      '..........OOOMMMMMMMMOOO................',
      '........OOMMMLLLLLLLLMMMOO..............',
      '......OOMMMLLLiiiiiiLLLMMMOO............',
      '.....OMMMLLLiiiiiiiiiiLLLMMO............',
      '....OMMLLLiiii......iiiiLLMMO...........',
      '...OMMLLiiiii........iiiiiLMMO..........',
      '...OMMLLiiii..........iiiiLMMO..........',
      '..OMMLLiiii............iiiiLMMO.........',
      '..OMMLLiii..............iiiLMMO.........',
      '..OMMLLiii.....ss.......iiiLMMO.........',
      '..OMMLLiii....ssss......iiiLMMO.........',
      '..OMMLLiii.....ss.......iiiLMMO.........',
      '..OMMLLiii..............iiiLMMO.........',
      '..OMMLLiiii............iiiiLMMO.........',
      '...OMMLLiiii..........iiiiLMMO..........',
      '...OMMLLiiiii........iiiiiLMMO..........',
      '....OMMLLLiiii......iiiiLLMMO...........',
      '.....OMMMLLLiiiiiiiiiiLLLMMO............',
      '......OOMMMLLLiiiiiiLLLMMMOO............',
      '........OOMMMLLLLLLLLMMMOO..............',
      '..........OOOMMMMMMMMOOO................',
      '.............OOOOOOOO...................',
      '........................................',
      // crescent cut on right via dark pixels
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
      '........................................',
    ],
    {
      O: hex('#6ec6ff'),
      M: hex('#b3e5fc'),
      L: hex('#e1f5fe'),
      i: hex('#f0fbff'),
      s: hex('#90caf9'),
    },
  );
}

function hills() {
  // stepped NES hills silhouette
  const c = canvas(80, 28);
  const profile = [];
  for (let x = 0; x < 80; x++) {
    // piecewise peaks
    let h = 8;
    if (x < 20) h = 10 + Math.floor((x / 20) * 8);
    else if (x < 35) h = 18 - Math.floor(((x - 20) / 15) * 6);
    else if (x < 55) h = 12 + Math.floor(((x - 35) / 20) * 10);
    else if (x < 70) h = 22 - Math.floor(((x - 55) / 15) * 10);
    else h = 12 + Math.floor(((x - 70) / 10) * 4);
    profile[x] = Math.max(6, Math.min(24, h));
  }
  for (let x = 0; x < 80; x++) {
    const top = 28 - profile[x];
    for (let y = top; y < 28; y++) {
      if (y === top) put(c, x, y, P.hillL);
      else if (y === top + 1) put(c, x, y, P.hillM);
      else put(c, x, y, P.hillD);
    }
  }
  return c;
}

function city() {
  const c = canvas(96, 48);
  const buildings = [
    { x: 0, w: 10, h: 20, win: 0 },
    { x: 10, w: 12, h: 32, win: 1 },
    { x: 22, w: 8, h: 18, win: 0 },
    { x: 30, w: 14, h: 40, win: 1 },
    { x: 44, w: 10, h: 24, win: 0 },
    { x: 54, w: 16, h: 36, win: 1 },
    { x: 70, w: 9, h: 22, win: 0 },
    { x: 79, w: 17, h: 30, win: 1 },
  ];
  for (const b of buildings) {
    const top = 48 - b.h;
    for (let y = top; y < 48; y++) {
      for (let x = b.x; x < b.x + b.w; x++) {
        put(c, x, y, hex('#120c28'));
        if (y === top) put(c, x, y, hex('#1a1440'));
      }
    }
    // windows grid
    for (let wy = top + 3; wy < 46; wy += 5) {
      for (let wx = b.x + 2; wx < b.x + b.w - 2; wx += 3) {
        const lit = (wx + wy + b.x) % 5 !== 0;
        if (lit) {
          put(c, wx, wy, b.win ? hex('#ff4081') : hex('#18ffff'));
          put(c, wx, wy + 1, b.win ? hex('#f48fb1') : hex('#84ffff'));
        } else {
          put(c, wx, wy, hex('#0a0618'));
        }
      }
    }
  }
  return c;
}

function fence() {
  const c = canvas(48, 24);
  const col = hex('#4e342e');
  const l = hex('#6d4c41');
  const d = hex('#2c1810');
  // rails
  for (let x = 0; x < 48; x++) {
    put(c, x, 8, d);
    put(c, x, 9, l);
    put(c, x, 10, col);
    put(c, x, 16, d);
    put(c, x, 17, l);
    put(c, x, 18, col);
  }
  // posts with pointed tops
  for (let i = 0; i < 6; i++) {
    const x = 2 + i * 8;
    put(c, x + 1, 1, l);
    put(c, x + 2, 0, l);
    put(c, x + 1, 2, col);
    for (let y = 2; y < 22; y++) {
      put(c, x, y, d);
      put(c, x + 1, y, col);
      put(c, x + 2, y, l);
      put(c, x + 3, y, col);
    }
  }
  return c;
}

function neon() {
  return fromMap(
    [
      '................................',
      '.PPPPPPPPPPPPPPPPPPPPPPPPPPPPPP.',
      '.P............................P.',
      '.P..uuuuuuuu....cccccccccc....P.',
      '.P..u......u....c........c....P.',
      '.P..u......u....c........c....P.',
      '.P..uuuuuuuu....cccccccccc....P.',
      '.P............................P.',
      '.P......PPPPPPPPPPPP..........P.',
      '.P......P..........P..........P.',
      '.P......PPPPPPPPPPPP..........P.',
      '.P............................P.',
      '.CCCCCCCCCCCCCCCCCCCCCCCCCCCCCC.',
      '................................',
      '................................',
      '................................',
    ],
    {
      P: hex('#ff4081'),
      C: hex('#18ffff'),
      u: hex('#b388ff'),
      c: hex('#18ffff'),
    },
  );
}

function grass() {
  const c = canvas(32, 14);
  const d = hex('#0d3b12');
  const m = hex('#1b5e20');
  const l = hex('#2e7d32');
  for (let x = 0; x < 32; x++) {
    put(c, x, 10, d);
    put(c, x, 11, m);
    put(c, x, 12, l);
    put(c, x, 13, m);
  }
  // blade pattern
  const blades = [5, 7, 6, 8, 5, 9, 6, 7, 5, 8, 6, 9, 5, 7, 8, 6];
  for (let x = 0; x < 32; x++) {
    const h = blades[x % blades.length];
    for (let y = h; y < 10; y++) {
      put(c, x, y, y === h ? l : m);
    }
  }
  return c;
}

function porchLamp() {
  return fromMap(
    [
      '............................',
      '.............mm.............',
      '..........mmmmmmmm..........',
      '.........mMMMMMMMMm.........',
      '........mM........Mm........',
      '.......mM..ggGGgg..Mm.......',
      '.......mM.gGGiiGGg.Mm.......',
      '.......mM.gGiiiiGg.Mm.......',
      '.......mM.gGiiiiGg.Mm.......',
      '.......mM.gGGiiGGg.Mm.......',
      '.......mM..ggGGgg..Mm.......',
      '........mM........Mm........',
      '.........mMMMMMMMMm.........',
      '..........mmmmmmmm..........',
      '............mmmm............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '............wWWw............',
      '..........wwWWWwww..........',
      '.........wWWWWWWWWw.........',
      '........wWWWWWWWWWWw........',
      '............................',
      '............................',
    ],
    {
      m: hex('#546e7a'),
      M: hex('#90a4ae'),
      g: hex('#ffca28'),
      G: hex('#fff176'),
      i: hex('#ffffff'),
      w: hex('#3e2723'),
      W: hex('#6d4c41'),
    },
  );
}

function clouds() {
  // blocky NES clouds
  const c = canvas(96, 40);
  const blobs = [
    { x: 8, y: 10, w: 22, h: 10 },
    { x: 28, y: 6, w: 18, h: 12 },
    { x: 50, y: 14, w: 24, h: 10 },
    { x: 70, y: 8, w: 20, h: 11 },
  ];
  for (const b of blobs) {
    for (let y = 0; y < b.h; y++) {
      for (let x = 0; x < b.w; x++) {
        // rounded rect via manhattan
        const edge =
          (x === 0 || x === b.w - 1) && (y < 2 || y > b.h - 3)
            ? true
            : (y === 0 || y === b.h - 1) && (x < 2 || x > b.w - 3);
        if (edge) continue;
        const col = y < 2 ? P.hillL : y < b.h - 3 ? P.hillM : P.hillD;
        put(c, b.x + x, b.y + y, col);
      }
    }
  }
  return c;
}

function treesFar() {
  const c = canvas(64, 48);
  const trunk = hex('#3e2723');
  const leaf = hex('#1b5e20');
  const leafL = hex('#2e7d32');
  const leafD = hex('#0d3b12');
  for (let i = 0; i < 4; i++) {
    const bx = 6 + i * 15;
    // trunk
    for (let y = 30; y < 48; y++) {
      put(c, bx + 2, y, trunk);
      put(c, bx + 3, y, trunk);
    }
    // triangular canopy layers (NES pine / bush)
    for (let layer = 0; layer < 3; layer++) {
      const top = 8 + layer * 8;
      const half = 8 - layer;
      for (let y = 0; y < 10; y++) {
        const span = Math.floor((y / 10) * half) + 1;
        for (let x = -span; x <= span; x++) {
          const col = x < -span + 1 ? leafD : x > span - 1 ? leaf : y < 3 ? leafL : leaf;
          put(c, bx + 2 + x, top + y, col);
        }
      }
    }
  }
  return c;
}

function treesNear() {
  const c = canvas(48, 40);
  const trunk = hex('#4e342e');
  const leaf = hex('#2e7d32');
  const leafL = hex('#43a047');
  const leafD = hex('#1b5e20');
  for (let i = 0; i < 2; i++) {
    const bx = 8 + i * 22;
    for (let y = 24; y < 40; y++) {
      put(c, bx + 1, y, out);
      put(c, bx + 2, y, trunk);
      put(c, bx + 3, y, trunk);
      put(c, bx + 4, y, out);
    }
    for (let layer = 0; layer < 3; layer++) {
      const top = 2 + layer * 8;
      const half = 9 - layer;
      for (let y = 0; y < 10; y++) {
        const span = Math.floor((y / 10) * half) + 2;
        for (let x = -span; x <= span; x++) {
          if (Math.abs(x) === span) put(c, bx + 2 + x, top + y, out);
          else {
            const col = x < 0 ? leafD : y < 2 ? leafL : leaf;
            put(c, bx + 2 + x, top + y, col);
          }
        }
      }
    }
  }
  return c;
}

function bricks() {
  const c = canvas(48, 36);
  const brick = hex('#4e342e');
  const brickL = hex('#6d4c41');
  const mortar = hex('#2c1810');
  const glow = hex('#ff4081');
  for (let y = 0; y < 36; y++) {
    for (let x = 0; x < 48; x++) {
      const row = Math.floor(y / 6);
      const offset = row % 2 === 0 ? 0 : 6;
      const bx = Math.floor((x + offset) / 12);
      const localX = (x + offset) % 12;
      const localY = y % 6;
      if (localX === 0 || localY === 0) put(c, x, y, mortar);
      else put(c, x, y, localX < 3 || localY < 2 ? brickL : brick);
      if (localX >= 3 && localX <= 5 && localY >= 2 && localY <= 4 && (bx + row) % 5 === 0) {
        put(c, x, y, glow);
      }
    }
  }
  return c;
}

function porchRail() {
  const c = canvas(48, 24);
  const wood = hex('#5d4037');
  const woodL = hex('#8d6e63');
  const d = hex('#2c1810');
  for (let x = 0; x < 48; x++) {
    put(c, x, 4, d);
    put(c, x, 5, woodL);
    put(c, x, 6, wood);
  }
  for (let i = 0; i < 8; i++) {
    const x = 2 + i * 6;
    for (let y = 6; y < 22; y++) {
      put(c, x, y, d);
      put(c, x + 1, y, wood);
      put(c, x + 2, y, woodL);
    }
  }
  for (let x = 0; x < 48; x++) {
    put(c, x, 20, d);
    put(c, x, 21, wood);
    put(c, x, 22, woodL);
    put(c, x, 23, wood);
  }
  return c;
}

function groundDetail() {
  const c = canvas(32, 8);
  const d = hex('#0d3b12');
  const m = hex('#1b5e20');
  const stone = hex('#5d4037');
  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 8; y++) put(c, x, y, y % 2 === 0 ? d : m);
    if (x % 7 === 3) put(c, x, 2, stone);
    if (x % 11 === 5) put(c, x, 4, stone);
  }
  return c;
}

/** Pixel logo banner for title screen */
function titleLogo() {
  // 192×48 "MOTH//LAMP" — full double-slash, NES block type
  const W = 192;
  const H = 48;
  const c = canvas(W, H);
  const ink = hex('#fff176');
  const glow = hex('#ffca28');
  const dark = hex('#e65100');
  const letters = {
    M: ['#   #', '## ##', '# # #', '#   #', '#   #'],
    O: [' ### ', '#   #', '#   #', '#   #', ' ### '],
    T: ['#####', '  #  ', '  #  ', '  #  ', '  #  '],
    H: ['#   #', '#   #', '#####', '#   #', '#   #'],
    L: ['#    ', '#    ', '#    ', '#    ', '#####'],
    A: [' ### ', '#   #', '#####', '#   #', '#   #'],
    P: ['#### ', '#   #', '#### ', '#    ', '#    '],
    I: [' ### ', '  #  ', '  #  ', '  #  ', ' ### '],
    G: [' ### ', '#   #', '# ###', '#   #', ' ### '],
    '/': ['    #', '   # ', '  #  ', ' #   ', '#    '],
  };
  // MOTH//LAMP — 10 glyphs
  const text = 'MOTH//LAMP';
  const scale = 3;
  const advance = 5 * scale + 1; // 16 — fit full word
  const totalW = text.length * advance - 1;
  let cx = Math.max(2, Math.floor((W - totalW) / 2));
  for (const ch of text) {
    const glyph = letters[ch];
    if (!glyph) {
      cx += advance;
      continue;
    }
    for (let gy = 0; gy < 5; gy++) {
      for (let gx = 0; gx < 5; gx++) {
        if (glyph[gy][gx] !== '#') continue;
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px = cx + gx * scale + sx;
            const py = 12 + gy * scale + sy;
            put(c, px, py, sy === 0 ? ink : sy === scale - 1 ? dark : glow);
            for (const [ox, oy] of [
              [-1, 0],
              [1, 0],
              [0, -1],
              [0, 1],
            ]) {
              const qx = px + ox;
              const qy = py + oy;
              if (qx >= 0 && qy >= 0 && qx < W && qy < H) {
                const i = (qy * W + qx) * 4;
                if (c.data[i + 3] === 0) put(c, qx, qy, out);
              }
            }
          }
        }
      }
    }
    cx += advance;
  }
  return c;
}

// ── Generate all ────────────────────────────────────────────
console.log('Generating NES / SNES sprite sheets →', OUT);

save('moth_0', mothFrame(moth0));
save('moth_1', mothFrame(moth1));
save('moth_2', mothFrame(moth2));
save('moth_3', mothFrame(moth3));
save('moth_dash', mothDash());
save('moth_hurt', mothHurt());

for (const e of Object.keys(ENEMY_FN)) {
  for (let f = 0; f < 2; f++) save(`enemy_${e}_${f}`, ENEMY_FN[e](f));
}

// Stage bosses (3 zones × 3 frames) + legacy boss_N → tyrant
for (let f = 0; f < 3; f++) {
  save(`boss_briar_${f}`, bossBriar(f));
  save(`boss_neon_${f}`, bossNeon(f));
  save(`boss_tyrant_${f}`, bossTyrant(f));
  save(`boss_${f}`, bossTyrant(f));
}
for (let f = 0; f < 5; f++) save(`boom_${f}`, boom(f));

save('bullet_player', bulletPlayer());
save('bullet_pierce', bulletPierce());
save('bullet_enemy', bulletEnemy());
save('bullet_heckler', bulletHeckler());
save('glow_orb', glowOrb());
save('spark', spark());
save('heart', heart());
save('web', web());
save('stars', stars());
save('moon', moon());
save('hills', hills());
save('city_sil', city());
save('fence', fence());
save('neon_sign', neon());
save('grass', grass());
save('porch_lamp', porchLamp());
save('clouds', clouds());
save('trees_far', treesFar());
save('trees_near', treesNear());
save('bricks', bricks());
save('porch_rail', porchRail());
save('ground_detail', groundDetail());
save('title_logo', titleLogo());

for (const k of ['spread', 'rapid', 'shield', 'companion', 'lampRefill', 'pierce']) {
  save(`power_${k}`, power(k));
}

const pw = canvas(2, 2);
put(pw, 0, 0, hex('#ffffff'));
put(pw, 1, 0, hex('#ffffff'));
put(pw, 0, 1, hex('#ffffff'));
put(pw, 1, 1, hex('#ffffff'));
save('pixel_white', pw);

const manifest = fs.readdirSync(OUT).filter((f) => f.endsWith('.png'));
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ sprites: manifest }, null, 2));
console.log(`Done — ${manifest.length} sprite PNGs (hand-authored NES style)`);
