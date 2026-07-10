import Phaser from 'phaser';
import { GAME, type SectionId } from '../data/balance';
import { PALETTE } from '../data/palette';

interface Layer {
  sprite: Phaser.GameObjects.TileSprite | Phaser.GameObjects.Image;
  speed: number;
  kind: 'tile' | 'image';
  section?: SectionId | 'all';
  baseAlpha: number;
}

/**
 * Multi-layer parallax world — section-aware atmosphere for AAA depth.
 */
export class WorldLayers {
  private scene: Phaser.Scene;
  private layers: Layer[] = [];
  private decor: Phaser.GameObjects.Image[] = [];
  private vignette?: Phaser.GameObjects.Rectangle;
  private sectionGlow?: Phaser.GameObjects.Rectangle;
  private fireflies: { img: Phaser.GameObjects.Image; phase: number; spd: number }[] = [];
  private section: SectionId = 'backyard';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  build(): void {
    this.destroy();
    const s = this.scene;
    const W = GAME.width;
    const H = GAME.height;

    // Depth order: far → near
    this.addTile('stars', 0, 0, W, H, 0.08, 0, 1);
    this.addTile('clouds', 0, 8, W, 40, 0.14, 1, 0.55);
    this.addTile('hills', 0, H - 52, W, 28, 0.22, 1, 0.95);
    this.addTile('trees_far', 0, H - 70, W, 48, 0.32, 2, 0.85);
    this.addTile('city_sil', 0, H - 62, W, 48, 0.38, 1, 0); // alley+
    this.addTile('bricks', 0, H - 48, W, 36, 0.48, 2, 0); // alley mid
    this.addTile('trees_near', 0, H - 58, W, 40, 0.55, 3, 0.5);
    this.addTile('porch_rail', 0, H - 36, W, 24, 0.62, 3, 0); // porch+
    this.addTile('grass', 0, H - 14, W, 14, 0.78, 2, 1);
    this.addTile('ground_detail', 0, H - 8, W, 8, 0.95, 3, 0.9);

    // Moon
    const moon = s.add.image(270, 34, 'moon').setDepth(1).setAlpha(0.95);
    this.decor.push(moon);

    // Fence posts (backyard)
    for (let i = 0; i < 7; i++) {
      const fence = s.add.image(30 + i * 55, H - 28, 'fence').setDepth(3).setAlpha(0.92);
      this.decor.push(fence);
    }

    // Neon signs (alley)
    for (let i = 0; i < 6; i++) {
      const neon = s.add
        .image(40 + i * 58, 22 + (i % 3) * 14, 'neon_sign')
        .setDepth(3)
        .setAlpha(0);
      this.decor.push(neon);
    }

    // Ambient fireflies
    for (let i = 0; i < 10; i++) {
      const img = s.add
        .image(20 + Math.random() * 280, 30 + Math.random() * 100, 'spark')
        .setDepth(6)
        .setAlpha(0.35)
        .setScale(0.6 + Math.random() * 0.5)
        .setTint(0xfff176);
      this.fireflies.push({
        img,
        phase: Math.random() * Math.PI * 2,
        spd: 0.8 + Math.random() * 1.2,
      });
    }

    // Section color wash
    this.sectionGlow = s.add
      .rectangle(W / 2, H / 2, W, H, PALETTE.moonlight, 0)
      .setDepth(4)
      .setScrollFactor(0);

    // Soft vignette
    this.vignette = s.add
      .rectangle(W / 2, H / 2, W, H, 0x000000, 0)
      .setDepth(70)
      .setScrollFactor(0);
    // approximate vignette with darker edges via multiple rects
    s.add.rectangle(W / 2, 4, W, 10, 0x000000, 0.25).setDepth(69).setScrollFactor(0);
    s.add.rectangle(W / 2, H - 3, W, 8, 0x000000, 0.2).setDepth(69).setScrollFactor(0);
  }

  private addTile(
    key: string,
    x: number,
    y: number,
    w: number,
    h: number,
    speed: number,
    depth: number,
    alpha: number,
  ): void {
    if (!this.scene.textures.exists(key)) return;
    const sprite = this.scene.add
      .tileSprite(x, y, w, h, key)
      .setOrigin(0)
      .setDepth(depth)
      .setAlpha(alpha);
    this.layers.push({ sprite, speed, kind: 'tile', baseAlpha: alpha, section: 'all' });
  }

  setSection(section: SectionId): void {
    this.section = section;
    const alley = section === 'alley' || section === 'porch' || section === 'boss';
    const porch = section === 'porch' || section === 'boss';
    const backyard = section === 'backyard';

    for (const L of this.layers) {
      const key = (L.sprite as Phaser.GameObjects.TileSprite).texture?.key;
      if (key === 'city_sil' || key === 'bricks') {
        L.sprite.setAlpha(alley ? 0.95 : 0);
      } else if (key === 'trees_far' || key === 'trees_near') {
        L.sprite.setAlpha(backyard ? L.baseAlpha : porch ? 0.25 : 0.15);
      } else if (key === 'porch_rail') {
        L.sprite.setAlpha(porch ? 0.95 : 0);
      } else if (key === 'clouds') {
        L.sprite.setAlpha(backyard ? 0.55 : alley ? 0.2 : 0.35);
      }
    }

    for (const d of this.decor) {
      if (d.texture.key === 'neon_sign') d.setAlpha(alley ? 0.95 : 0);
      if (d.texture.key === 'fence') d.setAlpha(backyard ? 0.92 : 0.15);
      if (d.texture.key === 'moon') d.setAlpha(backyard ? 0.95 : alley ? 0.4 : 0.7);
    }

    // Atmosphere wash
    if (this.sectionGlow) {
      if (section === 'alley') {
        this.sectionGlow.setFillStyle(0xff4081, 0.06);
      } else if (section === 'porch' || section === 'boss') {
        this.sectionGlow.setFillStyle(0xffca28, 0.07);
      } else {
        this.sectionGlow.setFillStyle(0x6ec6ff, 0.04);
      }
    }
  }

  update(dtSec: number, scrollSpeed: number, elapsed: number): void {
    for (const L of this.layers) {
      if (L.kind === 'tile') {
        (L.sprite as Phaser.GameObjects.TileSprite).tilePositionX += scrollSpeed * L.speed * dtSec;
      }
    }

    for (const d of this.decor) {
      if (d.texture.key === 'moon') {
        d.x = 270 + Math.sin(elapsed * 0.12) * 3;
        d.y = 34 + Math.cos(elapsed * 0.1) * 2;
        continue;
      }
      d.x -= scrollSpeed * dtSec * 0.5;
      if (d.x < -60) d.x += 320;
    }

    for (const f of this.fireflies) {
      f.phase += dtSec * f.spd;
      f.img.x += Math.sin(f.phase) * 8 * dtSec;
      f.img.y += Math.cos(f.phase * 1.3) * 6 * dtSec;
      f.img.setAlpha(0.2 + Math.sin(f.phase * 2) * 0.25);
      if (f.img.x < -5) f.img.x = GAME.width + 5;
      if (f.img.x > GAME.width + 5) f.img.x = -5;
      if (f.img.y < 10) f.img.y = 20;
      if (f.img.y > GAME.height - 20) f.img.y = GAME.height - 30;
      // dim in alley
      if (this.section === 'alley') f.img.setVisible(false);
      else f.img.setVisible(true);
    }
  }

  destroy(): void {
    for (const L of this.layers) L.sprite.destroy();
    this.layers = [];
    for (const d of this.decor) d.destroy();
    this.decor = [];
    for (const f of this.fireflies) f.img.destroy();
    this.fireflies = [];
    this.sectionGlow?.destroy();
    this.vignette?.destroy();
  }
}
