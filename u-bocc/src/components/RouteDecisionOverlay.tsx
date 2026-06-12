// src/components/RouteDecisionOverlay.tsx
import { RouteOverlay, CongestionLevel } from '../hooks/useRouteOverlay';

const CONGESTION_CONFIG: Record<CongestionLevel, {
  label: string;
  color: string;
  bg: string;
  barSegments: number; // 1–4 filled bars out of 4
}> = {
  LOW:      { label: 'LOW',      color: '#06d6a0', bg: '#06d6a022', barSegments: 1 },
  MODERATE: { label: 'MODERATE', color: '#ffd166', bg: '#ffd16622', barSegments: 2 },
  HIGH:     { label: 'HIGH',     color: '#ff8c42', bg: '#ff8c4222', barSegments: 3 },
  CRITICAL: { label: 'CRITICAL', color: '#ef476f', bg: '#ef476f22', barSegments: 4 },
};

interface Props {
  overlay: RouteOverlay;
  onDismiss: () => void;
}

export default function RouteDecisionOverlay({ overlay, onDismiss }: Props) {
  const cfg = CONGESTION_CONFIG[overlay.congestion];
  const isApproved = overlay.decision === 'APPROVED';

  return (
    <div
      className="route-decision-overlay"
      style={{
        position: 'absolute',
        bottom: '52px',         /* sits just above the ticker */
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: '420px',
        background: '#1a1a26',
        border: `1px solid ${isApproved ? '#06d6a040' : '#ef476f40'}`,
        borderLeft: `3px solid ${isApproved ? '#06d6a0' : '#ef476f'}`,
        borderRadius: '8px',
        padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        animation: 'slideUpFade 0.3s ease-out',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
              padding: '2px 7px', borderRadius: '3px',
              background: isApproved ? '#06d6a022' : '#ef476f22',
              color: isApproved ? '#06d6a0' : '#ef476f',
              border: `1px solid ${isApproved ? '#06d6a040' : '#ef476f40'}`,
            }}>
              {isApproved ? '✓ APPROVED' : '✗ REJECTED'}
            </span>
            <span style={{ fontSize: '10px', color: '#6b6b80', letterSpacing: '0.06em' }}>
              {overlay.actionType === 'ADD_BUSES' ? 'BUS DISPATCH' : 'ROUTE DIVERSION'}
            </span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#e8e8f0' }}>
            Route {overlay.routeNumber}
            <span style={{ fontSize: '11px', color: '#6b6b80', marginLeft: '8px', fontWeight: 400 }}>
              {overlay.routeName}
            </span>
          </div>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: '#6b6b80', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>×</button>
      </div>

      {/* ── Traffic / Congestion Level ── */}
      <div style={{
        background: cfg.bg,
        border: `1px solid ${cfg.color}30`,
        borderRadius: '6px',
        padding: '10px 12px',
        marginBottom: '12px',
      }}>
        <div style={{ fontSize: '10px', color: '#6b6b80', letterSpacing: '0.1em', marginBottom: '6px' }}>
          ROUTE TRAFFIC LEVEL
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: cfg.color }}>
            {cfg.label}
          </span>
          {/* 4-bar congestion indicator */}
          <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '18px' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                width: '7px',
                height: `${6 + i * 3}px`,
                borderRadius: '2px',
                background: i <= cfg.barSegments ? cfg.color : '#2a2a3a',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#6b6b80', marginTop: '4px' }}>
          {overlay.busesOnRoute} buses currently on this route
        </div>
      </div>

      {/* ── Impact Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        {/* Wait time change */}
        <div style={{ background: '#1a1a26', borderRadius: '5px', padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#6b6b80', marginBottom: '4px', letterSpacing: '0.08em' }}>WAIT BEFORE</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#ef476f' }}>{overlay.waitBefore}m</div>
        </div>
        <div style={{ background: '#1a1a26', borderRadius: '5px', padding: '8px 10px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '18px', color: isApproved ? '#06d6a0' : '#6b6b80' }}>→</span>
        </div>
        <div style={{ background: '#1a1a26', borderRadius: '5px', padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#6b6b80', marginBottom: '4px', letterSpacing: '0.08em' }}>WAIT AFTER</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: isApproved ? '#06d6a0' : '#6b6b80' }}>
            {isApproved ? overlay.waitAfter : overlay.waitBefore}m
          </div>
        </div>
      </div>

      {/* ── Footer note ── */}
      {overlay.actionType === 'ADD_BUSES' && overlay.busesAdded && (
        <div style={{ fontSize: '11px', color: '#6b6b80', borderTop: '1px solid #2a2a3a', paddingTop: '8px' }}>
          {isApproved
            ? `✓ ${overlay.busesAdded} buses dispatched from ${overlay.depot} depot`
            : `✗ Dispatch request from ${overlay.depot} depot rejected`
          }
        </div>
      )}
      {overlay.actionType === 'REROUTE' && (
        <div style={{ fontSize: '11px', color: '#6b6b80', borderTop: '1px solid #2a2a3a', paddingTop: '8px' }}>
          {isApproved
            ? `✓ Rerouting active — ${overlay.routeName}`
            : `✗ Route diversion rejected — original path maintained`
          }
        </div>
      )}

      {/* Auto-dismiss progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
        borderRadius: '0 0 8px 8px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: isApproved ? '#06d6a0' : '#ef476f',
          animation: 'shrinkBar 8s linear forwards',
        }} />
      </div>
    </div>
  );
}
