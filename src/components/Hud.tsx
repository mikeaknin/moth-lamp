import type { HudSnapshot } from '../game/data/types';

interface Props {
  hud: HudSnapshot | null;
  visible: boolean;
  mobile?: boolean;
}

/**
 * Compact in-game HUD — one thin strip so the playfield stays dominant.
 * On mobile, larger NES type + clearer meters.
 */
export function Hud({ hud, visible, mobile = false }: Props) {
  if (!visible || !hud || hud.outcome !== 'playing') return null;

  const lampPct = Math.max(0, Math.min(100, (hud.lampLife / hud.maxLampLife) * 100));
  const dashPct = Math.max(0, Math.min(100, hud.dashCooldownRatio * 100));
  const lampCritical = hud.lampLife <= 15;

  return (
    <div
      className={`hud hud-compact${mobile ? ' hud-mobile' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="hud-strip">
        {/* Hearts */}
        <div className="hud-hearts" aria-label={`Health ${hud.hp} of ${hud.maxHp}`}>
          {Array.from({ length: hud.maxHp }, (_, i) => (
            <span key={i} className={`hud-heart ${i < hud.hp ? 'on' : 'off'}`} />
          ))}
        </div>

        {/* Lamp meter */}
        <div
          className={`hud-meter lamp ${hud.lampWarning || lampCritical ? 'danger' : ''}`}
          aria-label={`Lamp life ${Math.round(hud.lampLife)}`}
        >
          <span className="hud-meter-icon" aria-hidden>
            LMP
          </span>
          <div className="hud-meter-track">
            <span style={{ width: `${lampPct}%` }} />
          </div>
        </div>

        {/* Score + combo */}
        <div className="hud-score">
          <span className="hud-score-num">{hud.score}</span>
          {hud.combo > 1 && <span className="hud-combo">×{hud.combo}</span>}
        </div>

        {/* Dash pip */}
        <div className="hud-meter dash" aria-label="Dash cooldown">
          <span className="hud-meter-icon" aria-hidden>
            DSH
          </span>
          <div className="hud-meter-track thin">
            <span style={{ width: `${dashPct}%` }} />
          </div>
        </div>
      </div>

      {hud.bossHpRatio != null && (
        <div className="hud-boss" aria-label="Boss health">
          <div className="hud-meter-track boss">
            <span style={{ width: `${hud.bossHpRatio * 100}%` }} />
          </div>
        </div>
      )}

      {hud.powerups.length > 0 && (
        <div className="hud-pips" aria-label="Active power-ups">
          {hud.powerups.map((p) => (
            <span key={p.kind} className={`hud-pip pip-${p.kind}`} title={p.kind} />
          ))}
        </div>
      )}
    </div>
  );
}
