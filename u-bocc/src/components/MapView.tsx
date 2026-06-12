'use client';

import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0a0a0f] text-[#6b6b80]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4a9eff] border-t-transparent"></div>
        <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Initializing Chennai MTC Command System...</span>
      </div>
    </div>
  ),
});

export default MapView;
