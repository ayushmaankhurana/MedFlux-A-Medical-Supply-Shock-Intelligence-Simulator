import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Save,
  Plus,
  Settings,
  User,
  Activity,
  Loader2,
  FolderOpen // Added for the Load menu
} from 'lucide-react';
import { useMedFlux } from '../store';
import { MEDICAL_RESOURCES } from '../mockData';
import { simulateNetwork } from '../api';

export const TopNav = () => {
  const {
    settings,
    nodes,
    edges,
    isPlaying,
    setIsPlaying,
    setTimelineDay,
    loadResourceNetwork,
    setSimulationResult,
    // NEW SUPABASE FUNCTIONS
    saveNetworkToDb,
    loadNetworkFromDb,
    savedNetworks
  } = useMedFlux();

  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Controls the Load menu

  const handleRunSimulation = async () => {
    setIsLoading(true);
    setIsPlaying(false);
    try {
      const result = await simulateNetwork(settings, nodes, edges);
      setSimulationResult(result);
      setTimelineDay(0);
      setIsPlaying(true);
    } catch (error) {
      console.error('Simulation failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTimelineDay(0);
    setSimulationResult(null);
  };

  // Triggers the cloud save with a name prompt
  const handleSaveClick = async () => {
    const scenarioName = window.prompt("Enter a name for this scenario:", "My Hackathon Network");
    if (scenarioName) {
      await saveNetworkToDb(scenarioName);
    }
  };

  return (
    <header className="h-20 bg-medflux-panel border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20 relative">
      {/* Left: Logo & Resource Selection */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 text-blue-400">
          <Activity className="w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            MedFlux
          </h1>
        </div>

        <div className="h-8 w-px bg-slate-700 mx-2"></div>

        <select
          value={settings.specific_resource}
          onChange={(e) => loadResourceNetwork(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white text-lg rounded-lg px-4 py-2 outline-none focus:border-blue-500 min-w-[200px]"
        >
          {MEDICAL_RESOURCES.map((res) => (
            <option key={res} value={res}>
              {res}
            </option>
          ))}
        </select>

        <button
          onClick={() => loadResourceNetwork(MEDICAL_RESOURCES[0])}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Create New"
        >
          <Plus className="w-6 h-6" />
        </button>
        
        {/* NEW: Cloud Save Button */}
        <button
          onClick={handleSaveClick}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Save to Cloud"
        >
          <Save className="w-6 h-6" />
        </button>

        {/* NEW: Load Scenario Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Load Scenario"
          >
            <FolderOpen className="w-6 h-6" />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 z-50 overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-700 text-sm font-bold text-slate-300">
                Saved Scenarios
              </div>
              <div className="max-h-60 overflow-y-auto">
                {savedNetworks.length === 0 ? (
                  <div className="px-4 py-3 text-slate-400 text-sm italic">
                    No scenarios saved yet.
                  </div>
                ) : (
                  savedNetworks.map((net) => (
                    <button
                      key={net.id}
                      onClick={() => {
                        loadNetworkFromDb(net.id);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-white hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
                    >
                      <div className="font-medium truncate">{net.name}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(net.created_at).toLocaleDateString()}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Playback & Simulation Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleRunSimulation}
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-semibold text-lg transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Activity className="w-6 h-6" />
          )}
          Run API Simulation
        </button>

        <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2.5 rounded-md transition-colors ${isPlaying ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>
          <button
            onClick={handleReset}
            className="p-2.5 rounded-md text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Right: Profile & Settings */}
      <div className="flex items-center gap-4">
        <button className="p-2.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition-colors">
          <Settings className="w-6 h-6" />
        </button>
        <button className="p-2.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition-colors">
          <User className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};