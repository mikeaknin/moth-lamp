import Phaser from 'phaser';
import { SpriteFactory } from '../effects/SpriteFactory';
import { GAME } from '../data/balance';

/**
 * Loads museum-grade PNG sprite sheets from /assets/sprites,
 * then fills any gaps with runtime generation.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.setPath('/assets/sprites');

    // Core cast
    for (let i = 0; i < 4; i++) this.load.image(`moth_${i}`, `moth_${i}.png`);
    this.load.image('moth_dash', 'moth_dash.png');
    this.load.image('moth_hurt', 'moth_hurt.png');

    const enemies = [
      'gnat',
      'mosquito',
      'beetle',
      'heckler',
      'doomWasp',
      'webSpinner',
      'lampLeech',
    ];
    for (const e of enemies) {
      this.load.image(`enemy_${e}_0`, `enemy_${e}_0.png`);
      this.load.image(`enemy_${e}_1`, `enemy_${e}_1.png`);
    }

    // Three stage bosses × 3 anim frames (hand-authored NES)
    for (const id of ['briar', 'neon', 'tyrant'] as const) {
      for (let i = 0; i < 3; i++) this.load.image(`boss_${id}_${i}`, `boss_${id}_${i}.png`);
    }
    // Legacy keys → tyrant (fallback for any old refs)
    for (let i = 0; i < 3; i++) this.load.image(`boss_${i}`, `boss_tyrant_${i}.png`);
    for (let i = 0; i < 5; i++) this.load.image(`boom_${i}`, `boom_${i}.png`);

    this.load.image('bullet_player', 'bullet_player.png');
    this.load.image('bullet_pierce', 'bullet_pierce.png');
    this.load.image('bullet_enemy', 'bullet_enemy.png');
    this.load.image('bullet_heckler', 'bullet_heckler.png');
    this.load.image('glow_orb', 'glow_orb.png');
    this.load.image('spark', 'spark.png');
    this.load.image('heart', 'heart.png');
    this.load.image('web', 'web.png');
    this.load.image('stars', 'stars.png');
    this.load.image('moon', 'moon.png');
    this.load.image('hills', 'hills.png');
    this.load.image('city_sil', 'city_sil.png');
    this.load.image('fence', 'fence.png');
    this.load.image('neon_sign', 'neon_sign.png');
    this.load.image('grass', 'grass.png');
    this.load.image('porch_lamp', 'porch_lamp.png');
    this.load.image('clouds', 'clouds.png');
    this.load.image('trees_far', 'trees_far.png');
    this.load.image('trees_near', 'trees_near.png');
    this.load.image('bricks', 'bricks.png');
    this.load.image('porch_rail', 'porch_rail.png');
    this.load.image('ground_detail', 'ground_detail.png');
    this.load.image('pixel_white', 'pixel_white.png');

    for (const k of ['spread', 'rapid', 'shield', 'companion', 'lampRefill', 'pierce']) {
      this.load.image(`power_${k}`, `power_${k}.png`);
    }

    // Never block boot if a file is missing — SpriteFactory fills gaps
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn('[BootScene] sprite missing, will generate:', file.key);
    });
  }

  create(): void {
    // Generate only textures that failed to load
    SpriteFactory.generateMissing(this);

    if (!this.anims.exists('moth_fly')) {
      this.anims.create({
        key: 'moth_fly',
        frames: [0, 1, 2, 3].map((i) => ({ key: `moth_${i}` })),
        frameRate: 14,
        repeat: -1,
      });
    }
    if (!this.anims.exists('boom')) {
      this.anims.create({
        key: 'boom',
        frames: [0, 1, 2, 3, 4].map((i) => ({ key: `boom_${i}` })),
        frameRate: 18,
        hideOnComplete: true,
      });
    }

    // Force crisp sampling on all loaded textures
    for (const key of this.textures.getTextureKeys()) {
      if (key === '__DEFAULT' || key === '__MISSING') continue;
      try {
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
      } catch {
        // ignore
      }
    }

    this.cameras.main.setBackgroundColor('#05030e');
    void GAME;
    this.scene.start('GameScene');
  }
}
