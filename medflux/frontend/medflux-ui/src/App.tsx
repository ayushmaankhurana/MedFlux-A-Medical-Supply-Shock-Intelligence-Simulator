import React from 'react';
import { MedFluxProvider } from './store';
import { TopNav } from './components/TopNav';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { Canvas } from './components/Canvas';
export function App() {
  return (
    <MedFluxProvider>
      <div className="flex flex-col h-screen w-full bg-medflux-bg text-slate-200 overflow-hidden font-sans">
        <TopNav />
        <div className="flex flex-1 overflow-hidden relative">
          <LeftPanel />
          <Canvas />
          <RightPanel />
        </div>
      </div>
    </MedFluxProvider>);

}