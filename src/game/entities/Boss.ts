import Phaser from 'phaser';
import { BOSS, ENEMY_DEFS } from '../data/enemies';

export type BossPattern = 'single' | 'fan' | 'spiral' | 'ring' | 'sweep';

/**
 * Porchlight Tyrant — three readable phases, telegraphs, fair patterns.
 */
export class Boss extends Phaser.Physics.Arcade.Sprite {
  hp = ENEMY_DEFS.boss.hp;
  maxHp = ENEMY_DEFS.boss.hp;
  alive = false;
  phase = 1;
  private intro = true;
  private introTimer = BOSS.introHoldMs;
  private shootTimer = 0;
  private telegraphTimer = 0;
  private aiState: 'intro' | 'telegraph' | 'fire' | 'idle' | 'charge' = 'intro';
  private movePhase = 0;
  private animFrame = 0;
  private animTimer = 0;
  private pendingPattern: BossPattern = 'single';
  private chargeDir = 0;
  private invulnFlash = 0;
  onShoot?: (pattern: BossPattern, phase: number) => void;
  onPhaseChange?: (phase: number, name: string) => void;
  onDefeated?: () => void;
  onCharge?: (y: number) => void;

  constructor(scene: Phaser.Scene) {
    super(scene, 280, 90, 'boss_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false).setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
  }

  spawn(hpMult = 1): void {
    this.maxHp = Math.round((ENEMY_DEFS.boss.hp + BOSS.hpBonus) * hpMult);
    this.hp = this.maxHp;
    this.alive = true;
    this.phase = 1;
    this.intro = true;
    this.introTimer = BOSS.introHoldMs;
    this.aiState = 'intro';
    this.shootTimer = 600;
    this.setPosition(360, 90);
    this.setActive(true).setVisible(true);
    this.setDepth(25);
    this.setAlpha(1);
    this.setScale(1);
    this.clearTint();
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setAllowGravity(false);
    body.setSize(40, 32);
    body.setOffset(12, 12);
    this.setVelocity(-55, 0);
  }

  get hpRatio(): number {
    return this.hp / this.maxHp;
  }

  get isIntro(): boolean {
    return this.intro;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.alive) return;

    this.animTimer += delta;
    if (this.animTimer > 120) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 3;
      this.setTexture(`boss_${this.animFrame}`);
    }

    if (this.invulnFlash > 0) this.invulnFlash -= delta;

    if (this.aiState === 'intro') {
      this.introTimer -= delta;
      if (this.x > 248) this.setVelocityX(-40);
      else this.setVelocityX(0);
      // dramatic scale pulse on entrance
      this.setScale(1 + Math.sin(this.introTimer * 0.01) * 0.03);
      if (this.introTimer <= 0) {
        this.setScale(1);
        this.aiState = 'idle';
        this.intro = false;
        this.onPhaseChange?.(1, BOSS.phases[0].name);
      }
      return;
    }

    // phase transitions
    const ratio = this.hpRatio;
    let newPhase = 1;
    if (ratio <= BOSS.phases[2].hpRatio) newPhase = 3;
    else if (ratio <= BOSS.phases[1].hpRatio) newPhase = 2;
    if (newPhase !== this.phase) {
      this.phase = newPhase;
      this.onPhaseChange?.(newPhase, BOSS.phases[newPhase - 1].name);
      this.setTintFill(0xffffff);
      this.scene.time.delayedCall(140, () => this.clearTint());
      this.shootTimer = 400;
    }

    const phaseDef = BOSS.phases[this.phase - 1];
    this.movePhase += delta * 0.0022 * (1 + this.phase * 0.25);

    if (this.aiState === 'charge') {
      this.x += this.chargeDir * delta * 0.22;
      if (this.x < 80 || this.x > 280) {
        this.chargeDir *= -1;
        this.aiState = 'idle';
        this.x = Phaser.Math.Clamp(this.x, 90, 270);
        this.shootTimer = 700;
      }
      return;
    }

    const targetY = 90 + Math.sin(this.movePhase) * phaseDef.moveAmp;
    this.y = Phaser.Math.Linear(this.y, targetY, 0.06);
    this.x = Phaser.Math.Linear(this.x, 248 + Math.sin(this.movePhase * 0.5) * (10 + this.phase * 4), 0.04);

    if (this.aiState === 'telegraph') {
      this.telegraphTimer -= delta;
      // pulse telegraph
      const pulse = 0.5 + Math.sin(this.telegraphTimer * 0.03) * 0.5;
      this.setTint(Phaser.Display.Color.GetColor(255, Math.floor(140 + pulse * 80), 40));
      if (this.telegraphTimer <= 0) {
        this.clearTint();
        if (this.pendingPattern === 'sweep' && this.phase >= 2) {
          this.aiState = 'charge';
          this.chargeDir = -1;
          this.onCharge?.(this.y);
        } else {
          this.onShoot?.(this.pendingPattern, this.phase);
          this.aiState = 'idle';
          this.shootTimer = phaseDef.bulletIntervalMs;
        }
      }
      return;
    }

    this.shootTimer -= delta;
    if (this.shootTimer <= 0) {
      this.pendingPattern = this.pickPattern();
      this.aiState = 'telegraph';
      this.telegraphTimer = 320 + this.phase * 70;
    }
  }

  private pickPattern(): BossPattern {
    if (this.phase === 1) return Math.random() < 0.55 ? 'single' : 'fan';
    if (this.phase === 2) {
      const r = Math.random();
      if (r < 0.35) return 'fan';
      if (r < 0.65) return 'ring';
      if (r < 0.85) return 'sweep';
      return 'single';
    }
    // phase 3
    const r = Math.random();
    if (r < 0.3) return 'spiral';
    if (r < 0.55) return 'ring';
    if (r < 0.75) return 'fan';
    if (r < 0.9) return 'sweep';
    return 'single';
  }

  hit(damage: number): boolean {
    if (!this.alive || this.intro) return false;
    this.hp -= damage;
    this.setTintFill(0xffffff);
    this.invulnFlash = 50;
    this.scene.time.delayedCall(45, () => {
      if (this.alive && this.aiState !== 'telegraph') this.clearTint();
    });
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.setActive(false).setVisible(false);
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.enable = false;
      this.onDefeated?.();
      return true;
    }
    return false;
  }
}
