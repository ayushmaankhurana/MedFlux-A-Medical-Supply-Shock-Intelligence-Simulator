import React from 'react';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { ShockControls } from './ShockControls';
import { NetworkNode, ShockConfig, SimulationState } from '../types';
import {
  PlayIcon,
  PauseIcon,
  RotateCcwIcon,
  GitCompareIcon } from
'lucide-react';
interface LeftPanelProps {
  nodes: NetworkNode[];
  shockConfig: ShockConfig;
  onUpdateShockConfig: (updates: Partial<ShockConfig>) => void;
  simState: SimulationState;
  onRun: () => void;
  onPause: () => void;
  onReset: () => void;
}
export function LeftPanel({
  nodes,
  shockConfig,
  onUpdateShockConfig,
  simState,
  onRun,
  onPause,
  onReset
}: LeftPanelProps) {
  const hospitalNodes = nodes.filter((n) => n.type === 'Tier 0');
  const hospitalOptions = [
  {
    value: '',
    label: 'Select Target Node...'
  },
  ...nodes.map((n) => ({
    value: n.id,
    label: n.name,
    subtitle: n.region || n.type
  }))];

  return (
    <div className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col h-full overflow-y-auto shrink-0 z-10 custom-scrollbar">
      <div className="p-5 space-y-8">
        <section className="mb-6">
          <div className="flex items-center mb-4">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2"></div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Material Profile
            </h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400">Resource Type</label>
              <Select 
                value="Insulin" 
                onChange={() => {}} // Hook this up to your scenarioSettings state
                options={[
                  { value: 'Insulin', label: 'Insulin (Cold Chain)' },
                  { value: 'PPE', label: 'PPE (Standard)' }
                ]} 
              />
            </div>

            <div>
              <label className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Shelf Life</span>
                <span>180 Days</span> {/* Make this dynamic */}
              </label>
              <input 
                type="range" 
                min="1" max="365" 
                className="w-full accent-emerald-500"
                defaultValue={180}
                // Hook this up to your scenarioSettings state: { shelf_life_days: e.target.value }
              />
            </div>
          </div>
        </section>
        {/* Target Selection */}
        <section>
          <div className="flex items-center mb-4">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 mr-2 shadow-[0_0_5px_rgba(6,182,212,0.8)]"></div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Target Selection
            </h2>
          </div>
          <Select
            value={shockConfig.targetNodeId || ''}
            onChange={(e) =>
            onUpdateShockConfig({
              targetNodeId: e.target.value || null
            })
            }
            options={hospitalOptions} />
          
          {!shockConfig.targetNodeId &&
          <p className="text-xs text-slate-500 mt-2 italic">
              Select a node to inject a shock.
            </p>
          }
        </section>

        <div className="h-px bg-slate-800 w-full"></div>

        {/* Shock Injection Settings */}
        <section>
          <div className="flex items-center mb-4">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mr-2 shadow-[0_0_5px_rgba(249,115,22,0.8)]"></div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Shock Parameters
            </h2>
          </div>
          <ShockControls config={shockConfig} onChange={onUpdateShockConfig} />
        </section>

        <div className="h-px bg-slate-800 w-full"></div>

        {/* Simulation Controls */}
        <section>
          <div className="flex items-center mb-4">
            <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mr-2 shadow-[0_0_5px_rgba(168,85,247,0.8)]"></div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Execution
            </h2>
          </div>

          <div className="space-y-3">
            {simState.isRunning && !simState.isPaused ?
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={onPause}>
              
                <PauseIcon className="h-4 w-4 mr-2" /> Pause Simulation
              </Button> :

            <Button
              variant="primary"
              className="w-full justify-center"
              onClick={onRun}>
              
                <PlayIcon className="h-4 w-4 mr-2" /> Run Simulation
              </Button>
            }

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full" onClick={onReset}>
                <RotateCcwIcon className="h-4 w-4 mr-2" /> Reset
              </Button>
              <Button variant="secondary" className="w-full">
                <GitCompareIcon className="h-4 w-4 mr-2" /> Compare
              </Button>
            </div>
          </div>
        </section>

        {/* Active Shocks Status */}
        {simState.activeShocks.length > 0 &&
        <section className="mt-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Active Disruptions
            </h3>
            <div className="space-y-2">
              {simState.activeShocks.map((shock, idx) => {
              const node = nodes.find((n) => n.id === shock.nodeId);
              return (
                <div
                  key={idx}
                  className="bg-orange-950/30 border border-orange-900/50 rounded p-2.5 flex justify-between items-center">
                  
                    <div>
                      <p className="text-xs font-medium text-orange-200">
                        {shock.type}
                      </p>
                      <p className="text-[10px] text-orange-400/70 truncate w-32">
                        {node?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-orange-300">
                        {shock.remainingDuration}d left
                      </p>
                      <p className="text-[10px] text-orange-500">
                        Mag: {shock.magnitude}%
                      </p>
                    </div>
                  </div>);

            })}
            </div>
          </section>
        }
      </div>
    </div>);

}