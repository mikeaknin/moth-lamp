import { useCallback, useRef, useState } from 'react';
import { gameBridge } from '../game/bridge';
import { PLAYER } from '../game/data/balance';

interface Props {
  leftHanded?: boolean;
  visible: boolean;
}

/**
 * Larger virtual stick with soft response curve for moth-like flight on mobile.
 */
export function TouchControls({ leftHanded = false, visible }: Props) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const activeId = useRef<number | null>(null);

  const onStick = useCallback((clientX: number, clientY: number) => {
    const el = zoneRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // Use slightly larger effective radius so edges are easy to hit
    const radius = Math.min(rect.width, rect.height) * 0.48;
    let dx = (clientX - cx) / radius;
    let dy = (clientY - cy) / radius;
    const mag = Math.hypot(dx, dy);
    if (mag < PLAYER.stickDeadzone) {
      setKnob({ x: 0, y: 0 });
      gameBridge.setTouch({ vecX: 0, vecY: 0 });
      return;
    }
    if (mag > 1) {
      dx /= mag;
      dy /= mag;
    }
    // Soft curve: more control near center
    const curved = Math.pow(Math.min(1, mag), PLAYER.inputCurve);
    const nx = (dx / (mag || 1)) * curved;
    const ny = (dy / (mag || 1)) * curved;
    setKnob({ x: nx * 36, y: ny * 36 });
    gameBridge.setTouch({ vecX: nx, vecY: ny });
  }, []);

  const endStick = useCallback(() => {
    activeId.current = null;
    setKnob({ x: 0, y: 0 });
    gameBridge.setTouch({ vecX: 0, vecY: 0 });
  }, []);

  if (!visible) return null;

  const stickStyle = leftHanded
    ? { right: 'calc(16px + var(--safe-right))', left: 'auto' }
    : undefined;
  const actionStyle = leftHanded
    ? { left: 'calc(16px + var(--safe-left))', right: 'auto', alignItems: 'flex-start' as const }
    : undefined;

  return (
    <div className="touch-controls" aria-hidden={!visible}>
      <div
        ref={zoneRef}
        className="touch-zone stick-zone stick-zone-lg"
        style={stickStyle}
        onTouchStart={(e) => {
          e.preventDefault();
          const t = e.changedTouches[0];
          activeId.current = t.identifier;
          onStick(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === activeId.current) onStick(t.clientX, t.clientY);
          }
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === activeId.current) endStick();
          }
        }}
        onTouchCancel={endStick}
      >
        <div
          className="stick-knob stick-knob-lg"
          style={{
            transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
          }}
        />
      </div>

      <div className="touch-zone action-zone" style={actionStyle}>
        <button
          type="button"
          className="action-btn"
          aria-label="Fire"
          onTouchStart={(e) => {
            e.preventDefault();
            gameBridge.setTouch({ fire: true });
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            gameBridge.setTouch({ fire: false });
          }}
          onMouseDown={() => gameBridge.setTouch({ fire: true })}
          onMouseUp={() => gameBridge.setTouch({ fire: false })}
          onMouseLeave={() => gameBridge.setTouch({ fire: false })}
        >
          FIRE
        </button>
        <button
          type="button"
          className="action-btn dash"
          aria-label="Dash"
          onTouchStart={(e) => {
            e.preventDefault();
            gameBridge.setTouch({ dash: true });
          }}
        >
          DASH
        </button>
      </div>

      <button
        type="button"
        className="pause-fab"
        aria-label="Pause"
        onClick={() => gameBridge.pause()}
      >
        II
      </button>
    </div>
  );
}
