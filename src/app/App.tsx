import { useCallback, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { GameCanvas } from '../components/GameCanvas';
import { Hud } from '../components/Hud';
import { TouchControls } from '../components/TouchControls';
import { Screens } from '../components/Screens';
import { gameBridge } from '../game/bridge';
import { audioEngine } from '../game/audio/AudioEngine';
import {
  loadHighScores,
  loadSettings,
  recordRun,
  saveSettings,
  submitHighScore,
  loadProfile,
} from '../game/systems/storage';
import type {
  GameScreen,
  GameSettings,
  HudSnapshot,
  RunStats,
  HighScoreEntry,
  GameOutcome,
} from '../game/data/types';
import { wagmiConfig } from '../base/wagmi';
import '../styles/app.css';

const queryClient = new QueryClient();

function useIsCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(pointer: coarse)').matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const fn = () => setCoarse(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return coarse;
}

function AppInner() {
  const [screen, setScreen] = useState<GameScreen>('loading');
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [scores, setScores] = useState<HighScoreEntry[]>(() => loadHighScores());
  const [lastStats, setLastStats] = useState<RunStats | null>(null);
  const [lastOutcome, setLastOutcome] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(8);
  const [gameReady, setGameReady] = useState(false);
  const coarse = useIsCoarsePointer();

  // Fake smooth loading bar until Phaser ready
  useEffect(() => {
    if (gameReady) {
      setLoadProgress(100);
      const t = window.setTimeout(() => setScreen('title'), 280);
      return () => window.clearTimeout(t);
    }
    const id = window.setInterval(() => {
      setLoadProgress((p) => Math.min(92, p + 4 + Math.random() * 6));
    }, 120);
    return () => window.clearInterval(id);
  }, [gameReady]);

  useEffect(() => {
    const unsub = gameBridge.subscribe({
      onHud: (h) => setHud(h),
      onOutcome: (outcome: GameOutcome, stats: RunStats) => {
        setLastStats(stats);
        setLastOutcome(outcome);
        const profile = loadProfile();
        submitHighScore({
          score: stats.score,
          medal: stats.medal,
          difficulty: stats.difficulty,
          date: new Date().toISOString(),
          timeSec: stats.completionTimeSec,
          enemies: stats.enemiesDestroyed,
          name: profile.displayName,
          address: profile.address,
        });
        setScores(loadHighScores());
        recordRun(stats.score, outcome === 'victory');
        setScreen(outcome === 'victory' ? 'victory' : 'gameover');
      },
      onReady: () => setGameReady(true),
    });
    return unsub;
  }, []);

  useEffect(() => {
    audioEngine.setMusicVolume(settings.musicVolume);
    audioEngine.setSfxVolume(settings.sfxVolume);
    gameBridge.updateSettings(settings);
    saveSettings(settings);
  }, [settings]);

  const unlockAudio = useCallback(async () => {
    await audioEngine.unlock();
  }, []);

  const onPlay = useCallback(
    async (tutorial = false) => {
      await unlockAudio();
      audioEngine.sfxUi();
      setScreen('playing');
      gameBridge.requestStart({ tutorial });
      if (!tutorial) audioEngine.playMusic('level');
    },
    [unlockAudio],
  );

  const onResume = useCallback(() => {
    setScreen('playing');
    gameBridge.resume();
  }, []);

  const onRestart = useCallback(async () => {
    await unlockAudio();
    setScreen('playing');
    gameBridge.requestStart({ tutorial: false });
  }, [unlockAudio]);

  const onQuit = useCallback(() => {
    gameBridge.quit();
    audioEngine.playMusic('title');
    setScreen('title');
  }, []);

  // Pause overlay when hud says paused
  useEffect(() => {
    if (hud?.paused && screen === 'playing') setScreen('paused');
  }, [hud?.paused, screen]);

  const showTouch = useMemo(
    () => coarse && (screen === 'playing' || screen === 'paused'),
    [coarse, screen],
  );

  const immersive = screen === 'playing' || screen === 'paused';

  return (
    <div className={`app-shell ${immersive ? 'is-playing' : ''}`}>
      {settings.crtFilter && <div className="crt-overlay" aria-hidden />}
      <div className="game-stage">
        <GameCanvas settings={settings} onReady={() => setGameReady(true)} />
        <Hud hud={hud} visible={immersive} />
        <TouchControls
          visible={showTouch && screen === 'playing'}
          leftHanded={settings.touchLeftHanded}
        />
      </div>
      <Screens
        screen={screen}
        settings={settings}
        onSettings={setSettings}
        onNavigate={(s) => {
          void unlockAudio();
          audioEngine.sfxUi();
          if (s === 'settings' && screen === 'paused') {
            setScreen('settings');
            return;
          }
          setScreen(s);
        }}
        onPlay={onPlay}
        onResume={onResume}
        onRestart={onRestart}
        onQuit={onQuit}
        scores={scores}
        lastStats={lastStats}
        lastOutcome={lastOutcome}
        loadProgress={Math.round(loadProgress)}
      />
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppInner />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
