import {
  DEFAULT_SETTINGS,
  type GameSettings,
  type HighScoreEntry,
} from '../data/types';

const SETTINGS_KEY = 'mothlight_settings_v1';
const SCORES_KEY = 'mothlight_scores_v1';
const TUTORIAL_KEY = 'mothlight_tutorial_done_v1';
const PROFILE_KEY = 'mothlight_profile_v1';

const MAX_SCORES = 10;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function loadSettings(): GameSettings {
  const parsed = safeParse<Partial<GameSettings>>(localStorage.getItem(SETTINGS_KEY), {});
  return {
    ...DEFAULT_SETTINGS,
    ...parsed,
    musicVolume: clamp01(parsed.musicVolume ?? DEFAULT_SETTINGS.musicVolume),
    sfxVolume: clamp01(parsed.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume),
  };
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Quota / private mode — fail silently
  }
}

export function loadHighScores(): HighScoreEntry[] {
  const list = safeParse<HighScoreEntry[]>(localStorage.getItem(SCORES_KEY), []);
  if (!Array.isArray(list)) return [];
  return list
    .filter((e) => e && typeof e.score === 'number')
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SCORES);
}

export function submitHighScore(entry: HighScoreEntry): HighScoreEntry[] {
  const next = [...loadHighScores(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SCORES);
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function isTutorialDone(): boolean {
  return localStorage.getItem(TUTORIAL_KEY) === '1';
}

export function setTutorialDone(done = true): void {
  try {
    localStorage.setItem(TUTORIAL_KEY, done ? '1' : '0');
  } catch {
    // ignore
  }
}

export interface LocalProfile {
  displayName: string;
  address?: string;
  linkedAt?: string;
  wins: number;
  runs: number;
  bestScore: number;
}

export function loadProfile(): LocalProfile {
  return safeParse<LocalProfile>(localStorage.getItem(PROFILE_KEY), {
    displayName: 'Anonymous Moth',
    wins: 0,
    runs: 0,
    bestScore: 0,
  });
}

export function saveProfile(profile: LocalProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function recordRun(score: number, won: boolean): LocalProfile {
  const p = loadProfile();
  p.runs += 1;
  if (won) p.wins += 1;
  p.bestScore = Math.max(p.bestScore, score);
  saveProfile(p);
  return p;
}

/** Pure helpers for unit tests */
export function clampVolume(n: number): number {
  return clamp01(n);
}

export function mergeHighScores(
  existing: HighScoreEntry[],
  entry: HighScoreEntry,
  max = MAX_SCORES,
): HighScoreEntry[] {
  return [...existing, entry].sort((a, b) => b.score - a.score).slice(0, max);
}

export function recoverSettings(raw: unknown): GameSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
  const o = raw as Partial<GameSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...o,
    musicVolume: clamp01(typeof o.musicVolume === 'number' ? o.musicVolume : DEFAULT_SETTINGS.musicVolume),
    sfxVolume: clamp01(typeof o.sfxVolume === 'number' ? o.sfxVolume : DEFAULT_SETTINGS.sfxVolume),
    screenShake: o.screenShake ?? DEFAULT_SETTINGS.screenShake,
    reducedFlash: o.reducedFlash ?? DEFAULT_SETTINGS.reducedFlash,
    lowEffects: o.lowEffects ?? DEFAULT_SETTINGS.lowEffects,
    crtFilter: o.crtFilter ?? DEFAULT_SETTINGS.crtFilter,
    difficulty: o.difficulty ?? DEFAULT_SETTINGS.difficulty,
    showFps: o.showFps ?? DEFAULT_SETTINGS.showFps,
    touchLeftHanded: o.touchLeftHanded ?? DEFAULT_SETTINGS.touchLeftHanded,
  };
}
