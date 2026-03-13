import React from 'react';
import { useMedFlux } from '../store';
import { AlertCircle, Clock, TrendingDown } from 'lucide-react';
const SHOCK_TYPES = [
'Facility Offline',
'Demand Spike',
'Transport Delay',
'Capacity Reduction'];

export const LeftPanel = () => {
  const {
    settings,
    setSettings,
    nodes,
    timelineDay,
    setTimelineDay,
    isPlaying,
    simulationResult
  } = useMedFlux();
  return (
    <div className="w-96 bg-medflux-panel border-r border-slate-800 flex flex-col h-full overflow-y-auto shrink-0 z-20">
      <div className="p-6 space-y-8">
        {/* Scenario Settings */}
        <section>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <SettingsIcon /> Scenario Config
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-base text-slate-400 mb-2">
                Budget ($)
              </label>
              <input
                type="number"
                min="0"
                value={settings.budget}
                onChange={(e) =>
                setSettings({
                  ...settings,
                  budget: Number(e.target.value)
                })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-lg text-white focus:border-blue-500 outline-none" />
              
            </div>
            <div>
              <label className="block text-base text-slate-400 mb-2">
                Shelf Life (Days)
              </label>
              <input
                type="number"
                min="0"
                value={settings.shelf_life_days}
                onChange={(e) =>
                setSettings({
                  ...settings,
                  shelf_life_days: Number(e.target.value)
                })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-lg text-white focus:border-blue-500 outline-none" />
              
            </div>
          </div>
        </section>

        <hr className="border-slate-800" />

        {/* Shock Injection */}
        <section>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-orange-500" /> Shock Injection
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-base text-slate-400 mb-2">
                Shock Type
              </label>
              <select
                value={settings.shock_type_selected}
                onChange={(e) =>
                setSettings({
                  ...settings,
                  shock_type_selected: e.target.value as any
                })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-lg text-white focus:border-blue-500 outline-none">
                
                {SHOCK_TYPES.map((t) =>
                <option key={t} value={t}>
                    {t}
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-base text-slate-400 mb-2">
                Magnitude: {Math.round(settings.shock_magnitude * 100)}%
              </label>
              <input
                type="range"
                min="0.01"
                max="1"
                step="0.01"
                value={settings.shock_magnitude}
                onChange={(e) =>
                setSettings({
                  ...settings,
                  shock_magnitude: Number(e.target.value)
                })
                }
                className="w-full accent-orange-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
              
            </div>

            <div>
              <label className="block text-base text-slate-400 mb-2">
                Target Node
              </label>
              <select
                value={settings.shocked_node_id || ''}
                onChange={(e) =>
                setSettings({
                  ...settings,
                  shocked_node_id: e.target.value
                })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-lg text-white focus:border-blue-500 outline-none">
                
                <option value="">Auto-select based on type</option>
                {nodes.map((n) =>
                <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                )}
              </select>
            </div>
          </div>
        </section>

        <hr className="border-slate-800" />

        {/* Timeline Scrubber */}
        <section className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" /> Timeline
            </h3>
            <span className="text-blue-400 font-bold text-lg">
              Day {timelineDay}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={timelineDay}
            onChange={(e) => {
              if (!isPlaying) setTimelineDay(Number(e.target.value));
            }}
            disabled={isPlaying}
            className="w-full accent-blue-500 h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50" />
          
        </section>

        {/* Results Dashboard */}
        {simulationResult &&
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-green-400" /> Results
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-center items-center text-center">
                <span className="text-slate-400 text-base mb-1">
                  Recovery Time
                </span>
              <span className="text-3xl font-bold text-white">
      {/* Notice the _steps added below! */}
    {simulationResult.baseline.metrics.recovery_time_steps ?? 0}{' '}
    <span className="text-lg text-slate-500">days</span>
  </span>
</div>

              <div
              className={`bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-center items-center text-center transition-all duration-500 ${simulationResult.baseline.metrics.peak_shortage > 0 ? 'border-red-500/50 shadow-glow-red' : ''}`}>
              
                <span className="text-slate-400 text-base mb-1">
                  Peak Shortage
                </span>
                <span
                className={`text-3xl font-bold ${simulationResult.baseline.metrics.peak_shortage > 0 ? 'text-red-400 text-glow-critical' : 'text-white'}`}>
                
                  {simulationResult.baseline.metrics.peak_shortage.toLocaleString()}
                </span>
              </div>
            </div>

            {simulationResult.optimization_plan?.recommendations &&
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-5">
                <h4 className="text-blue-400 font-bold text-lg mb-3">
                  AI Recommendations
                </h4>
                <ul className="space-y-3">
                  {simulationResult.optimization_plan.recommendations.map(
                (rec, i) =>
                <li
                  key={i}
                  className="text-slate-300 text-base flex items-start gap-2">
                  
                        <span className="text-blue-500 mt-1">•</span> {rec}
                      </li>

              )}
                </ul>
              </div>
          }
          </section>
        }
      </div>
    </div>);

};
const SettingsIcon = () =>
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
  className="text-slate-400">
  
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>;