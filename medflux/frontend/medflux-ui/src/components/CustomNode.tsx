import React from 'react';
import '@xyflow/react/dist/style.css';
import { Handle, Position } from '@xyflow/react';
import { Factory, Cog, Truck, Hospital, AlertTriangle } from 'lucide-react';
import { NetworkNode } from '../types';
import { useMedFlux } from '../store';

const ICONS: Record<string, any> = {
  supplier: Factory,
  manufacturer: Cog,
  distributor: Truck,
  hospital: Hospital
};

const TYPE_LABELS: Record<string, string> = {
  supplier: 'Supplier',
  manufacturer: 'Manufacturer',
  distributor: 'Distributor',
  hospital: 'Hospital'
};

export const CustomNode = ({ data, id }: { data: NetworkNode; id: string; }) => {
  const { isPlaying, selectedEntity, timelineDay, simulationResult } = useMedFlux();
  
  const isSelected = selectedEntity?.type === 'node' && selectedEntity.id === id;
  // Node automatically expands if timeline is playing, or if clicked
  const shouldExpand = isPlaying || isSelected;

  let currentInventory = data.inventory;
  let currentStress = data.stressIndex;

  // 1. Safely access the timeseries (Prefer 'optimized' so you see the AI's fixed version)
  const timeseries = simulationResult?.optimized?.timeseries || simulationResult?.baseline?.timeseries;

  // 2. If the simulation data is loaded and the current day exists
  if (timeseries && timeseries[timelineDay]) {
    // Read the inventory directly by the node's ID (e.g., "Supplier_1")
    const inventoryAtDay = timeseries[timelineDay][id];

    if (inventoryAtDay !== undefined) {
      currentInventory = inventoryAtDay;
      
      // 3. Calculate stress on the fly: (Max Capacity - Current Inventory) / Max Capacity
      const maxCap = data.max_capacity > 0 ? data.max_capacity : 1; // Prevent divide by zero
      currentStress = Math.max(0, Math.min(100, ((maxCap - currentInventory) / maxCap) * 100));
    }
  }

  const Icon = ICONS[data.type] || Factory;
  
  // Determine border colors based on the LIVE stress index
  let borderClass = 'border-slate-700';
  let glowClass = '';
  
  if (currentStress > 70) {
    borderClass = 'border-red-500';
    glowClass = 'shadow-[0_0_15px_rgba(239,68,68,0.5)]'; // Added explicit Tailwind glow
  } else if (currentStress > 40) {
    borderClass = 'border-orange-500';
  } else if (isSelected) {
    borderClass = 'border-blue-500';
  }

  return (
    <div
      className={`bg-slate-900 rounded-xl border-2 ${borderClass} ${glowClass} p-4 w-72 transition-all duration-300 text-slate-200`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-slate-400 border-2 border-slate-900"
      />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg">
            <Icon className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3
              className="font-bold text-lg leading-tight truncate w-40"
              title={data.name}
            >
              {data.name}
            </h3>
            <span className="text-sm text-slate-400 uppercase tracking-wider">
              {TYPE_LABELS[data.type]}
            </span>
          </div>
        </div>
        
        {data.is_shocked && (
          <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
        )}
      </div>

      {shouldExpand && (
        <div className="mt-4 space-y-4 border-t border-slate-800 pt-4 animate-in fade-in slide-in-from-top-2">
          
          <div className="flex justify-between items-center">
            <span className="text-base text-slate-400">Inventory</span>
            <span className="text-lg font-semibold">
              {Math.round(currentInventory).toLocaleString()}{' '}
              <span className="text-slate-500 text-sm font-normal">
                / {data.max_capacity.toLocaleString()}
              </span>
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-base text-slate-400">Demand</span>
            <span className="text-lg font-semibold">
              {data.demand.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-base text-slate-400">Stress Index</span>
              <span
                className={`text-lg font-bold ${
                  currentStress > 70 ? 'text-red-400' : currentStress > 40 ? 'text-orange-400' : 'text-green-400'
                }`}
              >
                {Math.round(currentStress)}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  currentStress > 70 ? 'bg-red-500' : currentStress > 40 ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{
                  width: `${Math.min(100, currentStress)}%`
                }}
              />
            </div>
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-slate-400 border-2 border-slate-900"
      />
    </div>
  );
};