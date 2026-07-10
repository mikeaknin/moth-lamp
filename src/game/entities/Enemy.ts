import Phaser from 'phaser';
import { ENEMY_DEFS, type EnemyKind, HECKLER_BUBBLES } from '../data/enemies';

export type EnemyState = 'enter' | 'active' | 'telegraph' | 'attack' | 'dying';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  kind: EnemyKind = 'gnat';
  hp = 1;
  maxHp = 1;
  scoreValue = 100;
  contactDamage = 1;
  aiState: EnemyState = 'enter';
  alive = false;
  isLeech = false;
  private animTimer = 0;
  private animFrame = 0;
  private aiTimer = 0;
  private telegraphTimer = 0;
  private baseY = 0;
  private movePhase = 0;
  private speed = 50;
  onShoot?: (enemy: Enemy, pattern: string) => void;
  onWeb?: (x: number, y: number) => void;
  onDeath?: (enemy: Enemy) => void;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'enemy_gnat_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false).setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
  }

  spawn(kind: EnemyKind, x: number, y: number, speedMult = 1, hpMult = 1): void {
    const def = ENEMY_DEFS[kind];
    this.kind = kind;
    this.maxHp = Math.max(1, Math.round(def.hp * hpMult));
    this.hp = this.maxHp;
    this.scoreValue = def.score;
    this.contactDamage = def.contactDamage;
    this.speed = def.speed * speedMult;
    this.isLeech = kind === 'lampLeech';
    this.aiState = 'enter';
    this.alive = true;
    this.baseY = y;
    this.movePhase = Math.random() * Math.PI * 2;
    this.aiTimer = 400 + Math.random() * 600;
    this.telegraphTimer = 0;
    this.setTexture(`enemy_${kind}_0`);
    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
    this.setDepth(15);
    this.setAlpha(1);
    this.clearTint();
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setAllowGravity(false);
    body.setSize(def.hitboxRadius * 2, def.hitboxRadius * 2);
    body.setOffset((this.width - def.hitboxRadius * 2) / 2, (this.height - def.hitboxRadius * 2) / 2);
    this.setVelocity(-this.speed, 0);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.alive) return;

    this.animTimer += delta;
    if (this.animTimer > 120) {
      this.animTimer = 0;
      this.animFrame = 1 - this.animFrame;
      if (this.kind !== 'boss') {
        this.setTexture(`enemy_${this.kind}_${this.animFrame}`);
      }
    }

    this.movePhase += delta * 0.004;
    this.aiTimer -= delta;

    switch (this.kind) {
      case 'gnat':
        this.setVelocity(-this.speed, Math.sin(this.movePhase * 2) * 20);
        break;
      case 'mosquito':
        this.aiMosquito(delta);
        break;
      case 'beetle':
        this.setVelocity(-this.speed * 0.7, Math.sin(this.movePhase) * 10);
        break;
      case 'heckler':
        this.aiRanged(delta, 'heckler');
        break;
      case 'doomWasp':
        this.aiRanged(delta, 'fan');
        break;
      case 'webSpinner':
        this.aiWeb(delta);
        break;
      case 'lampLeech':
        this.setVelocity(-this.speed * 0.8, Math.sin(this.movePhase * 1.5) * 30);
        break;
      default:
        break;
    }

    if (this.x < -30 || this.y < -40 || this.y > 220) {
      this.kill(false);
    }
  }

  private aiMosquito(delta: number): void {
    if (this.aiState === 'telegraph') {
      this.telegraphTimer -= delta;
      this.setTint(0xffcccc);
      this.setVelocity(-this.speed * 0.2, 0);
      if (this.telegraphTimer <= 0) {
        this.aiState = 'attack';
        this.clearTint();
        // dive toward left-center
        const angle = Phaser.Math.Angle.Between(this.x, this.y, 60, this.baseY + (Math.random() - 0.5) * 40);
        this.setVelocity(Math.cos(angle) * this.speed * 2.2, Math.sin(angle) * this.speed * 2.2);
        this.aiTimer = 800;
      }
      return;
    }
    if (this.aiState === 'attack') {
      this.aiTimer -= delta;
      if (this.aiTimer <= 0) {
        this.aiState = 'active';
        this.setVelocity(-this.speed, 0);
        this.aiTimer = 1200;
      }
      return;
    }
    this.setVelocity(-this.speed, Math.sin(this.movePhase) * 15);
    if (this.aiTimer <= 0 && this.x < 300 && this.x > 100) {
      this.aiState = 'telegraph';
      this.telegraphTimer = ENEMY_DEFS.mosquito.telegraphMs;
      this.aiTimer = 9999;
    }
  }

  private aiRanged(delta: number, pattern: string): void {
    this.setVelocity(-this.speed * 0.5, Math.sin(this.movePhase) * 25);
    // hover band
    if (this.x < 260) this.setVelocityX(Math.min(0, this.body!.velocity.x + 5));
    if (this.x < 200) this.setVelocityX(10);

    if (this.aiState === 'telegraph') {
      this.telegraphTimer -= delta;
      this.setTint(0xffe082);
      if (this.telegraphTimer <= 0) {
        this.clearTint();
        this.aiState = 'active';
        this.onShoot?.(this, pattern);
        this.aiTimer = pattern === 'heckler' ? 1400 : 1100;
      }
      return;
    }

    if (this.aiTimer <= 0 && this.x < 300) {
      this.aiState = 'telegraph';
      this.telegraphTimer = ENEMY_DEFS[this.kind].telegraphMs || 350;
    }
  }

  private aiWeb(_delta: number): void {
    this.setVelocity(-this.speed * 0.4, Math.sin(this.movePhase * 0.8) * 12);
    if (this.x < 250) this.setVelocityX(Math.max(this.body!.velocity.x, -5));
    if (this.aiTimer <= 0 && this.x < 280) {
      this.onWeb?.(this.x - 10, this.y);
      this.aiTimer = 2200;
    }
  }

  hit(damage: number): boolean {
    if (!this.alive) return false;
    this.hp -= damage;
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.alive) this.clearTint();
    });
    if (this.hp <= 0) {
      this.kill(true);
      return true;
    }
    return false;
  }

  kill(award: boolean): void {
    if (!this.alive) return;
    this.alive = false;
    if (award) this.onDeath?.(this);
    this.setActive(false).setVisible(false);
    this.setVelocity(0, 0);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
  }

  static randomHecklerText(): string {
    return HECKLER_BUBBLES[Math.floor(Math.random() * HECKLER_BUBBLES.length)];
  }
}
