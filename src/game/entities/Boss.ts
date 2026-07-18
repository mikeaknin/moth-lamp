import Phaser from 'phaser';
import { BOSS, type BossId, type StageBossDef, STAGE_BOSSES } from '../data/enemies';

export type BossPattern = 'single' | 'fan' | 'spiral' | 'ring' | 'sweep';

/**
 * Stage bosses — hand-authored NES fights.
 * Briar (backyard mid), Neon (alley mid), Tyrant (final porch).
 */
export class Boss extends Phaser.Physics.Arcade.Sprite {
  hp = 100;
  maxHp = 100;
  alive = false;
  phase = 1;
  bossId: BossId = 'tyrant';
  isFinal = true;
  killScore = 5000;
  private texPrefix = 'boss_tyrant';
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
    super(scene, 280, 90, 'boss_tyrant_0');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setActive(false).setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;
  }

  spawn(def: StageBossDef, hpMult = 1): void {
    this.bossId = def.id;
    this.isFinal = def.final;
    this.killScore = def.score;
    this.texPrefix = def.tex;
    this.maxHp = Math.round(def.hp * hpMult);
    this.hp = this.maxHp;
    this.alive = true;
    this.phase = 1;
    this.intro = true;
    this.introTimer = BOSS.introHoldMs;
    this.aiState = 'intro';
    this.shootTimer = 600;
    this.setTexture(`${this.texPrefix}_0`);
    this.setPosition(360, 90);
    this.setActive(true).setVisible(true);
    this.setDepth(25);
    this.setAlpha(1);
    this.setScale(1);
    this.clearTint();
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.setAllowGravity(false);
    // Distinct hitboxes per silhouette
    if (def.id === 'briar') {
      body.setSize(36, 34);
      body.setOffset(14, 14);
    } else if (def.id === 'neon') {
      body.setSize(38, 30);
      body.setOffset(13, 16);
    } else {
      body.setSize(40, 32);
      body.setOffset(12, 12);
    }
    this.setVelocity(-55, 0);
  }

  /** Convenience for tests / legacy */
  spawnById(id: BossId, hpMult = 1): void {
    const def = STAGE_BOSSES.find((b) => b.id === id) ?? STAGE_BOSSES[2];
    this.spawn(def, hpMult);
  }

  get hpRatio(): number {
    return this.hp / Math.max(1, this.maxHp);
  }

  get isIntro(): boolean {
    return this.intro;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.alive) return;

    this.animTimer += delta;
    if (this.animTimer > 110) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 3;
      this.setTexture(`${this.texPrefix}_${this.animFrame}`);
    }

    if (this.invulnFlash > 0) this.invulnFlash -= delta;

    if (this.aiState === 'intro') {
      this.introTimer -= delta;
      if (this.x > 248) this.setVelocityX(-40);
      else this.setVelocityX(0);
      this.setScale(1 + Math.sin(this.introTimer * 0.01) * 0.03);
      if (this.introTimer <= 0) {
        this.setScale(1);
        this.aiState = 'idle';
        this.intro = false;
        this.onPhaseChange?.(1, this.phaseName(1));
      }
      return;
    }

    // Mid-bosses use 2 phases; final uses 3
    const maxPhase = this.isFinal ? 3 : 2;
    let newPhase = 1;
    if (maxPhase >= 3 && this.hpRatio <= 0.33) newPhase = 3;
    else if (this.hpRatio <= 0.55) newPhase = 2;
    if (newPhase !== this.phase && newPhase <= maxPhase) {
      this.phase = newPhase;
      this.onPhaseChange?.(newPhase, this.phaseName(newPhase));
      this.setTintFill(0xffffff);
      this.scene.time.delayedCall(140, () => this.clearTint());
      this.shootTimer = 360;
    }

    const moveAmp =
      this.bossId === 'briar' ? 22 + this.phase * 10 : this.bossId === 'neon' ? 36 + this.phase * 12 : 30 + this.phase * 12;
    const interval =
      this.bossId === 'briar'
        ? 900 - this.phase * 120
        : this.bossId === 'neon'
          ? 700 - this.phase * 100
          : 820 - this.phase * 140;

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

    const targetY = 90 + Math.sin(this.movePhase) * moveAmp;
    this.y = Phaser.Math.Linear(this.y, targetY, 0.06);
    const homeX = this.bossId === 'briar' ? 240 : 248;
    this.x = Phaser.Math.Linear(
      this.x,
      homeX + Math.sin(this.movePhase * 0.5) * (10 + this.phase * 4),
      0.04,
    );

    if (this.aiState === 'telegraph') {
      this.telegraphTimer -= delta;
      const pulse = 0.5 + Math.sin(this.telegraphTimer * 0.03) * 0.5;
      if (this.bossId === 'neon') {
        this.setTint(Phaser.Display.Color.GetColor(255, Math.floor(80 + pulse * 100), 200));
      } else if (this.bossId === 'briar') {
        this.setTint(Phaser.Display.Color.GetColor(180, Math.floor(120 + pulse * 60), 40));
      } else {
        this.setTint(Phaser.Display.Color.GetColor(255, Math.floor(140 + pulse * 80), 40));
      }
      if (this.telegraphTimer <= 0) {
        this.clearTint();
        if (this.pendingPattern === 'sweep' && this.phase >= 2) {
          this.aiState = 'charge';
          this.chargeDir = -1;
          this.onCharge?.(this.y);
        } else {
          this.onShoot?.(this.pendingPattern, this.phase);
          this.aiState = 'idle';
          this.shootTimer = interval;
        }
      }
      return;
    }

    this.shootTimer -= delta;
    if (this.shootTimer <= 0) {
      this.pendingPattern = this.pickPattern();
      this.aiState = 'telegraph';
      this.telegraphTimer = 280 + this.phase * 60;
    }
  }

  private phaseName(phase: number): string {
    if (this.bossId === 'briar') {
      return phase === 1 ? 'Root Lock' : 'Thorn Storm';
    }
    if (this.bossId === 'neon') {
      return phase === 1 ? 'Hype Mode' : 'Ratio Barrage';
    }
    return BOSS.phases[Math.min(phase, 3) - 1]?.name ?? `Phase ${phase}`;
  }

  private pickPattern(): BossPattern {
    if (this.bossId === 'briar') {
      // Heavy, slower patterns — beetle boss
      if (this.phase === 1) return Math.random() < 0.6 ? 'single' : 'fan';
      return Math.random() < 0.5 ? 'fan' : Math.random() < 0.7 ? 'ring' : 'sweep';
    }
    if (this.bossId === 'neon') {
      // Chatty bullet spam
      if (this.phase === 1) return Math.random() < 0.5 ? 'fan' : 'single';
      const r = Math.random();
      if (r < 0.35) return 'fan';
      if (r < 0.65) return 'ring';
      if (r < 0.85) return 'sweep';
      return 'spiral';
    }
    // Tyrant — classic 3-phase shmup
    if (this.phase === 1) return Math.random() < 0.55 ? 'single' : 'fan';
    if (this.phase === 2) {
      const r = Math.random();
      if (r < 0.35) return 'fan';
      if (r < 0.65) return 'ring';
      if (r < 0.85) return 'sweep';
      return 'single';
    }
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
