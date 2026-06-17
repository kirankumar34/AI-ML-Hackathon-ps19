import React, { useState, useEffect } from 'react';

export interface Stop {
  stop_id: string;
  stop_name: string;
  lat: number;
  lng: number;
  stop_sequence: number;
}

export interface StopETA {
  stop_id: string;
  stop_name: string;
  lat: number;
  lng: number;
  stop_sequence: number;
  eta_sec: number;
  arrived: boolean;
}

export interface BusTrackingState {
  bus_id: string;
  status: 'moving' | 'dwell' | 'atStop';
  speed_kmh: number;
  nearest_stop_name: string;
  next_stop_name: string;
  eta_next_stop_sec: number;
  eta_terminus_sec: number;
  occupancy_pct: number;
  stop_etas: StopETA[];
}

interface StopETAPanelProps {
  busState: BusTrackingState | null;
  stops: Stop[];
  loading?: boolean;
  isDemoMode?: boolean;
  currentSegmentIdx: number;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  cameraFollow: boolean;
  setCameraFollow: (v: boolean) => void;
}

function formatETA(sec: number): string {
  if (sec <= 0) return 'Now';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m} min`;
  return `${m}m ${s}s`;
}

function OccupancyBar({ pct }: { pct: number }) {
  const color = pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
        <span>Occupancy</span>
        <span style={{ color, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: '5px', background: '#1e293b', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: '99px',
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  );
}

export default function StopETAPanel({
  busState, stops, loading, isDemoMode,
  currentSegmentIdx, isPlaying, setIsPlaying, cameraFollow, setCameraFollow,
}: StopETAPanelProps) {
  const [tick, setTick] = useState(0);

  // Live countdown tick every second
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const statusColor = !busState ? '#94a3b8'
    : busState.status === 'moving' ? '#22c55e'
    : '#f59e0b';

  const statusLabel = !busState ? 'Connecting…'
    : busState.status === 'moving' ? 'In Transit'
    : busState.status === 'dwell' ? 'Dwell at Stop'
    : 'At Stop';

  return (
    <div style={{
      width: '360px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0b0f1a',
      border: '1px solid #1e293b',
      borderRadius: '16px',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#e2e8f0',
      boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '16px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        borderBottom: '1px solid #1e293b',
      }}>
        {/* Route badge + controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: '#3b82f6',
              color: '#fff',
              fontWeight: 800,
              fontSize: '13px',
              padding: '2px 10px',
              borderRadius: '99px',
              letterSpacing: '1px',
            }}>29A</div>
            {isDemoMode && (
              <span style={{
                fontSize: '9px', fontWeight: 700, color: '#f59e0b',
                background: '#451a03', padding: '2px 6px', borderRadius: '4px',
                border: '1px solid #92400e',
              }}>DEMO</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                background: isPlaying ? '#1e3a5f' : '#14532d',
                border: `1px solid ${isPlaying ? '#3b82f6' : '#22c55e'}`,
                color: isPlaying ? '#3b82f6' : '#22c55e',
                borderRadius: '8px',
                padding: '5px 10px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                transition: 'all 0.2s',
              }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button
              onClick={() => setCameraFollow(!cameraFollow)}
              title="Camera Follow"
              style={{
                background: cameraFollow ? '#1e1b4b' : '#1e293b',
                border: `1px solid ${cameraFollow ? '#818cf8' : '#334155'}`,
                color: cameraFollow ? '#818cf8' : '#64748b',
                borderRadius: '8px',
                padding: '5px 10px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                transition: 'all 0.2s',
              }}
            >
              🎯
            </button>
          </div>
        </div>

        {/* Bus info card */}
        <div style={{
          background: '#0f172a',
          borderRadius: '12px',
          padding: '12px',
          border: '1px solid #1e293b',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}>
          {/* Bus icon */}
          <div style={{
            width: '44px', height: '44px',
            background: 'linear-gradient(135deg, #172554, #1e293b)',
            border: '2px solid #3b82f6',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(59,130,246,0.3)',
          }}>
            <span style={{ fontSize: '22px' }}>🚌</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff', letterSpacing: '-0.3px' }}>
              {busState?.bus_id ?? 'MTC-29A-003'}
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
              Perambur → Anna Square · MTC
            </div>
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
              {/* Status */}
              <span style={{
                fontSize: '10px', fontWeight: 700, color: statusColor,
                background: `${statusColor}18`, padding: '2px 7px',
                borderRadius: '99px', border: `1px solid ${statusColor}44`,
              }}>
                ● {statusLabel}
              </span>
              {/* Speed */}
              {busState && (
                <span style={{
                  fontSize: '10px', fontWeight: 700, color: '#94a3b8',
                  background: '#1e293b', padding: '2px 7px',
                  borderRadius: '99px', border: '1px solid #334155',
                }}>
                  {busState.speed_kmh} km/h
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Occupancy */}
        {busState && (
          <div style={{ marginTop: '10px' }}>
            <OccupancyBar pct={busState.occupancy_pct} />
          </div>
        )}
      </div>

      {/* ── Current / Next Stop ── */}
      {busState && (
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid #1e293b',
          background: '#0d111d',
        }}>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>
            Current Stop
          </div>
          <div style={{ fontWeight: 800, fontSize: '17px', color: '#fff', marginBottom: '10px' }}>
            {busState.nearest_stop_name}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#172554', borderRadius: '10px', padding: '10px 12px',
            border: '1px solid #1e3a5f',
          }}>
            <div style={{ fontSize: '20px' }}>🏁</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 600, marginBottom: '2px' }}>NEXT STOP</div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>{busState.next_stop_name}</div>
            </div>
            <div style={{
              fontWeight: 800, fontSize: '15px', color: '#3b82f6',
              background: '#1e3a8a', padding: '4px 10px', borderRadius: '8px',
            }}>
              {formatETA(busState.eta_next_stop_sec)}
            </div>
          </div>

          <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
            Reaches <span style={{ color: '#94a3b8', fontWeight: 600 }}>Anna Square</span> in{' '}
            <span style={{ color: '#22c55e', fontWeight: 700 }}>
              {Math.ceil(busState.eta_terminus_sec / 60)} min
            </span>
          </div>
        </div>
      )}

      {/* ── Stop Timeline ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
          All Stops
        </div>

        {stops.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: '40px', color: '#475569' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📡</div>
            <div style={{ fontSize: '12px' }}>Loading stops…</div>
          </div>
        )}

        <div style={{ position: 'relative' }}>
          {/* Vertical timeline line */}
          <div style={{
            position: 'absolute', left: '18px', top: '8px', bottom: '8px',
            width: '2px', background: '#1e293b', zIndex: 0,
          }} />

          {stops.map((stop, i) => {
            const eta = busState?.stop_etas[i];
            const isPast = i < currentSegmentIdx;
            const isCurrent = i === currentSegmentIdx;
            const isNext = i === currentSegmentIdx + 1;
            const isFuture = i > currentSegmentIdx + 1;

            const dotColor = isPast ? '#374151' : isCurrent ? '#22c55e' : isNext ? '#3b82f6' : '#06b6d4';
            const textColor = isPast ? '#475569' : isCurrent ? '#fff' : isNext ? '#e2e8f0' : '#94a3b8';

            return (
              <div key={stop.stop_id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 0',
                position: 'relative', zIndex: 1,
              }}>
                {/* Timeline dot */}
                <div style={{
                  width: '14px', height: '14px', flexShrink: 0,
                  borderRadius: '50%',
                  background: isPast ? '#1e293b' : `${dotColor}22`,
                  border: `2.5px solid ${dotColor}`,
                  boxShadow: (isCurrent || isNext) ? `0 0 8px ${dotColor}88` : 'none',
                  zIndex: 2,
                  transition: 'all 0.3s',
                }} />

                {/* Stop info */}
                <div style={{
                  flex: 1,
                  background: isCurrent ? '#172554' : 'transparent',
                  border: isCurrent ? '1px solid #1e3a5f' : '1px solid transparent',
                  borderRadius: '8px',
                  padding: isCurrent ? '6px 10px' : '3px 6px',
                  transition: 'all 0.3s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      {/* Stop number pill */}
                      <span style={{
                        fontSize: '9px', fontWeight: 700,
                        color: dotColor, marginRight: '5px',
                        background: `${dotColor}18`, padding: '1px 5px',
                        borderRadius: '4px',
                      }}>
                        {stop.stop_sequence}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: isCurrent ? 700 : 500, color: textColor }}>
                        {stop.stop_name}
                      </span>
                      {i === 0 && <span style={{ fontSize: '9px', color: '#64748b', marginLeft: '4px' }}>Origin</span>}
                      {i === stops.length - 1 && <span style={{ fontSize: '9px', color: '#64748b', marginLeft: '4px' }}>Terminus</span>}
                    </div>

                    {/* ETA badge */}
                    {isPast ? (
                      <span style={{
                        fontSize: '9px', color: '#6b7280',
                        background: '#1e293b', padding: '2px 6px',
                        borderRadius: '4px',
                      }}>✓ Departed</span>
                    ) : eta && eta.eta_sec > 0 ? (
                      <span style={{
                        fontSize: '10px', fontWeight: 700,
                        color: isCurrent || isNext ? '#3b82f6' : '#94a3b8',
                        background: isCurrent || isNext ? '#172554' : '#1e293b',
                        padding: '2px 7px', borderRadius: '4px',
                        border: isCurrent ? '1px solid #1e3a5f' : '1px solid transparent',
                      }}>
                        {formatETA(eta.eta_sec)}
                      </span>
                    ) : isCurrent ? (
                      <span style={{
                        fontSize: '9px', fontWeight: 700, color: '#22c55e',
                        background: '#052e16', padding: '2px 6px', borderRadius: '4px',
                      }}>HERE</span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid #1e293b',
        background: '#0b0f1a',
        fontSize: '10px',
        color: '#334155',
        textAlign: 'center',
      }}>
        Chennai MTC · Route 29A · ML-powered ETA · Kalman Filter GPS
      </div>
    </div>
  );
}
