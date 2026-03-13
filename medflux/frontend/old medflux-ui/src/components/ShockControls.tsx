import React from 'react';
import {
  XCircleIcon,
  TrendingUpIcon,
  TruckIcon,
  MinusCircleIcon } from
'lucide-react';
import { ShockConfig, ShockType } from '../types';
import { Slider } from './ui/Slider';
interface ShockControlsProps {
  config: ShockConfig;
  onChange: (updates: Partial<ShockConfig>) => void;
}
export function ShockControls({ config, onChange }: ShockControlsProps) {
  const shockTypes: {
    type: ShockType;
    icon: React.ReactNode;
    label: string;
  }[] = [
  {
    type: 'Node Failure',
    icon: <XCircleIcon className="h-4 w-4" />,
    label: 'Failure'
  },
  {
    type: 'Demand Surge',
    icon: <TrendingUpIcon className="h-4 w-4" />,
    label: 'Surge'
  },
  {
    type: 'Transport Delay',
    icon: <TruckIcon className="h-4 w-4" />,
    label: 'Delay'
  },
  {
    type: 'Capacity Reduction',
    icon: <MinusCircleIcon className="h-4 w-4" />,
    label: 'Capacity'
  }];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Shock Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {shockTypes.map(({ type, icon, label }) => {
            const isActive = config.type === type;
            return (
              <button
                key={type}
                onClick={() =>
                onChange({
                  type
                })
                }
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-xs font-medium transition-all border ${isActive ? 'bg-orange-950/50 border-orange-500/50 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.15)]' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                
                {icon}
                <span>{label}</span>
              </button>);

          })}
        </div>
      </div>

      <div className="space-y-5 bg-slate-900/50 p-4 rounded-lg border border-slate-800/50">
        <Slider
          label="Magnitude"
          value={config.magnitude}
          onChange={(val) =>
          onChange({
            magnitude: val
          })
          }
          min={1}
          max={100}
          unit="%" />
        

        <Slider
          label="Duration"
          value={config.duration}
          onChange={(val) =>
          onChange({
            duration: val
          })
          }
          min={1}
          max={30}
          unit="d" />
        
      </div>
    </div>);

}