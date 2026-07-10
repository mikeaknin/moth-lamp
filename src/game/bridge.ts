import type { GameSettings, GameOutcome, HudSnapshot, RunStats } from './data/types';
import { DEFAULT_SETTINGS } from './data/types';

export type BridgeListener = {
  onHud?: (hud: HudSnapshot) => void;
  onOutcome?: (outcome: GameOutcome, stats: RunStats) => void;
  onReady?: () => void;
  onSection?: (name: string) => void;
};

/**
 * Thin message bus between React shell and Phaser game.
 * Avoids React re-renders from high-frequency Phaser updates by
 * letting React subscribe selectively.
 */
class GameBridge {
  private listeners = new Set<BridgeListener>();
  settings: GameSettings = { ...DEFAULT_SETTINGS };
  private startRequested = false;
  private tutorialMode = false;
  touch = {
    vecX: 0,
    vecY: 0,
    fire: false,
    dash: false,
    pause: false,
  };
  commands: Array<'pause' | 'resume' | 'restart' | 'quit'> = [];

  subscribe(listener: BridgeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emitHud(hud: HudSnapshot): void {
    for (const l of this.listeners) l.onHud?.(hud);
  }

  emitOutcome(outcome: GameOutcome, stats: RunStats): void {
    for (const l of this.listeners) l.onOutcome?.(outcome, stats);
  }

  emitReady(): void {
    for (const l of this.listeners) l.onReady?.();
  }

  emitSection(name: string): void {
    for (const l of this.listeners) l.onSection?.(name);
  }

  updateSettings(partial: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...partial };
  }

  requestStart(opts?: { tutorial?: boolean }): void {
    this.tutorialMode = !!opts?.tutorial;
    this.startRequested = true;
    this.commands.push('restart');
  }

  consumeStart(): { start: boolean; tutorial: boolean } {
    if (!this.startRequested) return { start: false, tutorial: false };
    this.startRequested = false;
    const tutorial = this.tutorialMode;
    this.tutorialMode = false;
    return { start: true, tutorial };
  }

  pause(): void {
    this.commands.push('pause');
  }

  resume(): void {
    this.commands.push('resume');
  }

  restart(): void {
    this.commands.push('restart');
  }

  quit(): void {
    this.commands.push('quit');
  }

  drainCommands(): Array<'pause' | 'resume' | 'restart' | 'quit'> {
    const c = this.commands.slice();
    this.commands.length = 0;
    return c;
  }

  setTouch(partial: Partial<typeof this.touch>): void {
    Object.assign(this.touch, partial);
  }
}

export const gameBridge = new GameBridge();
