import Phaser from 'phaser';
import { PALETTE } from '../data/palette';
import type { EnemyKind } from '../data/enemies';

/**
 * Fallback runtime pixel art when PNG sheets are missing.
 * Production path: BootScene loads /assets/sprites/*.png first.
 */
export class SpriteFactory {
  /** Prefer preloaded PNG sheets; only generate missing keys. */
  static generateMissing(scene: Phaser.Scene): void {
    const need = (key: string) => !scene.textures.exists(key);

    if (!need('moth_0') && !need('boss_0') && !need('stars')) {
      return;
    }

    if (need('moth_0')) this.moth(scene);
    if (need('bullet_player')) this.playerBullet(scene);
    if (need('bullet_enemy')) this.enemyBullet(scene);
    if (need('glow_orb')) this.glowOrb(scene);
    if (need('boom_0')) this.explosion(scene);
    if (need('web')) this.webHazard(scene);
    if (need('power_spread')) this.powerups(scene);
    if (need('enemy_gnat_0')) this.enemies(scene);
    if (need('boss_0')) this.boss(scene);
    if (need('spark')) this.particles(scene);
    if (need('stars')) this.bgTiles(scene);
    if (need('porch_lamp')) this.lamp(scene);
    if (need('heart')) this.ui(scene);
  }

  static generateAll(scene: Phaser.Scene): void {
    this.moth(scene);
    this.playerBullet(scene);
    this.enemyBullet(scene);
    this.glowOrb(scene);
    this.explosion(scene);
    this.webHazard(scene);
    this.powerups(scene);
    this.enemies(scene);
    this.boss(scene);
    this.particles(scene);
    this.bgTiles(scene);
    this.lamp(scene);
    this.ui(scene);
  }

  private static tex(
    scene: Phaser.Scene,
    key: string,
    w: number,
    h: number,
    draw: (ctx: CanvasRenderingContext2D, put: (x: number, y: number, c: string) => void) => void,
  ): void {
    // Never overwrite preloaded PNG assets
    if (scene.textures.exists(key)) {
      try {
        const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
        if (src && 'width' in src && src.width > 2) return;
      } catch {
        // regenerate
      }
      scene.textures.remove(key);
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    const put = (x: number, y: number, c: string) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      ctx.fillStyle = c;
      ctx.fillRect(x | 0, y | 0, 1, 1);
    };
    draw(ctx, put);
    scene.textures.addCanvas(key, canvas);
    try {
      scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    } catch {
      // ignore
    }
  }

  private static H(n: number): string {
    return `#${n.toString(16).padStart(6, '0')}`;
  }

  // ─── MOTH (32×32, 4 frames) ─────────────────────────────────
  private static moth(scene: Phaser.Scene): void {
    const OUT = '#1a1028';
    const bodyD = this.H(PALETTE.mothBodyDark);
    const bodyM = this.H(PALETTE.mothBody);
    const bodyL = this.H(PALETTE.mothBodyLight);
    const wingD = this.H(PALETTE.mothWingDark);
    const wingM = this.H(PALETTE.mothWingMid);
    const wingL = this.H(PALETTE.mothWing);
    const wingH = this.H(PALETTE.mothWingTip);
    const eye = this.H(PALETTE.mothEye);
    const eyeW = '#ffffff';
    const blast = this.H(PALETTE.mothBlaster);
    const blastC = this.H(PALETTE.mothBlasterCore);
    const pat = this.H(PALETTE.mothPattern);
    const fur = '#c4a484';

    for (let frame = 0; frame < 4; frame++) {
      this.tex(scene, `moth_${frame}`, 32, 32, (_ctx, put) => {
        // Wing open: 0 closed-ish, 1 mid, 2 full, 3 mid
        const open = frame === 0 ? 1 : frame === 1 ? 3 : frame === 2 ? 4 : 2;
        const drop = frame === 1 || frame === 2 ? 0 : 1;

        // Helper: draw one wing (mirrored by sign)
        const wing = (sign: number) => {
          const rootX = sign < 0 ? 12 : 19;
          const rootY = 14 + drop;
          // Upper wing lobe
          for (let i = 0; i < 6 + open; i++) {
            const wx = rootX + sign * (2 + Math.min(i, 5));
            const wy = rootY - 2 - i + Math.floor(i / 3);
            put(wx, wy, OUT);
            put(wx - sign, wy, wingD);
            put(wx - sign * 2, wy + 1, wingM);
            put(wx - sign, wy + 1, wingL);
            if (i > 1 && i < 5 + open) put(wx - sign * 2, wy, wingH);
          }
          // Lower wing lobe
          for (let i = 0; i < 4 + Math.floor(open / 2); i++) {
            const wx = rootX + sign * (2 + Math.min(i, 3));
            const wy = rootY + 2 + i;
            put(wx, wy, OUT);
            put(wx - sign, wy, wingD);
            put(wx - sign * 2, wy, wingM);
            put(wx - sign, wy - 1, wingL);
          }
          // Eye-spot rings (classic moth pattern)
          const sx = rootX + sign * 4;
          const sy = rootY - 1;
          put(sx, sy, pat);
          put(sx + sign, sy, OUT);
          put(sx, sy + 1, OUT);
          put(sx, sy + 4, pat);
        };

        wing(-1);
        wing(1);

        // Abdomen / thorax with outline
        for (let y = 10; y <= 22; y++) {
          for (let x = 13; x <= 18; x++) {
            const edge = x === 13 || x === 18 || y === 10 || y === 22;
            const shade = x <= 14 ? bodyD : x >= 17 ? bodyL : bodyM;
            put(x, y, edge ? OUT : shade);
          }
        }
        // Soft fur highlight
        put(15, 12, bodyL);
        put(16, 12, bodyL);
        put(15, 13, fur);
        put(16, 18, bodyD);
        put(15, 19, bodyD);

        // Head
        put(13, 9, OUT);
        put(14, 8, OUT);
        put(15, 8, bodyM);
        put(16, 8, bodyL);
        put(17, 8, OUT);
        put(18, 9, OUT);
        put(14, 9, bodyM);
        put(15, 9, bodyL);
        put(16, 9, bodyL);
        put(17, 9, bodyM);

        // Glowing eyes (determined)
        put(14, 9, eye);
        put(17, 9, eye);
        put(14, 10, eyeW);
        put(17, 10, eyeW);

        // Antennae with clubs
        put(13, 7, OUT);
        put(12, 6, bodyD);
        put(11, 5, bodyL);
        put(10, 4, eye);
        put(18, 7, OUT);
        put(19, 6, bodyD);
        put(20, 5, bodyL);
        put(21, 4, eye);

        // Light blaster (side mount)
        put(18, 15, OUT);
        put(19, 15, blast);
        put(20, 15, blastC);
        put(21, 15, blast);
        put(22, 15, OUT);
        put(19, 14, blast);
        put(20, 14, blastC);
        put(19, 16, blast);
        put(20, 16, blast);

        // Tiny legs
        put(14, 23, OUT);
        put(17, 23, OUT);
      });
    }

    this.tex(scene, 'moth_dash', 32, 32, (_ctx, put) => {
      const c = this.H(PALETTE.neonCyan);
      const w = '#e0f7fa';
      for (let y = 10; y <= 22; y++) {
        put(14, y, c);
        put(15, y, w);
        put(16, y, w);
        put(17, y, c);
      }
      for (let i = 0; i < 8; i++) {
        put(4 + i, 15, c);
        put(4 + i, 16, w);
      }
      put(20, 15, c);
      put(21, 16, w);
      put(22, 15, c);
    });

    this.tex(scene, 'moth_hurt', 32, 32, (_ctx, put) => {
      const r = this.H(PALETTE.danger);
      for (let y = 10; y <= 22; y++) {
        put(14, y, r);
        put(15, y, '#ff8a80');
        put(16, y, r);
        put(17, y, r);
      }
      put(14, 9, '#fff');
      put(17, 9, '#fff');
      for (let i = 0; i < 5; i++) {
        put(8, 12 + i, '#ffab91');
        put(23, 12 + i, '#ffab91');
      }
    });
  }

  private static playerBullet(scene: Phaser.Scene): void {
    this.tex(scene, 'bullet_player', 14, 7, (_ctx, put) => {
      const c = this.H(PALETTE.bulletPlayer);
      const core = '#ffffff';
      const tip = this.H(PALETTE.neonCyan);
      const out = '#0d47a1';
      for (let x = 0; x < 12; x++) {
        put(x, 2, out);
        put(x, 3, c);
        put(x, 4, out);
      }
      for (let x = 2; x < 10; x++) {
        put(x, 1, c);
        put(x, 5, c);
        put(x, 3, core);
      }
      put(12, 2, tip);
      put(12, 3, tip);
      put(12, 4, tip);
      put(13, 3, tip);
    });

    this.tex(scene, 'bullet_pierce', 16, 7, (_ctx, put) => {
      const c = '#ea80fc';
      const core = '#f3e5f5';
      const out = '#6a1b9a';
      for (let x = 0; x < 16; x++) put(x, 3, c);
      for (let x = 2; x < 14; x++) {
        put(x, 2, c);
        put(x, 4, c);
      }
      for (let x = 4; x < 12; x++) put(x, 3, core);
      put(1, 1, out);
      put(1, 5, out);
      put(14, 1, out);
      put(14, 5, out);
    });
  }

  private static enemyBullet(scene: Phaser.Scene): void {
    this.tex(scene, 'bullet_enemy', 9, 9, (_ctx, put) => {
      const c = this.H(PALETTE.bulletEnemy);
      const core = '#ffebee';
      const out = '#b71c1c';
      const ring = [
        [3, 0],
        [4, 0],
        [5, 0],
        [2, 1],
        [6, 1],
        [1, 2],
        [7, 2],
        [0, 3],
        [8, 3],
        [0, 4],
        [8, 4],
        [0, 5],
        [8, 5],
        [1, 6],
        [7, 6],
        [2, 7],
        [6, 7],
        [3, 8],
        [4, 8],
        [5, 8],
      ];
      for (const [x, y] of ring) put(x, y, out);
      for (let y = 2; y <= 6; y++) for (let x = 2; x <= 6; x++) put(x, y, c);
      put(3, 3, core);
      put(4, 3, core);
      put(4, 4, core);
      put(5, 4, core);
    });

    this.tex(scene, 'bullet_heckler', 16, 12, (_ctx, put) => {
      const c = this.H(PALETTE.bulletHeckler);
      const ink = this.H(PALETTE.deepNight);
      const out = '#f9a825';
      for (let y = 1; y <= 8; y++) for (let x = 1; x <= 14; x++) put(x, y, c);
      for (let x = 1; x <= 14; x++) {
        put(x, 1, out);
        put(x, 8, out);
      }
      for (let y = 1; y <= 8; y++) {
        put(1, y, out);
        put(14, y, out);
      }
      put(3, 9, out);
      put(2, 10, out);
      put(1, 11, out);
      // "!"
      put(7, 3, ink);
      put(8, 3, ink);
      put(7, 4, ink);
      put(8, 4, ink);
      put(7, 5, ink);
      put(8, 5, ink);
      put(7, 7, ink);
      put(8, 7, ink);
    });
  }

  private static glowOrb(scene: Phaser.Scene): void {
    this.tex(scene, 'glow_orb', 16, 16, (_ctx, put) => {
      const outer = this.H(PALETTE.lampHalo);
      const mid = this.H(PALETTE.lampCore);
      const core = '#fffde7';
      const out = '#e65100';
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const dx = x - 7.5;
          const dy = y - 7.5;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 7.2 && d > 6.2) put(x, y, out);
          else if (d < 6.2) put(x, y, outer);
          if (d < 4.5) put(x, y, mid);
          if (d < 2.4) put(x, y, core);
        }
      }
      put(6, 5, '#ffffff');
      put(7, 5, '#ffffff');
      put(6, 6, '#ffffff');
    });
  }

  private static explosion(scene: Phaser.Scene): void {
    for (let f = 0; f < 5; f++) {
      this.tex(scene, `boom_${f}`, 28, 28, (_ctx, put) => {
        const r = 4 + f * 2.6;
        const colors = ['#ffffff', '#fff59d', '#ffca28', '#ff6e40', '#5d4037'];
        const c = colors[Math.min(f, colors.length - 1)];
        const edge = f < 3 ? '#ff8f00' : '#3e2723';
        for (let y = 0; y < 28; y++) {
          for (let x = 0; x < 28; x++) {
            const dx = x - 14;
            const dy = y - 14;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < r && d > r - 2.2) put(x, y, edge);
            if (d < r - 1.2 && d > r - 3.5) put(x, y, c);
            if (f < 2 && d < 3) put(x, y, '#ffffff');
            if (f >= 1 && f <= 3 && ((x * 3 + y * 5 + f) % 13 === 0) && d < r + 0.5 && d > r - 5) {
              put(x, y, '#fff176');
            }
          }
        }
      });
    }
  }

  private static webHazard(scene: Phaser.Scene): void {
    this.tex(scene, 'web', 32, 20, (ctx, put) => {
      const c = '#eceff1';
      const d = '#90a4ae';
      ctx.strokeStyle = c;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(32, 10);
      ctx.moveTo(2, 2);
      ctx.lineTo(30, 18);
      ctx.moveTo(2, 18);
      ctx.lineTo(30, 2);
      ctx.moveTo(10, 1);
      ctx.lineTo(10, 19);
      ctx.moveTo(22, 1);
      ctx.lineTo(22, 19);
      ctx.stroke();
      for (let i = 0; i < 7; i++) put(2 + i * 4, 10, d);
    });
  }

  private static powerups(scene: Phaser.Scene): void {
    const map: Record<string, [string, string]> = {
      spread: ['#4fc3f7', '#01579b'],
      rapid: ['#ff7043', '#bf360c'],
      shield: ['#69f0ae', '#1b5e20'],
      companion: ['#ffee58', '#f9a825'],
      lampRefill: ['#fff59d', '#ff8f00'],
      pierce: ['#ea80fc', '#6a1b9a'],
    };
    for (const [k, [c, out]] of Object.entries(map)) {
      this.tex(scene, `power_${k}`, 16, 16, (_ctx, put) => {
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const cx = Math.abs(x - 7.5);
            const cy = Math.abs(y - 7.5);
            const m = cx + cy;
            if (m < 7.5 && m > 6.2) put(x, y, out);
            else if (m < 6.2) put(x, y, c);
            if (m < 3.2) put(x, y, '#ffffff');
            if (m < 1.8) put(x, y, c);
          }
        }
        put(6, 5, '#fff');
        put(7, 5, '#fff');
      });
    }
  }

  private static enemies(scene: Phaser.Scene): void {
    type Spec = {
      body: string;
      mid: string;
      light: string;
      dark: string;
      accent: string;
      detail: (put: (x: number, y: number, c: string) => void, f: number) => void;
    };

    const OUT = '#12081c';
    const specs: Record<string, Spec> = {
      gnat: {
        body: '#7cb342',
        mid: '#9ccc65',
        light: '#c5e1a5',
        dark: '#33691e',
        accent: '#f0f4c3',
        detail: (put, f) => {
          // tiny wings
          put(3, 6 + f, '#c5e1a5');
          put(4, 7, '#aed581');
          put(16, 6 + (1 - f), '#c5e1a5');
          put(15, 7, '#aed581');
        },
      },
      mosquito: {
        body: '#e91e63',
        mid: '#f06292',
        light: '#f8bbd0',
        dark: '#880e4f',
        accent: '#ffffff',
        detail: (put, f) => {
          put(10, 3, '#880e4f');
          put(10, 2, '#ad1457');
          put(17, 9, '#880e4f');
          put(18, 9 + f, '#f06292');
          put(3, 7, '#f8bbd0');
          put(16, 7, '#f8bbd0');
        },
      },
      beetle: {
        body: '#6d4c41',
        mid: '#8d6e63',
        light: '#bcaaa4',
        dark: '#3e2723',
        accent: '#d7ccc8',
        detail: (put) => {
          // shell ridge + legs
          for (let x = 6; x <= 13; x++) put(x, 6, '#3e2723');
          put(5, 12, '#3e2723');
          put(4, 13, '#5d4037');
          put(14, 12, '#3e2723');
          put(15, 13, '#5d4037');
          put(5, 8, '#3e2723');
          put(14, 8, '#3e2723');
        },
      },
      heckler: {
        body: '#7e57c2',
        mid: '#9575cd',
        light: '#b39ddb',
        dark: '#4527a0',
        accent: '#fff176',
        detail: (put) => {
          // speech hat
          for (let x = 7; x <= 12; x++) {
            put(x, 2, '#fff176');
            put(x, 3, '#fff59d');
          }
          put(8, 1, '#fff176');
          put(9, 1, '#fffde7');
          put(10, 1, '#fff176');
          put(9, 3, '#4527a0');
        },
      },
      doomWasp: {
        body: '#ff9800',
        mid: '#ffb74d',
        light: '#ffe0b2',
        dark: '#e65100',
        accent: '#ffeb3b',
        detail: (put, f) => {
          // stinger + stripes
          put(17, 9, '#e65100');
          put(18, 9, '#ff6d00');
          put(19, 9, '#bf360c');
          put(8, 8, '#e65100');
          put(11, 8, '#e65100');
          put(8, 11, '#e65100');
          put(11, 11, '#e65100');
          put(3, 6 + f, '#ffe0b2');
          put(16, 6 + (1 - f), '#ffe0b2');
        },
      },
      webSpinner: {
        body: '#78909c',
        mid: '#90a4ae',
        light: '#cfd8dc',
        dark: '#455a64',
        accent: '#eceff1',
        detail: (put) => {
          put(4, 5, '#cfd8dc');
          put(15, 5, '#cfd8dc');
          put(4, 13, '#cfd8dc');
          put(15, 13, '#cfd8dc');
          put(3, 4, '#eceff1');
          put(16, 4, '#eceff1');
        },
      },
      lampLeech: {
        body: '#6a1b9a',
        mid: '#8e24aa',
        light: '#ce93d8',
        dark: '#4a148c',
        accent: '#ea80fc',
        detail: (put) => {
          put(9, 10, '#fff176');
          put(10, 10, '#ffecb3');
          put(9, 14, '#ea80fc');
          put(10, 15, '#ea80fc');
          put(11, 14, '#ea80fc');
          put(8, 16, '#ce93d8');
          put(11, 16, '#ce93d8');
        },
      },
    };

    const kinds = Object.keys(specs) as EnemyKind[];
    for (const kind of kinds) {
      if (kind === 'boss') continue;
      const s = specs[kind];
      for (let f = 0; f < 2; f++) {
        this.tex(scene, `enemy_${kind}_${f}`, 20, 20, (_ctx, put) => {
          // Body oval with outline + 3-tone lighting
          for (let y = 4; y <= 15; y++) {
            for (let x = 4; x <= 15; x++) {
              const cx = x - 9.5;
              const cy = y - 9.5;
              const e = (cx * cx) / 36 + (cy * cy) / 30;
              if (e > 1.15) continue;
              if (e > 0.92) {
                put(x, y, OUT);
                continue;
              }
              // light from top-left
              const lit = -cx * 0.4 - cy * 0.6;
              let col = s.mid;
              if (lit > 1.2) col = s.light;
              else if (lit < -0.8) col = s.dark;
              else if (e < 0.35) col = s.body;
              put(x, y, col);
            }
          }
          // Eyes
          put(7, 8, s.accent);
          put(12, 8, s.accent);
          put(7, 9, '#ffffff');
          put(12, 9, '#ffffff');
          put(8, 9, OUT);
          put(13, 9, OUT);
          s.detail(put, f);
        });
      }
    }
  }

  private static boss(scene: Phaser.Scene): void {
    const OUT = '#0a0618';
    for (let f = 0; f < 3; f++) {
      this.tex(scene, `boss_${f}`, 64, 56, (_ctx, put) => {
        const body = '#1a237e';
        const mid = '#303f9f';
        const light = '#5c6bc0';
        const shell = '#3949ab';
        const wing = '#151b54';
        const wingL = '#283593';
        const glow = this.H(PALETTE.lampCore);
        const glow2 = this.H(PALETTE.lampHalo);
        const eye = f === 2 ? this.H(PALETTE.danger) : this.H(PALETTE.neonCyan);
        const eyeW = '#ffffff';

        // Wings (animated)
        const wy = 16 + f;
        for (let i = 0; i < 16; i++) {
          const y = wy + (i % 4);
          put(2 + i, y, OUT);
          put(3 + i, y + 1, wing);
          put(4 + i, y + 2, wingL);
          put(61 - i, y, OUT);
          put(60 - i, y + 1, wing);
          put(59 - i, y + 2, wingL);
        }

        // Main carapace
        for (let y = 12; y < 44; y++) {
          for (let x = 14; x < 50; x++) {
            const cx = x - 32;
            const cy = y - 28;
            const e = (cx * cx) / 220 + (cy * cy) / 160;
            if (e > 1.05) continue;
            if (e > 0.9) {
              put(x, y, OUT);
              continue;
            }
            const lit = -cx * 0.15 - cy * 0.5;
            let col = mid;
            if (e < 0.35) col = light;
            else if (lit > 0.8) col = shell;
            else if (lit < -1) col = body;
            else col = mid;
            put(x, y, col);
          }
        }

        // Armor ridges
        for (let x = 18; x <= 45; x++) {
          put(x, 16, body);
          put(x, 34, body);
        }

        // Eyes with sockets
        for (let y = 20; y <= 25; y++) {
          for (let x = 20; x <= 26; x++) put(x, y, OUT);
          for (let x = 37; x <= 43; x++) put(x, y, OUT);
        }
        for (let y = 21; y <= 24; y++) {
          for (let x = 21; x <= 25; x++) put(x, y, eye);
          for (let x = 38; x <= 42; x++) put(x, y, eye);
        }
        put(22, 22, eyeW);
        put(39, 22, eyeW);

        // Lamp heart gem
        for (let y = 26; y <= 33; y++) {
          for (let x = 28; x <= 35; x++) {
            const cx = x - 31.5;
            const cy = y - 29.5;
            if (cx * cx + cy * cy < 16) put(x, y, OUT);
            if (cx * cx + cy * cy < 11) put(x, y, glow2);
            if (cx * cx + cy * cy < 6) put(x, y, glow);
          }
        }
        put(30, 28, '#ffffff');
        put(31, 28, '#ffffff');

        // Mandibles
        put(24, 38, OUT);
        put(23, 39, body);
        put(22, 40, mid);
        put(39, 38, OUT);
        put(40, 39, body);
        put(41, 40, mid);

        // Phase 3 rage cracks
        if (f === 2) {
          put(26, 18, this.H(PALETTE.danger));
          put(27, 19, this.H(PALETTE.danger));
          put(36, 18, this.H(PALETTE.danger));
          put(35, 19, this.H(PALETTE.danger));
        }
      });
    }
  }

  private static particles(scene: Phaser.Scene): void {
    this.tex(scene, 'spark', 5, 5, (_ctx, put) => {
      put(2, 0, '#ffffff');
      put(1, 1, this.H(PALETTE.particleHit));
      put(2, 1, '#ffffff');
      put(3, 1, this.H(PALETTE.particleHit));
      put(0, 2, this.H(PALETTE.lampCore));
      put(1, 2, '#ffffff');
      put(2, 2, '#ffffff');
      put(3, 2, '#ffffff');
      put(4, 2, this.H(PALETTE.lampCore));
      put(1, 3, this.H(PALETTE.particleHit));
      put(2, 3, this.H(PALETTE.particleExplode));
      put(3, 3, this.H(PALETTE.particleHit));
      put(2, 4, this.H(PALETTE.particleExplode));
    });
  }

  private static bgTiles(scene: Phaser.Scene): void {
    this.tex(scene, 'stars', 128, 128, (ctx, put) => {
      ctx.fillStyle = this.H(PALETTE.void);
      ctx.fillRect(0, 0, 128, 128);
      // deep bands
      for (let y = 0; y < 128; y += 16) {
        ctx.fillStyle = 'rgba(26, 20, 64, 0.35)';
        ctx.fillRect(0, y, 128, 6);
      }
      for (let i = 0; i < 55; i++) {
        const x = (i * 53 + 11) % 128;
        const y = (i * 37 + 7) % 128;
        const bright = i % 5 === 0;
        put(x, y, bright ? '#ffffff' : this.H(PALETTE.starDim));
        if (bright) {
          put(x + 1, y, this.H(PALETTE.starDim));
          put(x, y + 1, this.H(PALETTE.starDim));
          put(x - 1, y, 'rgba(144,202,249,0.5)');
        }
      }
      // nebula
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = this.H(PALETTE.neonPurple);
      ctx.fillRect(24, 40, 36, 14);
      ctx.fillStyle = this.H(PALETTE.midBlue);
      ctx.fillRect(70, 70, 40, 16);
      ctx.globalAlpha = 1;
    });

    this.tex(scene, 'moon', 40, 40, (_ctx, put) => {
      for (let y = 0; y < 40; y++) {
        for (let x = 0; x < 40; x++) {
          const dx = x - 19.5;
          const dy = y - 19.5;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 16.5 && d > 15.2) put(x, y, this.H(PALETTE.moonlight));
          else if (d < 15.2) put(x, y, this.H(PALETTE.moonSoft));
          if (d < 12) put(x, y, this.H(PALETTE.moonCore));
        }
      }
      // craters
      put(12, 14, this.H(PALETTE.moonSoft));
      put(13, 14, this.H(PALETTE.moonSoft));
      put(12, 15, this.H(PALETTE.moonSoft));
      put(22, 18, this.H(PALETTE.moonSoft));
      put(23, 18, this.H(PALETTE.moonSoft));
      put(14, 24, this.H(PALETTE.moonSoft));
      // crescent shadow
      for (let y = 6; y < 34; y++) {
        for (let x = 22; x < 36; x++) {
          const dx = x - 28;
          const dy = y - 19.5;
          if (dx * dx + dy * dy < 90) put(x, y, this.H(PALETTE.void));
        }
      }
    });

    this.tex(scene, 'hills', 80, 28, (_ctx, put) => {
      for (let x = 0; x < 80; x++) {
        const h =
          10 + Math.sin(x * 0.18) * 5 + Math.sin(x * 0.05) * 7 + ((x * 5) % 4);
        for (let y = 28 - h; y < 28; y++) {
          put(x, y, y === 28 - h ? this.H(PALETTE.cloudLite) : this.H(PALETTE.cloud));
        }
      }
    });

    this.tex(scene, 'city_sil', 96, 48, (_ctx, put) => {
      for (let i = 0; i < 10; i++) {
        const bx = i * 10;
        const bh = 14 + ((i * 7) % 22);
        for (let y = 48 - bh; y < 48; y++) {
          for (let x = bx; x < bx + 9; x++) put(x, y, this.H(PALETTE.deepNight));
        }
        put(bx, 48 - bh, this.H(PALETTE.midnight));
        for (let wy = 48 - bh + 3; wy < 46; wy += 5) {
          for (let wx = bx + 1; wx < bx + 8; wx += 3) {
            const lit = (wx + wy + i) % 4 !== 0;
            put(
              wx,
              wy,
              lit
                ? i % 2 === 0
                  ? this.H(PALETTE.neonPink)
                  : this.H(PALETTE.neonCyan)
                : this.H(PALETTE.midnight),
            );
            if (lit) put(wx, wy + 1, i % 2 === 0 ? '#f48fb1' : '#84ffff');
          }
        }
      }
    });

    this.tex(scene, 'fence', 48, 24, (_ctx, put) => {
      const c = this.H(PALETTE.backyardFence);
      const l = this.H(PALETTE.backyardFenceLite);
      const out = '#2c1810';
      for (let x = 0; x < 48; x++) {
        put(x, 14, out);
        put(x, 15, c);
        put(x, 16, l);
        put(x, 17, c);
      }
      for (let i = 0; i < 6; i++) {
        const x = 2 + i * 8;
        for (let y = 2; y < 20; y++) {
          put(x, y, out);
          put(x + 1, y, c);
          put(x + 2, y, l);
          put(x + 3, y, c);
        }
        put(x + 1, 1, l);
        put(x + 2, 0, l);
        put(x + 3, 1, c);
      }
    });

    this.tex(scene, 'neon_sign', 32, 16, (_ctx, put) => {
      const pink = this.H(PALETTE.neonPink);
      const cyan = this.H(PALETTE.neonCyan);
      const purp = this.H(PALETTE.neonPurple);
      const bg = this.H(PALETTE.deepNight);
      for (let y = 1; y <= 14; y++) for (let x = 1; x <= 30; x++) put(x, y, bg);
      for (let x = 1; x <= 30; x++) {
        put(x, 1, pink);
        put(x, 14, cyan);
      }
      for (let y = 1; y <= 14; y++) {
        put(1, y, pink);
        put(30, y, cyan);
      }
      for (let x = 4; x <= 13; x++) {
        put(x, 5, purp);
        put(x, 6, purp);
      }
      for (let x = 16; x <= 26; x++) {
        put(x, 5, cyan);
        put(x, 6, cyan);
      }
      for (let x = 7; x <= 24; x++) {
        put(x, 9, pink);
        put(x, 10, pink);
      }
    });

    this.tex(scene, 'grass', 32, 14, (_ctx, put) => {
      const c = this.H(PALETTE.backyardGrass);
      const l = this.H(PALETTE.backyardGrassLite);
      const d = '#0d3b12';
      for (let x = 0; x < 32; x++) {
        put(x, 10, d);
        put(x, 11, c);
        put(x, 12, l);
        put(x, 13, c);
        if (x % 3 === 0) put(x, 6, l);
        if (x % 2 === 0) put(x, 7, c);
        if (x % 4 === 1) put(x, 5, l);
        put(x, 8, c);
        put(x, 9, d);
      }
    });
  }

  private static lamp(scene: Phaser.Scene): void {
    this.tex(scene, 'porch_lamp', 28, 44, (_ctx, put) => {
      const wood = this.H(PALETTE.porchWood);
      const woodL = this.H(PALETTE.porchWoodLite);
      const out = '#2c1810';
      const metal = '#90a4ae';
      const metalD = '#546e7a';
      const glow = this.H(PALETTE.lampCore);
      const halo = this.H(PALETTE.lampHalo);
      // post
      for (let y = 18; y < 42; y++) {
        put(12, y, out);
        put(13, y, wood);
        put(14, y, woodL);
        put(15, y, wood);
        put(16, y, out);
      }
      for (let x = 9; x <= 19; x++) {
        put(x, 40, out);
        put(x, 41, wood);
        put(x, 42, wood);
      }
      // head
      for (let y = 4; y <= 17; y++) {
        for (let x = 6; x <= 21; x++) {
          if (y === 4 || y === 17 || x === 6 || x === 21) put(x, y, metalD);
          else put(x, y, metal);
        }
      }
      for (let y = 7; y <= 14; y++) {
        for (let x = 9; x <= 18; x++) put(x, y, halo);
      }
      for (let y = 8; y <= 13; y++) {
        for (let x = 10; x <= 17; x++) put(x, y, glow);
      }
      put(12, 9, '#ffffff');
      put(13, 9, '#ffffff');
      put(12, 10, '#ffffff');
      // cap
      for (let x = 7; x <= 20; x++) {
        put(x, 2, metalD);
        put(x, 3, metal);
      }
      put(13, 1, metal);
      put(14, 1, '#b0bec5');
    });
  }

  private static ui(scene: Phaser.Scene): void {
    this.tex(scene, 'pixel_white', 2, 2, (_ctx, put) => {
      put(0, 0, '#fff');
      put(1, 0, '#fff');
      put(0, 1, '#fff');
      put(1, 1, '#fff');
    });
    this.tex(scene, 'heart', 10, 10, (_ctx, put) => {
      const c = this.H(PALETTE.danger);
      const l = '#ff8a80';
      const out = '#b71c1c';
      const cells = [
        [2, 1],
        [3, 1],
        [5, 1],
        [6, 1],
        [1, 2],
        [2, 2],
        [3, 2],
        [4, 2],
        [5, 2],
        [6, 2],
        [7, 2],
        [1, 3],
        [2, 3],
        [3, 3],
        [4, 3],
        [5, 3],
        [6, 3],
        [7, 3],
        [1, 4],
        [2, 4],
        [3, 4],
        [4, 4],
        [5, 4],
        [6, 4],
        [7, 4],
        [2, 5],
        [3, 5],
        [4, 5],
        [5, 5],
        [6, 5],
        [3, 6],
        [4, 6],
        [5, 6],
        [4, 7],
      ];
      for (const [x, y] of cells) put(x, y, c);
      put(2, 2, l);
      put(3, 2, l);
      put(2, 3, l);
      put(1, 1, out);
      put(7, 1, out);
      put(4, 8, out);
    });
  }
}
