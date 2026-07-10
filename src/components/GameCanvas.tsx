import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import { createGame } from '../game/createGame';
import { gameBridge } from '../game/bridge';
import type { GameSettings } from '../game/data/types';

interface Props {
  settings: GameSettings;
  onReady: () => void;
}

export function GameCanvas({ settings, onReady }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const readyOnce = useRef(false);

  useEffect(() => {
    if (!hostRef.current || gameRef.current) return;

    const host = hostRef.current;
    const game = createGame(host, settings);
    gameRef.current = game;

    const onReadyBridge = () => {
      if (!readyOnce.current) {
        readyOnce.current = true;
        onReady();
      }
    };

    const refreshScale = () => {
      try {
        game.scale.refresh();
      } catch {
        // ignore during teardown
      }
    };

    // Ensure canvas reflows to full host after layout / orientation
    requestAnimationFrame(refreshScale);
    window.addEventListener('resize', refreshScale);
    window.addEventListener('orientationchange', refreshScale);
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => refreshScale())
        : null;
    ro?.observe(host);

    const unsub = gameBridge.subscribe({ onReady: onReadyBridge });
    const t = window.setTimeout(onReadyBridge, 2500);

    return () => {
      unsub();
      window.clearTimeout(t);
      window.removeEventListener('resize', refreshScale);
      window.removeEventListener('orientationchange', refreshScale);
      ro?.disconnect();
      game.destroy(true);
      gameRef.current = null;
    };
    // Mount once — settings pushed via bridge
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    gameBridge.updateSettings(settings);
  }, [settings]);

  return <div className="phaser-host" ref={hostRef} data-testid="game-canvas" />;
}
