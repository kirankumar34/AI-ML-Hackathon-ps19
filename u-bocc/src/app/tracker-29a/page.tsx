'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useBusTracking } from '../../hooks/useBusTracking';

const MapView = dynamic(() => import('../../components/BusTrackingMapComponent'), { ssr: false });

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtTime(sec: number): string {
  if (sec <= 0) return 'Arriving';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m} min`;
  return `${m}m ${s}s`;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Tracker29APage() {
  const {
    stops, busState, allWaypoints,
    isPlaying, setIsPlaying,
    cameraFollow, setCameraFollow,
    isDemoMode,
  } = useBusTracking();

  const [sheetOpen, setSheetOpen] = useState(true);

  const pct = busState ? Math.round(busState.progressRatio * 100) : 0;

  // Stop list scroll: which stops to show in bottom sheet
  const stopList = busState ? busState.stopEtas : stops.map(s => ({
    stop_id: s.stop_id, stop_name: s.stop_name,
    lat: s.lat, lng: s.lng, stop_sequence: s.stop_sequence,
    eta_sec: 0, arrived: false,
  }));

  const segIdx = busState?.nearestStopIdx ?? 0;

  const occupancyColor = !busState ? '#22d3ee'
    : busState.occupancy > 85 ? '#ef4444'
    : busState.occupancy > 65 ? '#f97316'
    : '#22c55e';

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#060d1a',
      fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif',
      overflow: 'hidden',
    }}>

      {/* ════════════════════════════════════════════════
          FULL-SCREEN MAP (sits behind everything)
      ═══════════════════════════════════════════════ */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <MapView
          stops={stops}
          busState={busState}
          allWaypoints={allWaypoints}
          cameraFollow={cameraFollow}
        />
      </div>


      {/* ════════════════════════════════════════════════
          TOP FLOATING BAR  (Ola/Uber style header)
      ═══════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 100,
        padding: '12px 16px 10px',
        background: 'linear-gradient(180deg, rgba(6,13,26,0.95) 70%, transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Left: Route tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: '#22d3ee', color: '#0c1a2e',
            fontWeight: 900, fontSize: '16px',
            padding: '4px 14px', borderRadius: '99px',
            letterSpacing: '0.5px', boxShadow: '0 0 16px rgba(34,211,238,0.4)',
          }}>29A</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>
              Perambur → Anna Square
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
              Chennai MTC · 8 stops · ~45 min
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isDemoMode && (
            <span style={{
              fontSize: '9px', fontWeight: 700, color: '#fbbf24',
              background: '#451a03', padding: '3px 7px', borderRadius: '5px',
              border: '1px solid #92400e',
            }}>DEMO</span>
          )}

          {/* Play/Pause */}
          <button onClick={() => setIsPlaying(!isPlaying)} style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(15,23,42,0.85)', border: '1px solid #1e293b',
            color: '#fff', fontSize: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>{isPlaying ? '⏸' : '▶'}</button>

          {/* Camera follow */}
          <button onClick={() => setCameraFollow(!cameraFollow)} style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: cameraFollow ? 'rgba(34,211,238,0.15)' : 'rgba(15,23,42,0.85)',
            border: `1px solid ${cameraFollow ? '#22d3ee' : '#1e293b'}`,
            color: cameraFollow ? '#22d3ee' : '#64748b',
            fontSize: '15px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>🎯</button>
        </div>
      </div>


      {/* ════════════════════════════════════════════════
          PROGRESS BAR  (floating below header)
      ═══════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute', top: '70px', left: '16px', right: '16px',
        zIndex: 100,
        background: 'rgba(6,13,26,0.75)', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '14px', padding: '10px 14px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
            {stops[0]?.stop_name ?? 'Start'}
          </span>
          <span style={{ fontSize: '10px', color: '#22d3ee', fontWeight: 700 }}>{pct}%</span>
          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
            {stops[stops.length - 1]?.stop_name ?? 'End'}
          </span>
        </div>
        <div style={{ height: '6px', background: '#1e293b', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: 'linear-gradient(90deg, #10b981 0%, #22d3ee 100%)',
            borderRadius: '99px',
            transition: 'width 0.4s ease',
            boxShadow: '0 0 10px rgba(34,211,238,0.4)',
          }} />
        </div>

        {/* Stop dots along progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          {stops.map((_, i) => {
            const stopPct = (i / (stops.length - 1)) * 100;
            const done    = stopPct <= pct;
            return (
              <div key={i} style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: done ? '#10b981' : '#334155',
                border: i === segIdx ? '2px solid #22d3ee' : 'none',
                transition: 'background 0.3s',
              }} />
            );
          })}
        </div>
      </div>


      {/* ════════════════════════════════════════════════
          BOTTOM SHEET  (Rapido/Ola style)
      ═══════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 200,
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: sheetOpen ? 'translateY(0)' : 'translateY(calc(100% - 72px))',
      }}>
        {/* Sheet handle */}
        <div
          onClick={() => setSheetOpen(o => !o)}
          style={{
            background: 'rgba(10,17,30,0.92)', backdropFilter: 'blur(16px)',
            borderRadius: '20px 20px 0 0',
            border: '1px solid rgba(255,255,255,0.07)',
            borderBottom: 'none',
            padding: '10px 20px 0',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: '40px', height: '4px', background: '#334155',
            borderRadius: '99px', margin: '0 auto 12px',
            transition: 'background 0.2s',
          }} />

          {/* ── Quick summary row (always visible) ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            paddingBottom: '12px',
          }}>
            {/* Bus icon */}
            <div style={{
              width: '48px', height: '48px', flexShrink: 0,
              background: 'linear-gradient(135deg, #0c1a30, #0f2040)',
              border: '2px solid #22d3ee', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 0 16px rgba(34,211,238,0.2)',
            }}>🚌</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '16px', color: '#fff' }}>
                  MTC-29A-003
                </span>
                <span style={{
                  fontSize: '11px', fontWeight: 700,
                  color: busState?.atStop ? '#f97316' : '#22c55e',
                  background: busState?.atStop ? 'rgba(249,115,22,0.12)' : 'rgba(34,197,94,0.12)',
                  padding: '2px 8px', borderRadius: '99px',
                  border: `1px solid ${busState?.atStop ? '#f97316' : '#22c55e'}44`,
                }}>
                  {busState?.atStop ? '● At Stop' : '● Moving'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  🚀 <b style={{ color: '#94a3b8' }}>{busState?.speed ?? 0} km/h</b>
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  👥 <b style={{ color: occupancyColor }}>{busState?.occupancy ?? '--'}%</b>
                </span>
              </div>
            </div>

            {/* ETA pill */}
            <div style={{
              background: 'linear-gradient(135deg, #0c2040, #172554)',
              border: '1px solid #38bdf8',
              borderRadius: '12px', padding: '8px 14px', textAlign: 'center',
              boxShadow: '0 0 12px rgba(56,189,248,0.15)',
            }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>NEXT STOP</div>
              <div style={{ fontWeight: 800, fontSize: '18px', color: '#38bdf8', lineHeight: 1.1 }}>
                {fmtTime(busState?.etaNextStop ?? 0)}
              </div>
            </div>
          </div>
        </div>

        {/* ── Expandable content ── */}
        <div style={{
          background: 'rgba(10,17,30,0.95)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderTop: '1px solid #1e293b',
          maxHeight: '55vh', overflowY: 'auto',
          padding: '0 20px 24px',
          scrollbarWidth: 'none',
        }}>

          {/* Current → Next stop banner */}
          {busState && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(30,41,59,0.6)', borderRadius: '12px',
              padding: '12px 14px', margin: '4px 0 14px',
              border: '1px solid #1e293b',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>
                  CURRENT STOP
                </div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>
                  {busState.nearestStopName}
                </div>
              </div>
              <div style={{ color: '#334155', fontSize: '18px' }}>→</div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 600, marginBottom: '2px' }}>
                  NEXT STOP
                </div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>
                  {busState.nextStopName}
                </div>
              </div>
            </div>
          )}

          {/* Occupancy bar */}
          {busState && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '5px' }}>
                <span>Occupancy</span>
                <span style={{ color: occupancyColor, fontWeight: 700 }}>{busState.occupancy}%</span>
              </div>
              <div style={{ height: '5px', background: '#1e293b', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${busState.occupancy}%`,
                  background: `linear-gradient(90deg, ${occupancyColor}88, ${occupancyColor})`,
                  borderRadius: '99px', transition: 'width 1s ease',
                }} />
              </div>
            </div>
          )}

          {/* Terminus ETA */}
          {busState && (
            <div style={{
              fontSize: '12px', color: '#64748b', textAlign: 'center',
              marginBottom: '16px',
              background: 'rgba(16,24,40,0.5)', padding: '8px', borderRadius: '8px',
            }}>
              Reaches <span style={{ color: '#fff', fontWeight: 700 }}>Anna Square</span> in{' '}
              <span style={{ color: '#22c55e', fontWeight: 700 }}>
                {Math.ceil(busState.etaTerminus / 60)} min
              </span>
            </div>
          )}

          {/* ── Stop Timeline ── */}
          <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
            All Stops
          </div>

          <div style={{ position: 'relative' }}>
            {/* Vertical line */}
            <div style={{
              position: 'absolute', left: '11px', top: '12px', bottom: '12px',
              width: '2px', background: '#1e293b', zIndex: 0,
            }} />

            {stopList.map((stop, i) => {
              const isPast    = i < segIdx;
              const isCurrent = i === segIdx;
              const isNext    = i === segIdx + 1;

              const dotColor  = isPast ? '#374151' : isCurrent ? '#10b981' : isNext ? '#38bdf8' : '#334155';
              const nameColor = isPast ? '#374151' : isCurrent ? '#fff' : isNext ? '#e2e8f0' : '#64748b';

              return (
                <div key={stop.stop_id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '7px 0', position: 'relative', zIndex: 1,
                }}>
                  {/* Dot */}
                  <div style={{
                    width: '10px', height: '10px', flexShrink: 0,
                    borderRadius: '50%',
                    background: isPast ? '#1e293b' : `${dotColor}22`,
                    border: `2.5px solid ${dotColor}`,
                    boxShadow: (isCurrent || isNext) ? `0 0 8px ${dotColor}` : 'none',
                    transition: 'all 0.3s',
                    zIndex: 2,
                  }} />

                  {/* Stop name + badge */}
                  <div style={{
                    flex: 1,
                    background: isCurrent ? 'rgba(16,185,129,0.07)' : 'transparent',
                    border: isCurrent ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent',
                    borderRadius: '8px',
                    padding: isCurrent ? '6px 10px' : '3px 6px',
                    transition: 'all 0.3s',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: isCurrent ? 700 : 500, color: nameColor }}>
                        {stop.stop_name}
                      </span>
                      {i === 0 && <span style={{ fontSize: '9px', color: '#475569', marginLeft: '5px' }}>Start</span>}
                      {i === stops.length - 1 && <span style={{ fontSize: '9px', color: '#475569', marginLeft: '5px' }}>End</span>}
                    </div>

                    {isPast ? (
                      <span style={{
                        fontSize: '9px', color: '#374151', background: '#1e293b',
                        padding: '2px 6px', borderRadius: '4px',
                      }}>✓ Done</span>
                    ) : isCurrent ? (
                      <span style={{
                        fontSize: '9px', fontWeight: 700, color: '#10b981',
                        background: 'rgba(16,185,129,0.12)', padding: '2px 6px', borderRadius: '4px',
                      }}>📍 Here</span>
                    ) : stop.eta_sec > 0 ? (
                      <span style={{
                        fontSize: '10px', fontWeight: 700,
                        color: isNext ? '#38bdf8' : '#64748b',
                        background: isNext ? 'rgba(56,189,248,0.1)' : '#1e293b',
                        padding: '2px 7px', borderRadius: '4px',
                      }}>
                        {fmtTime(stop.eta_sec)}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>


      {/* ════════════════════════════════════════════════
          LIVE BADGE  (top-right floating)
      ═══════════════════════════════════════════════ */}
      <div style={{
        position: 'absolute', bottom: sheetOpen ? '360px' : '90px',
        right: '16px', zIndex: 150,
        display: 'flex', flexDirection: 'column', gap: '8px',
        transition: 'bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Zoom in */}
        <div style={{
          background: 'rgba(10,17,30,0.85)', backdropFilter: 'blur(8px)',
          border: '1px solid #1e293b', borderRadius: '8px',
          padding: '6px 10px',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          <span style={{
            display: 'inline-block', width: '7px', height: '7px',
            borderRadius: '50%', background: '#22c55e',
            boxShadow: '0 0 8px #22c55e',
          }} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#22c55e' }}>LIVE</span>
        </div>
      </div>

    </div>
  );
}
