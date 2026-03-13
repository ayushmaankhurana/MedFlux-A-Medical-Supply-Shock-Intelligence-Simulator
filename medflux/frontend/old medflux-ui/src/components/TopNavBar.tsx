import React from 'react';
import {
  ActivityIcon,
  PlayIcon,
  PauseIcon,
  ZapIcon,
  RotateCcwIcon,
  UserIcon,
  SettingsIcon } from
'lucide-react';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { SupplyChainNetwork, SimulationState } from '../types';
interface TopNavBarProps {
  selectedNetworkId: SupplyChainNetwork;
  onChangeNetwork: (network: SupplyChainNetwork) => void;
  simState: SimulationState;
  onRun: () => void;
  onPause: () => void;
  onReset: () => void;
  onInjectShock: () => void;
  hasTargetNode: boolean;
}
export function TopNavBar({
  selectedNetworkId,
  onChangeNetwork,
  simState,
  onRun,
  onPause,
  onReset,
  onInjectShock,
  hasTargetNode
}: TopNavBarProps) {
  const networkOptions = [
  {
    value: 'Insulin Supply Chain',
    label: 'Insulin Supply Chain'
  },
  {
    value: 'PPE Supply Chain',
    label: 'PPE Supply Chain'
  },
  {
    value: 'Blood Distribution Network',
    label: 'Blood Distribution Network'
  }];

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20 relative shadow-md">
      {/* Logo & Title */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <ActivityIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight">
            MedFlux
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Medical Supply Shock Intelligence Simulator
          </p>
        </div>
      </div>

      {/* Center Controls */}
      <div className="flex-1 max-w-md mx-8">
        <Select
          value={selectedNetworkId}
          onChange={(e) =>
          onChangeNetwork(e.target.value as SupplyChainNetwork)
          }
          options={networkOptions}
          className="w-full" />
        
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center bg-slate-950 rounded-md p-1 border border-slate-800 mr-2">
          <div className="px-3 py-1 flex items-center space-x-2">
            <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
              Day
            </span>
            <span className="text-sm font-mono text-cyan-400 font-bold">
              {simState.time.toString().padStart(3, '0')}
            </span>
          </div>
        </div>

        {simState.isRunning && !simState.isPaused ?
        <Button
          variant="secondary"
          size="sm"
          onClick={onPause}
          className="w-28">
          
            <PauseIcon className="h-4 w-4 mr-2" /> Pause
          </Button> :

        <Button variant="primary" size="sm" onClick={onRun} className="w-28">
            <PlayIcon className="h-4 w-4 mr-2" /> Run Sim
          </Button>
        }

        <Button
          variant="warning"
          size="sm"
          onClick={onInjectShock}
          disabled={!hasTargetNode}
          className="w-32">
          
          <ZapIcon className="h-4 w-4 mr-2" /> Inject Shock
        </Button>

        <Button variant="ghost" size="sm" onClick={onReset} className="px-3">
          <RotateCcwIcon className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-slate-700 mx-2"></div>

        <button className="text-slate-400 hover:text-slate-200 transition-colors p-2">
          <SettingsIcon className="h-5 w-5" />
        </button>
        <button className="text-slate-400 hover:text-slate-200 transition-colors p-2">
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
            <UserIcon className="h-4 w-4" />
          </div>
        </button>
      </div>
    </header>);

}