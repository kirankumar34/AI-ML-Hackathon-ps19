'use client';

import React from 'react';

export default function DisruptionTicker() {
  const disruptions = [
    { text: 'IPL Match Ends — CSK vs MI @ Chepauk', live: true },
    { text: 'Heavy Rain — Velachery Bypass Flood', live: true },
    { text: 'Marina Beach Weekend Crowd Surge', live: false },
    { text: 'Metro Phase-2 Work — Saidapet Stall', live: false },
    { text: 'Anna University Exams — Kotturpuram Congestion', live: false },
    { text: 'Government Hospital OPD Rush — Egmore', live: false },
  ];

  return (
    <footer className="flex h-9 w-full items-center border-t border-[#2a2a3a] bg-[#12121a] text-[#e8e8f0] overflow-hidden z-30 select-none shadow-inner">
      {/* Left Static Tag */}
      <div className="flex items-center gap-2 bg-[#1a1a26] border-r border-[#2a2a3a] px-3.5 h-full z-10 font-sans shadow-md flex-shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ef476f] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef476f]"></span>
        </span>
        <span className="text-[9px] font-bold tracking-wider uppercase whitespace-nowrap text-[#ef476f]">
          DISRUPTION INTELLIGENCE
        </span>
      </div>

      {/* Ticker Container */}
      <div className="relative flex flex-1 items-center overflow-hidden">
        <div className="flex animate-[ticker_40s_linear_infinite] hover:[animation-play-state:paused] whitespace-nowrap gap-12 pl-4">
          {/* Double the list to create a seamless loop */}
          {[...disruptions, ...disruptions].map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-[10px] font-bold font-sans tracking-wide">
              <span className="text-[#6b6b80]">📍</span>
              <span className="text-[#e8e8f0]">{item.text}</span>
              {item.live && (
                <span className="inline-flex items-center gap-1 text-[7px] bg-[#06d6a0]/10 border border-[#06d6a0]/30 text-[#06d6a0] px-1 rounded uppercase tracking-wider scale-90">
                  <span className="h-1 w-1 rounded-full bg-[#06d6a0] animate-pulse"></span>
                  LIVE
                </span>
              )}
              <span className="text-[#2a2a3a] ml-4">•</span>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
