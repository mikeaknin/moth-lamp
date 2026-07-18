import { useEffect, useState, useCallback, type ReactNode } from 'react';
import type { GameSettings, GameScreen, HighScoreEntry, RunStats } from '../game/data/types';
import { DIFFICULTIES, type DifficultyId } from '../game/data/balance';
import { OptionalWallet } from '../base/OptionalWallet';

interface ScreenProps {
  screen: GameScreen;
  settings: GameSettings;
  onSettings: (s: GameSettings) => void;
  onNavigate: (s: GameScreen) => void;
  onPlay: (tutorial?: boolean) => void;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  scores: HighScoreEntry[];
  lastStats: RunStats | null;
  lastOutcome: string | null;
  loadProgress: number;
}

/** Shared NES dialogue frame used by every non-title screen */
function NesBox({
  title,
  children,
  wide,
  variant = 'default',
}: {
  title: string;
  children: ReactNode;
  wide?: boolean;
  /** gameover / victory get stronger framed plates */
  variant?: 'default' | 'gameover' | 'victory' | 'pause';
}) {
  return (
    <div
      className={`nes-box${wide ? ' nes-box-wide' : ''} nes-box-${variant}`}
      role="dialog"
      aria-label={title}
    >
      <div className="nes-box-frame" aria-hidden />
      <div className="nes-box-title pixel-text">
        <span className="nes-box-title-inner">{title}</span>
      </div>
      <div className="nes-box-body stack">{children}</div>
      <div className="nes-box-corners" aria-hidden>
        <i className="c tl" />
        <i className="c tr" />
        <i className="c bl" />
        <i className="c br" />
      </div>
    </div>
  );
}

function NesBtn({
  children,
  onClick,
  variant = 'default',
  testId,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'accent' | 'danger' | 'ghost';
  testId?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`nes-btn nes-btn-${variant} pixel-text`}
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function NesToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="nes-toggle pixel-text"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span className="nes-toggle-label">{label}</span>
      <span className={`nes-toggle-box${checked ? ' on' : ''}`}>{checked ? 'ON' : 'OFF'}</span>
    </button>
  );
}

export function Screens(props: ScreenProps) {
  const { screen } = props;
  if (screen === 'playing') return null;

  const isTitle = screen === 'title' || screen === 'loading';

  return (
    <div
      className={`overlay${isTitle ? ' overlay-intro' : ' overlay-nes'}`}
      data-testid={`screen-${screen}`}
    >
      {!isTitle && <div className="nes-dim" aria-hidden />}
      {screen === 'loading' && <Loading progress={props.loadProgress} />}
      {screen === 'title' && <Title {...props} />}
      {screen === 'tutorial' && <Tutorial {...props} />}
      {screen === 'controls' && <Controls {...props} />}
      {screen === 'settings' && <SettingsPanel {...props} />}
      {screen === 'leaderboard' && <Leaderboard {...props} />}
      {screen === 'profile' && <Profile {...props} />}
      {screen === 'paused' && <Paused {...props} />}
      {screen === 'gameover' && <Results {...props} won={false} />}
      {screen === 'victory' && <Results {...props} won={true} />}
      {screen === 'privacy' && (
        <Legal title="PRIVACY" body={PRIVACY} onBack={() => props.onNavigate('title')} />
      )}
      {screen === 'terms' && (
        <Legal title="TERMS" body={TERMS} onBack={() => props.onNavigate('title')} />
      )}
      {screen === 'credits' && <Credits {...props} />}
    </div>
  );
}

function Loading({ progress }: { progress: number }) {
  return (
    <div className="intro-stage">
      <IntroBackdrop />
      <div className="intro-center stack">
        <img
          className="intro-logo"
          src="/assets/sprites/title_logo.png"
          alt="MOTH//LAMP"
          width={320}
          height={80}
          draggable={false}
        />
        <p className="intro-sub pixel-text">NOW LOADING…</p>
        <div className="loading-bar nes-bar" aria-label="Loading">
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="intro-copy pixel-text">{progress}%</p>
      </div>
      <div className="intro-scanlines" aria-hidden />
    </div>
  );
}

function IntroBackdrop() {
  return (
    <div className="intro-bg" aria-hidden>
      <div className="intro-stars" />
      <div className="intro-stars intro-stars-2" />
      <img className="intro-moon" src="/assets/sprites/moon.png" alt="" draggable={false} />
      <div className="intro-hills" />
      <div className="intro-trees" />
      <img className="intro-lamp" src="/assets/sprites/porch_lamp.png" alt="" draggable={false} />
      <div className="intro-lamp-glow" />
      <div className="intro-ground" />
    </div>
  );
}

function Title(props: ScreenProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const { onPlay, onNavigate } = props;

  const openMenu = useCallback(() => setMenuOpen(true), []);

  const runMenu = useCallback(
    (index: number) => {
      switch (index) {
        case 0:
          onPlay(false);
          break;
        case 1:
          onPlay(true);
          break;
        case 2:
          onNavigate('controls');
          break;
        case 3:
          onNavigate('settings');
          break;
        case 4:
          onNavigate('leaderboard');
          break;
        case 5:
          onNavigate('credits');
          break;
        default:
          break;
      }
    },
    [onPlay, onNavigate],
  );

  const menuItems: { label: string; testId?: string }[] = [
    { label: 'START GAME', testId: 'btn-play' },
    { label: 'TUTORIAL' },
    { label: 'CONTROLS' },
    { label: 'SETTINGS' },
    { label: 'HIGH SCORES' },
    { label: 'CREDITS' },
  ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!menuOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          openMenu();
        }
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setCursor((c) => (c + 1) % menuItems.length);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setCursor((c) => (c - 1 + menuItems.length) % menuItems.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        runMenu(cursor);
      } else if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen, cursor, openMenu, runMenu, menuItems.length]);

  return (
    <div className="intro-stage">
      <IntroBackdrop />

      <div className="intro-center">
        <img
          className="intro-logo"
          src="/assets/sprites/title_logo.png"
          alt="MOTH//LAMP"
          width={320}
          height={80}
          draggable={false}
        />
        <p className="intro-tagline pixel-text">RACE THE DARK · FEED THE LAMP</p>

        <div className="intro-hero" aria-hidden>
          <div className="intro-moth" />
        </div>

        {!menuOpen ? (
          <button
            type="button"
            className="press-start pixel-text"
            data-testid="btn-press-start"
            onClick={openMenu}
          >
            PRESS START
          </button>
        ) : (
          <nav className="intro-menu nes-box" aria-label="Main menu">
            {menuItems.map((item, i) => (
              <button
                key={item.label}
                type="button"
                className={`intro-menu-item pixel-text${i === cursor ? ' is-active' : ''}`}
                data-testid={item.testId}
                onMouseEnter={() => setCursor(i)}
                onClick={() => runMenu(i)}
              >
                <span className="menu-cursor" aria-hidden>
                  {i === cursor ? '▶' : ' '}
                </span>
                {item.label}
              </button>
            ))}
          </nav>
        )}

        <p className="intro-hint pixel-text">
          {menuOpen ? '↑↓ SELECT  ·  ENTER CONFIRM' : 'ENTER / TAP'}
        </p>
      </div>

      <footer className="intro-footer pixel-text">
        <span>© 2026 MOTH//LAMP</span>
        <span className="intro-footer-links">
          <button type="button" className="linkish" onClick={() => onNavigate('profile')}>
            PROFILE
          </button>
          <button type="button" className="linkish" onClick={() => onNavigate('privacy')}>
            PRIVACY
          </button>
          <button type="button" className="linkish" onClick={() => onNavigate('terms')}>
            TERMS
          </button>
        </span>
      </footer>

      <div className="intro-scanlines" aria-hidden />
      <div className="intro-vignette" aria-hidden />
    </div>
  );
}

function Tutorial(props: ScreenProps) {
  return (
    <NesBox title="HOW TO PLAY">
      <p className="nes-text">
        THE PORCH LAMP IS DYING. FLY THROUGH 3 ZONES, COLLECT GLOW, BLAST HECKLER-BUGS, AND DEFEAT
        THE PORCHLIGHT TYRANT.
      </p>
      <ul className="nes-list">
        <li>MOVE 8 WAYS</li>
        <li>SHOOT LIGHT BOLTS</li>
        <li>DASH = I-FRAMES</li>
        <li>GLOW FEEDS LAMP</li>
        <li>KILL LEECHES FIRST</li>
      </ul>
      <NesBtn variant="accent" onClick={() => props.onPlay(true)}>
        ▶ TUTORIAL
      </NesBtn>
      <NesBtn onClick={() => props.onNavigate('title')}>◀ BACK</NesBtn>
    </NesBox>
  );
}

function Controls(props: ScreenProps) {
  return (
    <NesBox title="CONTROLS">
      <div className="nes-text-block">
        <p className="nes-label">DESKTOP</p>
        <p className="nes-text">WASD / ARROWS — MOVE</p>
        <p className="nes-text">SPACE / LMB — FIRE</p>
        <p className="nes-text">SHIFT — DASH</p>
        <p className="nes-text">ESC — PAUSE</p>
      </div>
      <div className="nes-text-block">
        <p className="nes-label">MOBILE</p>
        <p className="nes-text">STICK — STEER</p>
        <p className="nes-text">FIRE / DASH BTNS</p>
      </div>
      <p className="nes-text dim">LANDSCAPE RECOMMENDED</p>
      <NesBtn onClick={() => props.onNavigate('title')}>◀ BACK</NesBtn>
    </NesBox>
  );
}

function SettingsPanel(props: ScreenProps) {
  const s = props.settings;
  const set = (partial: Partial<GameSettings>) => props.onSettings({ ...s, ...partial });

  return (
    <NesBox title="SETTINGS" wide>
      <div className="field nes-field">
        <label htmlFor="music" className="pixel-text nes-label">
          MUSIC {Math.round(s.musicVolume * 100)}
        </label>
        <input
          id="music"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={s.musicVolume}
          onChange={(e) => set({ musicVolume: Number(e.target.value) })}
        />
      </div>
      <div className="field nes-field">
        <label htmlFor="sfx" className="pixel-text nes-label">
          SFX {Math.round(s.sfxVolume * 100)}
        </label>
        <input
          id="sfx"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={s.sfxVolume}
          onChange={(e) => set({ sfxVolume: Number(e.target.value) })}
        />
      </div>
      <div className="field nes-field">
        <label htmlFor="diff" className="pixel-text nes-label">
          DIFFICULTY
        </label>
        <select
          id="diff"
          className="nes-select pixel-text"
          value={s.difficulty}
          onChange={(e) => set({ difficulty: e.target.value as DifficultyId })}
        >
          {(Object.keys(DIFFICULTIES) as DifficultyId[]).map((id) => (
            <option key={id} value={id}>
              {DIFFICULTIES[id].label.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      <NesToggle label="SHAKE" checked={s.screenShake} onChange={(v) => set({ screenShake: v })} />
      <NesToggle
        label="LOW FLASH"
        checked={s.reducedFlash}
        onChange={(v) => set({ reducedFlash: v })}
      />
      <NesToggle label="LOW FX" checked={s.lowEffects} onChange={(v) => set({ lowEffects: v })} />
      <NesToggle label="CRT" checked={s.crtFilter} onChange={(v) => set({ crtFilter: v })} />
      <NesToggle
        label="LEFT HAND"
        checked={s.touchLeftHanded}
        onChange={(v) => set({ touchLeftHanded: v })}
      />
      <NesBtn onClick={() => props.onNavigate('title')}>◀ BACK</NesBtn>
    </NesBox>
  );
}

function Leaderboard(props: ScreenProps) {
  return (
    <NesBox title="HIGH SCORES">
      {props.scores.length === 0 ? (
        <p className="nes-text dim">NO SCORES YET…</p>
      ) : (
        <table className="score-table nes-table pixel-text">
          <thead>
            <tr>
              <th>#</th>
              <th>SCORE</th>
              <th>MEDAL</th>
              <th>DIFF</th>
            </tr>
          </thead>
          <tbody>
            {props.scores.map((e, i) => (
              <tr key={`${e.date}-${e.score}-${i}`}>
                <td>{i + 1}</td>
                <td>{e.score}</td>
                <td>{e.medal}</td>
                <td>{String(e.difficulty).slice(0, 4).toUpperCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <NesBtn onClick={() => props.onNavigate('title')}>◀ BACK</NesBtn>
    </NesBox>
  );
}

function Profile(props: ScreenProps) {
  return (
    <NesBox title="PROFILE">
      <p className="nes-text dim">OPTIONAL — GAME WORKS OFFLINE</p>
      <div className="nes-wallet-wrap">
        <OptionalWallet />
      </div>
      <NesBtn onClick={() => props.onNavigate('title')}>◀ BACK</NesBtn>
    </NesBox>
  );
}

function Paused(props: ScreenProps) {
  return (
    <NesBox title="PAUSED" variant="pause">
      <p className="nes-text dim">LAMP STILL BURNING…</p>
      <NesBtn variant="accent" testId="btn-resume" onClick={props.onResume}>
        ▶ RESUME
      </NesBtn>
      <NesBtn onClick={props.onRestart}>↺ RESTART</NesBtn>
      <NesBtn onClick={() => props.onNavigate('settings')}>⚙ SETTINGS</NesBtn>
      <NesBtn variant="danger" onClick={props.onQuit}>
        ✕ QUIT
      </NesBtn>
    </NesBox>
  );
}

function Results(props: ScreenProps & { won: boolean }) {
  const stats = props.lastStats;
  const share = stats
    ? `I ${props.won ? 'saved' : 'failed'} the lamp in MOTH//LAMP! Score ${stats.score} · Medal ${stats.medal} · Combo x${stats.maxCombo}`
    : 'MOTH//LAMP';

  return (
    <NesBox
      title={props.won ? 'STAGE CLEAR!' : 'GAME OVER'}
      variant={props.won ? 'victory' : 'gameover'}
    >
      <p className={`nes-banner pixel-text${props.won ? ' win' : ' lose'}`}>
        {props.won ? 'LAMP SECURED!' : "LIGHT'S OUT…"}
      </p>
      {stats && (
        <div className="nes-stats">
          <div className="nes-medal pixel-text" aria-label={`Medal ${stats.medal}`}>
            ★ {stats.medal} ★
          </div>
          <div className="nes-stat-grid">
            <div className="nes-stat-row pixel-text">
              <span>SCORE</span>
              <span>{stats.score}</span>
            </div>
            <div className="nes-stat-row pixel-text">
              <span>TIME</span>
              <span>{stats.completionTimeSec}S</span>
            </div>
            <div className="nes-stat-row pixel-text">
              <span>ENEMIES</span>
              <span>{stats.enemiesDestroyed}</span>
            </div>
            <div className="nes-stat-row pixel-text">
              <span>COMBO</span>
              <span>X{stats.maxCombo}</span>
            </div>
            <div className="nes-stat-row pixel-text">
              <span>LAMP</span>
              <span>{Math.round(stats.lampRemaining)}</span>
            </div>
            <div className="nes-stat-row pixel-text">
              <span>DMG</span>
              <span>{stats.damageTaken}</span>
            </div>
          </div>
        </div>
      )}
      <div className="nes-btn-row">
        <NesBtn variant="accent" testId="btn-restart" onClick={props.onRestart}>
          ▶ PLAY AGAIN
        </NesBtn>
        <NesBtn onClick={props.onQuit}>◀ TITLE</NesBtn>
        <NesBtn
          variant="ghost"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(share);
            } catch {
              // ignore
            }
          }}
        >
          COPY SCORE
        </NesBtn>
      </div>
    </NesBox>
  );
}

function Legal({ title, body, onBack }: { title: string; body: string; onBack: () => void }) {
  return (
    <NesBox title={title} wide>
      <div className="legal nes-legal pixel-text">{body}</div>
      <NesBtn onClick={onBack}>◀ BACK</NesBtn>
    </NesBox>
  );
}

function Credits(props: ScreenProps) {
  return (
    <NesBox title="CREDITS">
      <p className="nes-text">MOTH//LAMP</p>
      <p className="nes-text dim">
        DESIGN · CODE · NES PIXEL ART · CHIPTUNE
      </p>
      <p className="nes-text dim">PHASER 3 · REACT · VITE</p>
      <p className="nes-text dim">OPTIONAL BASE PROFILE</p>
      <p className="nes-text dim">ALL ENEMIES FICTIONAL</p>
      <NesBtn onClick={() => props.onNavigate('title')}>◀ BACK</NesBtn>
    </NesBox>
  );
}

const PRIVACY = `MOTH//LAMP PRIVACY

• SETTINGS + SCORES STAY IN LOCALSTORAGE
• NO DATA SOLD
• WALLET IS OPTIONAL, NEVER AUTO-PROMPTED
• SIWE ONLY STORES ADDRESS LOCALLY
• NO PRIVATE KEYS COLLECTED

CONTACT: support@example.com`;

const TERMS = `MOTH//LAMP TERMS

• ENTERTAINMENT ONLY, AS-IS
• NO TOKENS OR REAL PAYOUTS
• WALLET NEVER GATES PLAY
• FICTION ONLY — NO REAL PEOPLE
• YOU SECURE YOUR OWN WALLET

CONTACT: support@example.com`;
