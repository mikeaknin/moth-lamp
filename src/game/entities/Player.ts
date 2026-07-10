import Phaser from 'phaser';
import { PLAYER } from '../data/balance';
import { PlayerCombat } from '../systems/playerCombat';
import type { GameSettings } from '../data/types';

/**
 * Moth-style flight: acceleration, soft glide, hover bob, banking.
 * Feels floaty and agile rather than tank-sticky.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  combat = new PlayerCombat();
  private wingFrame = 0;
  private wingTimer = 0;
  private moveX = 0;
  private moveY = 0;
  private velX = 0;
  private velY = 0;
  private firing = false;
  private wantDash = false;
  private slowFactor = 1;
  private companion: Phaser.GameObjects.Sprite | null = null;
  private companionFireAt = 0;
  private hoverPhase = 0;
  private trailTimer = 0;
  keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
    shift: Phaser.Input.Keyboard.Key;
  };
  pointerFire = false;
  touchVec = { x: 0, y: 0 };
  touchFire = false;
  touchDash = false;

  constructor(scene: Phaser.Scene) {
    super(scene, PLAYER.startX, PLAYER.startY, 'moth_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(30);
    this.setCollideWorldBounds(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    const hb = PLAYER.hitboxRadius * 2;
    const size = PLAYER.spriteSize;
    body.setSize(hb, hb);
    body.setOffset((size - hb) / 2, (size - hb) / 2 + 1);
    body.setAllowGravity(false);
    body.setMaxVelocity(PLAYER.speed * 1.35, PLAYER.speed * 1.35);

    const kb = scene.input.keyboard!;
    this.keys = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      w: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      shift: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
    };

    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      // Only fire with mouse on the game canvas when not using touch UI
      if (p.leftButtonDown() && p.event && (p.event as PointerEvent).pointerType === 'mouse') {
        this.pointerFire = true;
      }
    });
    scene.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if ((p.event as PointerEvent | undefined)?.pointerType === 'mouse' || !p.isDown) {
        this.pointerFire = false;
      }
    });
  }

  resetPlayer(): void {
    this.combat.reset();
    this.setPosition(PLAYER.startX, PLAYER.startY);
    this.setVelocity(0, 0);
    this.velX = 0;
    this.velY = 0;
    this.setAlpha(1);
    this.setAngle(0);
    this.clearTint();
    this.slowFactor = 1;
    this.hoverPhase = 0;
    this.setActive(true).setVisible(true);
    if (this.companion) {
      this.companion.destroy();
      this.companion = null;
    }
  }

  setSlow(factor: number): void {
    this.slowFactor = factor;
  }

  ensureCompanion(on: boolean): void {
    if (on && !this.companion) {
      this.companion = this.scene.add.sprite(this.x - 12, this.y + 10, 'power_companion');
      this.companion.setDepth(29).setScale(0.85);
    } else if (!on && this.companion) {
      this.companion.destroy();
      this.companion = null;
    }
  }

  updatePlayer(
    time: number,
    delta: number,
    _settings: GameSettings,
    opts: {
      canFire: (cd: number) => boolean;
      fire: (angles: number[], pierce: boolean) => void;
      fireCompanion?: () => void;
      onDash: () => void;
      fireCooldownMs: number;
      hasSpread: boolean;
      hasPierce: boolean;
      hasCompanion: boolean;
      hasShield: boolean;
    },
  ): void {
    const now = time;
    const dt = Math.min(delta, 40) / 1000;
    this.readInput();

    let ix = this.moveX;
    let iy = this.moveY;
    const ilen = Math.hypot(ix, iy);
    if (ilen > 1) {
      ix /= ilen;
      iy /= ilen;
    }

    // Response curve: easier fine control near center, full speed at edge
    if (ilen > 0) {
      const curved = Math.pow(Math.min(1, ilen), PLAYER.inputCurve);
      ix = (ix / (ilen || 1)) * curved;
      iy = (iy / (ilen || 1)) * curved;
    }

    const dashing = this.combat.isDashing(now);
    if (this.wantDash && this.combat.startDash(now)) {
      opts.onDash();
      const moving = Math.hypot(this.velX, this.velY) > 12;
      const dx = moving ? this.velX / Math.hypot(this.velX, this.velY) : ilen > 0.08 ? ix : 1;
      const dy = moving ? this.velY / Math.hypot(this.velX, this.velY) : ilen > 0.08 ? iy : 0;
      this.velX = dx * PLAYER.dashSpeed;
      this.velY = dy * PLAYER.dashSpeed;
      this.spawnDashTrail();
    } else if (!dashing) {
      const maxSpeed = PLAYER.speed * this.slowFactor;
      const hasInput = Math.hypot(ix, iy) > 0.02;

      if (hasInput) {
        this.velX += ix * PLAYER.accel * dt;
        this.velY += iy * PLAYER.accel * dt;
        // Soft cap while thrusting
        const sp = Math.hypot(this.velX, this.velY);
        if (sp > maxSpeed) {
          const s = maxSpeed / sp;
          this.velX *= s;
          this.velY *= s;
        }
        // Gentle drag so direction changes feel moth-like
        const drag = Math.exp(-PLAYER.drag * dt);
        this.velX *= drag * 0.992 + 0.008;
        this.velY *= drag * 0.992 + 0.008;
      } else {
        // Glide to a soft stop — still floaty
        const drag = Math.exp(-PLAYER.releaseDrag * dt);
        this.velX *= drag;
        this.velY *= drag;
        if (Math.abs(this.velX) < 2) this.velX = 0;
        if (Math.abs(this.velY) < 2) this.velY = 0;
      }
    }

    // Hover bob when nearly idle
    this.hoverPhase += dt * Math.PI * 2 * PLAYER.hoverBobHz;
    const still = Math.hypot(this.velX, this.velY) < 28;
    const bob = still ? Math.sin(this.hoverPhase) * PLAYER.hoverBobAmp : Math.sin(this.hoverPhase) * 0.4;

    this.setVelocity(this.velX, this.velY + bob * 8);

    // clamp to world
    const pad = PLAYER.boundsPadding;
    this.x = Phaser.Math.Clamp(this.x, pad, 320 - pad);
    this.y = Phaser.Math.Clamp(this.y, pad, 180 - pad);
    if (this.x <= pad || this.x >= 320 - pad) this.velX *= 0.2;
    if (this.y <= pad || this.y >= 180 - pad) this.velY *= 0.2;

    // Bank / lean into turns
    const targetBank = Phaser.Math.Clamp(this.velY / PLAYER.speed, -1, 1) * PLAYER.bankAngle;
    this.setAngle(Phaser.Math.Linear(this.angle, targetBank, 0.18));

    // Wings flap faster when moving hard
    const speedRatio = Math.min(1, Math.hypot(this.velX, this.velY) / PLAYER.speed);
    const flapMs = Phaser.Math.Linear(95, 45, speedRatio);
    this.wingTimer += delta;
    if (this.wingTimer > flapMs) {
      this.wingTimer = 0;
      this.wingFrame = (this.wingFrame + 1) % 4;
    }

    if (this.combat.isDashing(now)) {
      this.setTexture('moth_dash');
      this.setAlpha(0.8);
      this.trailTimer += delta;
      if (this.trailTimer > 28) {
        this.trailTimer = 0;
        this.spawnDashTrail();
      }
    } else if (this.combat.isInvulnerable(now) && Math.floor(now / 80) % 2 === 0) {
      this.setTexture('moth_hurt');
      this.setAlpha(0.55);
    } else {
      this.setTexture(`moth_${this.wingFrame}`);
      this.setAlpha(1);
    }

    if (opts.hasShield) {
      this.setTint(0x69f0ae);
    } else if (!this.combat.isInvulnerable(now)) {
      this.clearTint();
    }

    const wantFire = this.firing || this.pointerFire || this.touchFire;
    if (wantFire && this.combat.canFire(now, opts.fireCooldownMs)) {
      this.combat.markFired(now, opts.fireCooldownMs);
      const angles = opts.hasSpread ? [-0.28, 0, 0.28] : [0];
      opts.fire(angles, opts.hasPierce);
    }

    this.ensureCompanion(opts.hasCompanion);
    if (this.companion) {
      this.companion.x = this.x - 16;
      this.companion.y = this.y + 14 + Math.sin(now / 200) * 3;
      if (opts.hasCompanion && now >= this.companionFireAt) {
        this.companionFireAt = now + 280;
        opts.fireCompanion?.();
      }
    }

    this.wantDash = false;
    this.touchDash = false;
  }

  private spawnDashTrail(): void {
    const ghost = this.scene.add
      .image(this.x, this.y, this.texture.key)
      .setDepth(28)
      .setAlpha(0.45)
      .setAngle(this.angle)
      .setTint(0x80deea);
    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      scale: 0.7,
      duration: 180,
      onComplete: () => ghost.destroy(),
    });
  }

  private readInput(): void {
    let x = 0;
    let y = 0;
    if (this.keys.left.isDown || this.keys.a.isDown) x -= 1;
    if (this.keys.right.isDown || this.keys.d.isDown) x += 1;
    if (this.keys.up.isDown || this.keys.w.isDown) y -= 1;
    if (this.keys.down.isDown || this.keys.s.isDown) y += 1;

    const tx = this.touchVec.x;
    const ty = this.touchVec.y;
    const tmag = Math.hypot(tx, ty);
    if (tmag > PLAYER.stickDeadzone) {
      // Prefer analog stick when active
      x = tx;
      y = ty;
    }

    this.moveX = x;
    this.moveY = y;
    this.firing = this.keys.space.isDown;
    if (Phaser.Input.Keyboard.JustDown(this.keys.shift) || this.touchDash) {
      this.wantDash = true;
    }
  }

  destroy(fromScene?: boolean): void {
    this.companion?.destroy();
    super.destroy(fromScene);
  }
}
