import Phaser from 'phaser';
import {
  GAME,
  PLAYER,
  SCORE,
  SCROLL,
  SECTIONS,
  getMedal,
  type SectionId,
} from '../data/balance';
import { WAVE_TIMELINE } from '../data/enemies';
import {
  POWERUP_DROP_CHANCE,
  POWERUP_DROP_WEIGHTS,
  type PowerUpKind,
} from '../data/powerups';
import { PALETTE } from '../data/palette';
import type { GameOutcome, HudSnapshot, RunStats } from '../data/types';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Bullet } from '../entities/Bullet';
import { Boss, type BossPattern } from '../entities/Boss';
import { LampSystem } from '../systems/lampSystem';
import { ScoreSystem } from '../systems/scoreSystem';
import { PowerUpSystem } from '../systems/powerupSystem';
import { AdaptiveDifficulty } from '../systems/adaptiveDifficulty';
import { gameBridge } from '../bridge';
import { audioEngine } from '../audio/AudioEngine';
import { WorldLayers } from '../effects/WorldLayers';
import { Juice } from '../effects/Juice';

interface Pickup {
  sprite: Phaser.GameObjects.Sprite;
  kind: 'glow' | PowerUpKind;
  vx: number;
}

interface WebZone {
  sprite: Phaser.GameObjects.Sprite;
  life: number;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private bullets!: Phaser.GameObjects.Group;
  private enemyBullets!: Phaser.GameObjects.Group;
  private enemies!: Phaser.GameObjects.Group;
  private boss: Boss | null = null;
  private lamp = new LampSystem();
  private scores = new ScoreSystem();
  private powers = new PowerUpSystem();
  private adaptive!: AdaptiveDifficulty;
  private elapsed = 0;
  private section: SectionId = 'backyard';
  private waveIndex = 0;
  private running = false;
  private paused = false;
  private outcome: GameOutcome = 'playing';
  private enemiesDestroyed = 0;
  private damageTaken = 0;
  private powerupsCollected = 0;
  private pickups: Pickup[] = [];
  private webs: WebZone[] = [];
  private world!: WorldLayers;
  private juice!: Juice;
  private hudTimer = 0;
  private lampWarnTimer = 0;
  private worldX = 0;
  private tutorial = false;
  private tutorialText?: Phaser.GameObjects.Text;
  private sectionBanner?: Phaser.GameObjects.Text;
  private bossSpawned = false;
  private glowDropChance = 0.22;
  private lastMusic: 'level' | 'boss' = 'level';
  private scrollSpeed = SCROLL.baseSpeed as number;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.void);
    this.physics.world.setBounds(0, 0, GAME.width, GAME.height);

    this.world = new WorldLayers(this);
    this.juice = new Juice(this);
    this.world.build();
    this.world.setSection('backyard');

    this.bullets = this.add.group({ classType: Bullet, maxSize: 100, runChildUpdate: true });
    this.enemyBullets = this.add.group({ classType: Bullet, maxSize: 160, runChildUpdate: true });
    this.enemies = this.add.group({ classType: Enemy, maxSize: 48, runChildUpdate: true });

    this.player = new Player(this);

    this.physics.add.overlap(this.bullets, this.enemies, (b, e) => {
      this.onPlayerBulletHitEnemy(b as Bullet, e as Enemy);
    });
    this.physics.add.overlap(this.enemyBullets, this.player, (b) => {
      this.onEnemyBulletHitPlayer(b as Bullet);
    });
    this.physics.add.overlap(this.enemies, this.player, (e) => {
      this.onEnemyContact(e as Enemy);
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      if (!this.running) return;
      if (this.paused) gameBridge.resume();
      else gameBridge.pause();
    });

    this.resetRun(false);
    gameBridge.emitReady();
  }

  private resetRun(startPlaying: boolean): void {
    this.elapsed = 0;
    this.section = 'backyard';
    this.world?.setSection('backyard');
    this.waveIndex = 0;
    this.outcome = 'playing';
    this.enemiesDestroyed = 0;
    this.damageTaken = 0;
    this.powerupsCollected = 0;
    this.bossSpawned = false;
    this.scrollSpeed = SCROLL.baseSpeed;
    this.worldX = 0;
    this.paused = false;
    this.running = startPlaying;

    this.lamp.reset();
    this.scores.reset();
    this.powers.reset();
    this.adaptive = new AdaptiveDifficulty(gameBridge.settings.difficulty);

    this.player.resetPlayer();
    this.clearGroups();
    this.clearPickups();
    this.clearWebs();

    if (this.boss) {
      this.boss.destroy();
      this.boss = null;
    }

    this.tutorialText?.destroy();
    this.tutorialText = undefined;
    this.sectionBanner?.destroy();

    if (startPlaying) {
      audioEngine.playMusic(this.tutorial ? 'title' : 'level');
      this.lastMusic = 'level';
      this.showSectionBanner(SECTIONS.backyard.name);
      if (this.tutorial) this.setupTutorial();
    }

    this.emitHud(true);
  }

  private clearGroups(): void {
    this.bullets.getChildren().forEach((c) => (c as Bullet).kill());
    this.enemyBullets.getChildren().forEach((c) => (c as Bullet).kill());
    this.enemies.getChildren().forEach((c) => (c as Enemy).kill(false));
  }

  private clearPickups(): void {
    this.pickups.forEach((p) => p.sprite.destroy());
    this.pickups = [];
  }

  private clearWebs(): void {
    this.webs.forEach((w) => w.sprite.destroy());
    this.webs = [];
  }

  private setupTutorial(): void {
    this.tutorialText = this.add
      .text(GAME.width / 2, 28, 'Move with WASD / drag left stick', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#b3e5fc',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setScrollFactor(0);
  }

  update(time: number, delta: number): void {
    this.handleCommands();

    // touch bridge
    this.player.touchVec.x = gameBridge.touch.vecX;
    this.player.touchVec.y = gameBridge.touch.vecY;
    this.player.touchFire = gameBridge.touch.fire;
    if (gameBridge.touch.dash) {
      this.player.touchDash = true;
      gameBridge.setTouch({ dash: false });
    }

    if (!this.running || this.paused || this.outcome !== 'playing') {
      return;
    }

    this.juice.update(delta);
    if (this.juice.isHitstopping()) {
      return; // freeze world for a few frames on big hits
    }

    const dt = Math.min(delta, 50);
    const dtSec = dt / 1000;
    const profile = this.adaptive.profile;
    const now = time;

    this.elapsed += dtSec;
    this.worldX += this.scrollSpeed * dtSec;
    this.world.update(dtSec, this.scrollSpeed, this.elapsed);
    this.updateSection();

    // lamp drain
    const alive = this.lamp.update(dtSec, profile.lampDrainPerSec);
    if (!alive) {
      this.endRun('gameover_lamp');
      return;
    }

    // lamp warning sfx
    if (this.lamp.isCritical || this.lamp.isWarning) {
      this.lampWarnTimer -= dt;
      if (this.lampWarnTimer <= 0) {
        this.lampWarnTimer = this.lamp.isCritical ? 400 : 900;
        audioEngine.sfxLampWarn();
      }
    }

    // player
    const fireCd = this.powers.fireCooldown(now);
    this.player.combat.hasShield =
      this.player.combat.hasShield || this.powers.has('shield', now);

    this.player.updatePlayer(now, dt, gameBridge.settings, {
      fireCooldownMs: fireCd,
      hasSpread: this.powers.has('spread', now),
      hasPierce: this.powers.has('pierce', now),
      hasCompanion: this.powers.has('companion', now),
      hasShield: this.player.combat.hasShield,
      canFire: () => true,
      onDash: () => audioEngine.sfxDash(),
      fire: (angles, pierce) => this.firePlayer(angles, pierce),
      fireCompanion: () => this.fireCompanion(),
    });

    this.powers.update(now);
    this.scores.update(now);
    this.scores.tickSurvival(dtSec, profile.scoreMult);
    this.adaptive.update(dtSec);

    // webs slow
    let slowed = false;
    for (const w of this.webs) {
      w.life -= dt;
      if (
        Phaser.Math.Distance.Between(this.player.x, this.player.y, w.sprite.x, w.sprite.y) < 18
      ) {
        slowed = true;
      }
    }
    this.player.setSlow(slowed ? 0.45 : 1);
    this.webs = this.webs.filter((w) => {
      if (w.life <= 0) {
        w.sprite.destroy();
        return false;
      }
      w.sprite.x -= this.scrollSpeed * dtSec * 0.3;
      return true;
    });

    // waves
    if (!this.tutorial && !this.bossSpawned) {
      this.spawnWaves(profile.spawnRateMult, profile.enemySpeedMult, profile.enemyHpMult);
    }

    // boss
    if (!this.tutorial && this.elapsed >= SECTIONS.boss.start && !this.bossSpawned) {
      this.spawnBoss(profile.enemyHpMult);
    }

    if (this.boss?.alive) {
      this.physics.overlap(this.bullets, this.boss, (b) => {
        const bullet = b as Bullet;
        if (!bullet.active || bullet.data_.owner !== 'player') return;
        const killed = this.boss!.hit(bullet.data_.damage);
        const gained = this.scores.addRaw(SCORE.bossHit, profile.scoreMult);
        if (!bullet.data_.pierce) bullet.kill();
        this.burst(this.boss!.x - 10, this.boss!.y, 5);
        this.juice.floatText(this.boss!.x - 8, this.boss!.y - 12, `+${gained}`, '#ea80fc');
        this.juice.hitstop(28);
        this.juice.shake(0.004, 50);
        audioEngine.sfxHit();
        if (killed) {
          this.scores.addRaw(SCORE.bossKill, profile.scoreMult);
          this.enemiesDestroyed += 1;
          this.bigBoom(this.boss!.x, this.boss!.y);
          this.juice.ringBurst(this.boss!.x, this.boss!.y, 0xfff176);
          this.juice.shake(0.012, 400);
          this.juice.flash(255, 220, 80, 200);
          audioEngine.sfxExplosion();
          this.showSectionBanner('LAMP SECURED');
          this.time.delayedCall(1100, () => this.endRun('victory'));
        }
      });
      this.physics.overlap(this.boss, this.player, () => {
        this.hurtPlayer(1, profile.playerHitIFramesMs);
      });
    }

    this.updatePickups(dtSec, profile.glowRestoreMult, profile.scoreMult);
    this.updateTutorial();

    this.hudTimer += dt;
    if (this.hudTimer > 50) {
      this.hudTimer = 0;
      this.emitHud(false);
    }
  }

  private handleCommands(): void {
    const cmds = gameBridge.drainCommands();
    for (const c of cmds) {
      if (c === 'pause' && this.running && this.outcome === 'playing') {
        this.paused = true;
        this.physics.pause();
        this.emitHud(true);
      } else if (c === 'resume' && this.paused) {
        this.paused = false;
        this.physics.resume();
        this.emitHud(true);
      } else if (c === 'restart') {
        const start = gameBridge.consumeStart();
        this.tutorial = start.tutorial || this.tutorial;
        // If restart without start flag, treat as normal restart
        if (!start.start) this.tutorial = false;
        this.physics.resume();
        this.resetRun(true);
      } else if (c === 'quit') {
        this.running = false;
        this.paused = false;
        this.physics.resume();
        this.resetRun(false);
        audioEngine.playMusic('title');
      }
    }

    // start request without being in command stream restart
    const start = gameBridge.consumeStart();
    if (start.start) {
      this.tutorial = start.tutorial;
      this.physics.resume();
      this.resetRun(true);
    }
  }

  private updateSection(): void {
    let next: SectionId = 'backyard';
    let name = SECTIONS.backyard.name;
    let speed: number = SCROLL.baseSpeed;
    if (this.elapsed >= SECTIONS.boss.start) {
      next = 'boss';
      name = SECTIONS.boss.name;
      speed = SCROLL.bossSpeed;
    } else if (this.elapsed >= SECTIONS.porch.start) {
      next = 'porch';
      name = SECTIONS.porch.name;
      speed = SCROLL.porchSpeed;
    } else if (this.elapsed >= SECTIONS.alley.start) {
      next = 'alley';
      name = SECTIONS.alley.name;
      speed = SCROLL.alleySpeed;
    }
    if (next !== this.section) {
      this.section = next;
      this.scrollSpeed = speed;
      this.world.setSection(next);
      this.showSectionBanner(name);
      gameBridge.emitSection(name);
      this.juice.shake(0.005, 140);
      if (next === 'boss' && this.lastMusic !== 'boss') {
        audioEngine.playMusic('boss');
        this.lastMusic = 'boss';
      }
    }
  }

  private showSectionBanner(name: string): void {
    this.sectionBanner?.destroy();
    this.sectionBanner = this.add
      .text(GAME.width / 2, 50, name, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#fff176',
        backgroundColor: '#0d0a1acc',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(90)
      .setAlpha(0);
    this.tweens.add({
      targets: this.sectionBanner,
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 1200,
      onComplete: () => this.sectionBanner?.destroy(),
    });
  }

  private spawnWaves(spawnMult: number, speedMult: number, hpMult: number): void {
    // effective time stretches slightly with lower spawn mult
    while (this.waveIndex < WAVE_TIMELINE.length) {
      const ev = WAVE_TIMELINE[this.waveIndex];
      const tAdj = ev.t / Math.max(0.5, spawnMult);
      if (this.elapsed < tAdj) break;
      this.waveIndex++;
      for (let i = 0; i < ev.count; i++) {
        const delay = (ev.spacingMs ?? 0) * i;
        this.time.delayedCall(delay, () => {
          if (!this.running || this.outcome !== 'playing') return;
          const y = this.patternY(ev.pattern, i, ev.count);
          this.spawnEnemy(ev.kind, 330 + i * 2, y, speedMult, hpMult);
        });
      }
    }
  }

  private patternY(pattern: string | undefined, i: number, count: number): number {
    const mid = GAME.height / 2;
    switch (pattern) {
      case 'line':
        return 40 + (i / Math.max(1, count - 1)) * 100;
      case 'v':
        return mid + (i - (count - 1) / 2) * 14;
      case 'top':
        return 30 + (i % 3) * 16;
      case 'bottom':
        return 120 + (i % 3) * 12;
      case 'scatter':
      default:
        return 30 + Math.random() * 120;
    }
  }

  private spawnEnemy(
    kind: import('../data/enemies').EnemyKind,
    x: number,
    y: number,
    speedMult: number,
    hpMult: number,
  ): void {
    const enemy = this.enemies.get(x, y) as Enemy | null;
    if (!enemy) {
      const e = new Enemy(this);
      this.enemies.add(e);
      this.wireEnemy(e, kind, x, y, speedMult, hpMult);
      return;
    }
    this.wireEnemy(enemy, kind, x, y, speedMult, hpMult);
  }

  private wireEnemy(
    enemy: Enemy,
    kind: import('../data/enemies').EnemyKind,
    x: number,
    y: number,
    speedMult: number,
    hpMult: number,
  ): void {
    enemy.spawn(kind, x, y, speedMult, hpMult);
    if (enemy.isLeech) this.lamp.addLeech();
    enemy.onShoot = (e, pattern) => this.enemyShoot(e, pattern);
    enemy.onWeb = (wx, wy) => this.spawnWeb(wx, wy);
    enemy.onDeath = (e) => this.onEnemyKilled(e);
  }

  private spawnBoss(hpMult: number): void {
    this.bossSpawned = true;
    this.scrollSpeed = 0;
    // clear minor enemies gently
    this.enemies.getChildren().forEach((c) => {
      const e = c as Enemy;
      if (e.alive) e.kill(false);
    });
    this.boss = new Boss(this);
    this.boss.spawn(hpMult);
    this.boss.onShoot = (pattern) => this.bossShoot(pattern);
    this.boss.onPhaseChange = (phase, name) => {
      this.showSectionBanner(`Phase ${phase}: ${name}`);
      this.juice.shake(0.008, 180);
      this.juice.flash(phase === 3 ? 80 : 40, 20, 80, 100);
      this.juice.ringBurst(this.boss!.x, this.boss!.y, phase === 3 ? 0xff4081 : 0xfff176);
    };
    this.boss.onCharge = () => {
      this.juice.shake(0.01, 200);
    };
    this.boss.onDefeated = () => {
      /* handled in overlap */
    };
    this.world.setSection('boss');
    audioEngine.playMusic('boss');
    this.lastMusic = 'boss';
    this.showSectionBanner('PORCHLIGHT TYRANT');
  }

  private firePlayer(angles: number[], pierce: boolean): void {
    audioEngine.sfxShoot();
    this.juice.muzzleFlash(this.player.x + 14, this.player.y + 1);
    for (const a of angles) {
      const bullet = this.acquireBullet(this.bullets);
      const speed = PLAYER.bulletSpeed;
      bullet.fire({
        x: this.player.x + 12,
        y: this.player.y + 1,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        owner: 'player',
        damage: PLAYER.bulletDamage,
        pierce,
        texture: pierce ? 'bullet_pierce' : 'bullet_player',
      });
    }
  }

  private fireCompanion(): void {
    const bullet = this.acquireBullet(this.bullets);
    bullet.fire({
      x: this.player.x - 10,
      y: this.player.y + 12,
      vx: PLAYER.bulletSpeed * 0.9,
      vy: 0,
      owner: 'player',
      damage: 1,
      texture: 'bullet_player',
    });
  }

  private acquireBullet(group: Phaser.GameObjects.Group): Bullet {
    let b = group.getFirstDead(false) as Bullet | null;
    if (!b) {
      b = new Bullet(this, 0, 0);
      group.add(b);
    }
    return b;
  }

  private enemyShoot(enemy: Enemy, pattern: string): void {
    if (pattern === 'heckler') {
      const b = this.acquireBullet(this.enemyBullets);
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      b.fire({
        x: enemy.x - 6,
        y: enemy.y,
        vx: Math.cos(angle) * 80,
        vy: Math.sin(angle) * 80,
        owner: 'enemy',
        texture: 'bullet_heckler',
        lifespan: 3000,
      });
      return;
    }
    // fan
    for (let i = -1; i <= 1; i++) {
      const b = this.acquireBullet(this.enemyBullets);
      const angle = Math.PI + i * 0.25;
      b.fire({
        x: enemy.x - 4,
        y: enemy.y,
        vx: Math.cos(angle) * 90,
        vy: Math.sin(angle) * 90,
        owner: 'enemy',
      });
    }
  }

  private bossShoot(pattern: BossPattern): void {
    if (!this.boss) return;
    const bx = this.boss.x - 16;
    const by = this.boss.y;
    this.juice.muzzleFlash(bx, by);

    if (pattern === 'single') {
      const angle = Phaser.Math.Angle.Between(bx, by, this.player.x, this.player.y);
      for (const spread of [-0.08, 0, 0.08]) {
        const b = this.acquireBullet(this.enemyBullets);
        b.fire({
          x: bx,
          y: by,
          vx: Math.cos(angle + spread) * 105,
          vy: Math.sin(angle + spread) * 105,
          owner: 'enemy',
        });
      }
    } else if (pattern === 'fan') {
      for (let i = -3; i <= 3; i++) {
        const angle = Math.PI + i * 0.18;
        const b = this.acquireBullet(this.enemyBullets);
        b.fire({
          x: bx,
          y: by,
          vx: Math.cos(angle) * 98,
          vy: Math.sin(angle) * 98,
          owner: 'enemy',
        });
      }
    } else if (pattern === 'ring') {
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const b = this.acquireBullet(this.enemyBullets);
        b.fire({
          x: bx,
          y: by,
          vx: Math.cos(angle) * 75,
          vy: Math.sin(angle) * 75,
          owner: 'enemy',
          lifespan: 3200,
        });
      }
    } else if (pattern === 'spiral') {
      const base = this.elapsed * 4;
      for (let i = 0; i < 10; i++) {
        const angle = base + (i / 10) * Math.PI * 2;
        const b = this.acquireBullet(this.enemyBullets);
        b.fire({
          x: bx,
          y: by,
          vx: Math.cos(angle) * 72,
          vy: Math.sin(angle) * 72,
          owner: 'enemy',
          lifespan: 3600,
        });
      }
    } else if (pattern === 'sweep') {
      // horizontal volley while charging
      for (let i = -2; i <= 2; i++) {
        const b = this.acquireBullet(this.enemyBullets);
        b.fire({
          x: bx,
          y: by + i * 12,
          vx: -110,
          vy: i * 8,
          owner: 'enemy',
        });
      }
    }
  }

  private spawnWeb(x: number, y: number): void {
    const sprite = this.add.sprite(x, y, 'web').setDepth(8).setAlpha(0.85);
    this.webs.push({ sprite, life: 4000 });
  }

  private onPlayerBulletHitEnemy(bullet: Bullet, enemy: Enemy): void {
    if (!bullet.active || !enemy.alive || bullet.data_.owner !== 'player') return;
    const dead = enemy.hit(bullet.data_.damage);
    if (!bullet.data_.pierce) bullet.kill();
    this.burst(enemy.x, enemy.y, 3);
    this.juice.hitstop(dead ? 45 : 18);
    audioEngine.sfxHit();
  }

  private onEnemyKilled(enemy: Enemy): void {
    if (enemy.isLeech) this.lamp.removeLeech();
    this.enemiesDestroyed += 1;
    this.adaptive.onKill();
    this.juice.ringBurst(enemy.x, enemy.y, enemy.isLeech ? 0xea80fc : 0xfff176);
    this.juice.shake(0.003, 40);
    const profile = this.adaptive.profile;
    const gained = this.scores.onEnemyKill(enemy.scoreValue, this.time.now, profile.scoreMult);
    this.juice.floatText(enemy.x, enemy.y - 8, `+${gained}`, this.scores.combo > 3 ? '#18ffff' : '#fff176');
    this.bigBoom(enemy.x, enemy.y);
    audioEngine.sfxExplosion();

    if (Math.random() < this.glowDropChance) {
      this.spawnPickup(enemy.x, enemy.y, 'glow');
    } else if (Math.random() < POWERUP_DROP_CHANCE) {
      this.spawnPickup(enemy.x, enemy.y, this.rollPowerup());
    }
  }

  private rollPowerup(): PowerUpKind {
    const total = POWERUP_DROP_WEIGHTS.reduce((s, w) => s + w.weight, 0);
    let r = Math.random() * total;
    for (const w of POWERUP_DROP_WEIGHTS) {
      r -= w.weight;
      if (r <= 0) return w.kind;
    }
    return 'spread';
  }

  private spawnPickup(x: number, y: number, kind: 'glow' | PowerUpKind): void {
    const key = kind === 'glow' ? 'glow_orb' : `power_${kind}`;
    const sprite = this.add.sprite(x, y, key).setDepth(18);
    this.pickups.push({ sprite, kind, vx: -20 });
  }

  private updatePickups(dtSec: number, glowMult: number, scoreMult: number): void {
    this.pickups = this.pickups.filter((p) => {
      p.sprite.x += p.vx * dtSec;
      p.sprite.y += Math.sin(this.elapsed * 6 + p.sprite.x) * 10 * dtSec;
      if (p.sprite.x < -20) {
        p.sprite.destroy();
        return false;
      }
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, p.sprite.x, p.sprite.y);
      if (d < 12) {
        this.collectPickup(p, glowMult, scoreMult);
        p.sprite.destroy();
        return false;
      }
      return true;
    });
  }

  private collectPickup(p: Pickup, glowMult: number, scoreMult: number): void {
    audioEngine.sfxPickup();
    this.powerupsCollected += 1;
    this.juice.ringBurst(p.sprite.x, p.sprite.y, 0x69f0ae);
    if (p.kind === 'glow') {
      const got = this.lamp.restore(10, glowMult);
      this.scores.onPickup(SCORE.glowPickup, scoreMult);
      this.juice.floatText(p.sprite.x, p.sprite.y - 6, `LAMP +${got.toFixed(0)}`, '#fff176');
      return;
    }
    const result = this.powers.apply(p.kind, this.time.now);
    this.scores.onPickup(SCORE.powerupPickup, scoreMult);
    this.juice.floatText(p.sprite.x, p.sprite.y - 6, p.kind.toUpperCase(), '#80d8ff');
    if (p.kind === 'shield') this.player.combat.grantShield();
    if (result.instant && result.amount) {
      this.lamp.refill(result.amount);
    }
  }

  private onEnemyBulletHitPlayer(bullet: Bullet): void {
    if (!bullet.active || bullet.data_.owner !== 'enemy') return;
    bullet.kill();
    this.hurtPlayer(1, this.adaptive.profile.playerHitIFramesMs);
  }

  private onEnemyContact(enemy: Enemy): void {
    if (!enemy.alive) return;
    this.hurtPlayer(enemy.contactDamage, this.adaptive.profile.playerHitIFramesMs);
  }

  private hurtPlayer(amount: number, iFrames: number): void {
    const res = this.player.combat.takeDamage(this.time.now, amount, iFrames);
    if (res.blocked && !res.damaged) {
      this.juice.floatText(this.player.x, this.player.y - 10, 'BLOCK', '#69f0ae');
      audioEngine.sfxHit();
      return;
    }
    if (!res.damaged) return;
    this.damageTaken += amount;
    this.adaptive.onDamage();
    audioEngine.sfxDamage();
    this.juice.hitstop(55);
    this.juice.shake(0.01, 120);
    this.juice.flash(80, 0, 0, 90);
    this.juice.floatText(this.player.x, this.player.y - 10, '-HP', '#ff5252');
    if (res.died) {
      this.endRun('gameover_hp');
    }
  }

  private burst(x: number, y: number, n: number): void {
    if (gameBridge.settings.lowEffects) n = Math.min(n, 2);
    for (let i = 0; i < n; i++) {
      const s = this.add.image(x, y, 'spark').setDepth(40);
      this.tweens.add({
        targets: s,
        x: x + (Math.random() - 0.5) * 24,
        y: y + (Math.random() - 0.5) * 24,
        alpha: 0,
        duration: 200,
        onComplete: () => s.destroy(),
      });
    }
  }

  private bigBoom(x: number, y: number): void {
    const boom = this.add.sprite(x, y, 'boom_0').setDepth(41);
    boom.play('boom');
    boom.on('animationcomplete', () => boom.destroy());
    this.burst(x, y, gameBridge.settings.lowEffects ? 3 : 8);
  }

  private updateTutorial(): void {
    if (!this.tutorial || !this.tutorialText) return;
    const steps = [
      { t: 0, text: 'Move: WASD / arrows / left stick' },
      { t: 4, text: 'Fire: SPACE / tap FIRE' },
      { t: 8, text: 'Dash: SHIFT / DASH — brief invulnerability' },
      { t: 12, text: 'Collect GLOW to feed the lamp timer' },
      { t: 17, text: 'Reach the porch before Lamp Life hits zero!' },
      { t: 22, text: 'Tutorial complete — full run starts!' },
    ];
    const step = steps.filter((s) => this.elapsed >= s.t).at(-1);
    if (step) this.tutorialText.setText(step.text);
    if (this.elapsed > 24) {
      this.tutorial = false;
      this.tutorialText.destroy();
      this.tutorialText = undefined;
      this.elapsed = 0;
      this.waveIndex = 0;
      this.lamp.refill(30);
      this.showSectionBanner('Now for real — Moonlit Backyard');
    }
    // gentle tutorial enemies
    if (this.elapsed > 5 && this.elapsed < 20 && Math.floor(this.elapsed * 2) % 7 === 0) {
      if (Math.random() < 0.03) this.spawnEnemy('gnat', 330, 40 + Math.random() * 100, 0.7, 0.5);
    }
  }

  private endRun(outcome: GameOutcome): void {
    if (this.outcome !== 'playing') return;
    this.outcome = outcome;
    this.running = false;
    this.player.setVelocity(0, 0);

    const profile = this.adaptive.profile;
    if (outcome === 'victory') {
      this.scores.applyEndBonuses({
        lampRemaining: this.lamp.life,
        damageTaken: this.damageTaken,
        scoreMult: profile.scoreMult,
      });
      audioEngine.playMusic('victory');
      audioEngine.sfxVictory();
    } else {
      audioEngine.playMusic('gameover');
      audioEngine.sfxGameOver();
    }

    const stats: RunStats = {
      score: this.scores.score,
      maxCombo: this.scores.maxCombo,
      enemiesDestroyed: this.enemiesDestroyed,
      damageTaken: this.damageTaken,
      lampRemaining: Math.round(this.lamp.life * 10) / 10,
      completionTimeSec: Math.round(this.elapsed * 10) / 10,
      powerupsCollected: this.powerupsCollected,
      bossDefeated: outcome === 'victory',
      difficulty: gameBridge.settings.difficulty,
      medal: getMedal(this.scores.score, this.lamp.life),
    };

    // lamp prop on victory
    if (outcome === 'victory') {
      const lamp = this.add.image(280, 140, 'porch_lamp').setDepth(50).setScale(1.2);
      this.tweens.add({
        targets: lamp,
        alpha: { from: 0.5, to: 1 },
        duration: 400,
        yoyo: true,
        repeat: 3,
      });
    }

    this.emitHud(true);
    gameBridge.emitOutcome(outcome, stats);
  }

  private emitHud(_force: boolean): void {
    const hud: HudSnapshot = {
      hp: this.player.combat.hp,
      maxHp: this.player.combat.maxHp,
      lampLife: this.lamp.life,
      maxLampLife: this.lamp.maxLife,
      score: this.scores.score,
      combo: this.scores.combo,
      dashCooldownRatio: this.player.combat.dashCooldownRatio(this.time.now),
      sectionName:
        this.section === 'backyard'
          ? SECTIONS.backyard.name
          : this.section === 'alley'
            ? SECTIONS.alley.name
            : this.section === 'porch'
              ? SECTIONS.porch.name
              : SECTIONS.boss.name,
      powerups: this.powers.list(this.time.now),
      bossHpRatio: this.boss?.alive ? this.boss.hpRatio : null,
      lampWarning: this.lamp.isWarning || this.lamp.isCritical,
      paused: this.paused,
      outcome: this.outcome,
      elapsedSec: this.elapsed,
    };
    gameBridge.emitHud(hud);
  }
}
