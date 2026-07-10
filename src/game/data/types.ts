import type { DifficultyId } from './balance';
import type { EnemyKind } from './enemies';
import type { PowerUpKind } from './powerups';

export type GameScreen =
  | 'loading'
  | 'title'
  | 'tutorial'
  | 'settings'
  | 'leaderboard'
  | 'profile'
  | 'playing'
  | 'paused'
  | 'gameover'
  | 'victory'
  | 'privacy'
  | 'terms'
  | 'credits'
  | 'controls';

export type GameOutcome = 'playing' | 'victory' | 'gameover_hp' | 'gameover_lamp';

export interface RunStats {
  score: number;
  maxCombo: number;
  enemiesDestroyed: number;
  damageTaken: number;
  lampRemaining: number;
  completionTimeSec: number;
  powerupsCollected: number;
  bossDefeated: boolean;
  difficulty: DifficultyId;
  medal: 'S' | 'A' | 'B' | 'C';
}

export interface ActivePowerUp {
  kind: Exclude<PowerUpKind, 'lampRefill'>;
  expiresAt: number;
}

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  lampLife: number;
  maxLampLife: number;
  score: number;
  combo: number;
  dashCooldownRatio: number;
  sectionName: string;
  powerups: ActivePowerUp[];
  bossHpRatio: number | null;
  lampWarning: boolean;
  paused: boolean;
  outcome: GameOutcome;
  elapsedSec: number;
}

export interface HighScoreEntry {
  score: number;
  medal: string;
  difficulty: DifficultyId;
  date: string;
  timeSec: number;
  enemies: number;
  name?: string;
  address?: string;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  screenShake: boolean;
  reducedFlash: boolean;
  lowEffects: boolean;
  crtFilter: boolean;
  difficulty: DifficultyId;
  showFps: boolean;
  touchLeftHanded: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.55,
  sfxVolume: 0.7,
  screenShake: true,
  reducedFlash: false,
  lowEffects: false,
  crtFilter: false,
  difficulty: 'normal',
  showFps: false,
  touchLeftHanded: false,
};

export interface BridgeEvents {
  onHud: (hud: HudSnapshot) => void;
  onOutcome: (outcome: GameOutcome, stats: RunStats) => void;
  onReady: () => void;
  onSection: (name: string) => void;
  requestPause: () => void;
  requestResume: () => void;
  requestRestart: () => void;
  requestQuit: () => void;
}

export type { EnemyKind, PowerUpKind, DifficultyId };
