import Phaser from 'phaser';
import { gameBridge } from '../bridge';

/**
 * Combat juice — floating numbers, hitstop, muzzle flash, camera punch.
 * Low-effects / reduced-flash settings are respected.
 */
export class Juice {
  private scene: Phaser.Scene;
  private hitstopLeft = 0;
  private floatPool: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Returns true while time is frozen for a few frames */
  isHitstopping(): boolean {
    return this.hitstopLeft > 0;
  }

  update(delta: number): void {
    if (this.hitstopLeft > 0) {
      this.hitstopLeft = Math.max(0, this.hitstopLeft - delta);
    }
  }

  hitstop(ms = 40): void {
    if (gameBridge.settings.lowEffects) return;
    this.hitstopLeft = Math.max(this.hitstopLeft, ms);
  }

  floatText(x: number, y: number, text: string, color = '#fff176'): void {
    if (gameBridge.settings.lowEffects && Math.random() > 0.4) return;
    let t = this.floatPool.pop();
    if (!t) {
      t = this.scene.add
        .text(x, y, text, {
          fontFamily: 'monospace',
          fontSize: '8px',
          color,
          stroke: '#0a0618',
          strokeThickness: 2,
        })
        .setDepth(80)
        .setOrigin(0.5);
    } else {
      t.setText(text).setColor(color).setPosition(x, y).setAlpha(1).setVisible(true).setActive(true);
    }
    const label = t;
    this.scene.tweens.add({
      targets: label,
      y: y - 18,
      alpha: 0,
      duration: 450,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        label.setVisible(false).setActive(false);
        this.floatPool.push(label);
      },
    });
  }

  muzzleFlash(x: number, y: number): void {
    if (gameBridge.settings.lowEffects) return;
    const g = this.scene.add.image(x, y, 'spark').setDepth(45).setScale(1.4);
    this.scene.tweens.add({
      targets: g,
      alpha: 0,
      scale: 0.3,
      duration: 80,
      onComplete: () => g.destroy(),
    });
  }

  shake(intensity = 0.006, duration = 80): void {
    if (!gameBridge.settings.screenShake || gameBridge.settings.reducedFlash) return;
    const i = gameBridge.settings.lowEffects ? intensity * 0.4 : intensity;
    this.scene.cameras.main.shake(duration, i);
  }

  flash(r = 40, g = 0, b = 0, duration = 60): void {
    if (gameBridge.settings.reducedFlash || gameBridge.settings.lowEffects) return;
    this.scene.cameras.main.flash(duration, r, g, b, false);
  }

  ringBurst(x: number, y: number, color = 0xfff176): void {
    if (gameBridge.settings.lowEffects) return;
    const ring = this.scene.add.circle(x, y, 2, color, 0.7).setDepth(42).setStrokeStyle(1, color, 1);
    this.scene.tweens.add({
      targets: ring,
      radius: 22,
      alpha: 0,
      duration: 280,
      onComplete: () => ring.destroy(),
    });
  }

  destroy(): void {
    for (const t of this.floatPool) t.destroy();
    this.floatPool = [];
  }
}
