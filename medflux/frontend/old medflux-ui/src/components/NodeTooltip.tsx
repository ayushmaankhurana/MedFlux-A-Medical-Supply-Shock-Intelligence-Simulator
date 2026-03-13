import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NetworkNode } from '../types';
import { XIcon } from 'lucide-react';
interface NodeTooltipProps {
  node: NetworkNode | null;
  position: {
    x: number;
    y: number;
  } | null;
  onClose: () => void;
}
export function NodeTooltip({ node, position, onClose }: NodeTooltipProps) {
  if (!node || !position) return null;
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Tier 3':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'Tier 2':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'Tier 1':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'Tier 0':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };
  const getStressColor = (stress: number) => {
    if (stress < 30) return 'bg-green-500';
    if (stress < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  // Adjust position so it doesn't go off screen
  const style = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: 'translate(15px, -50%)'
  };
  return (
    <AnimatePresence>
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
          x: 10
        }}
        animate={{
          opacity: 1,
          scale: 1,
          x: 15
        }}
        exit={{
          opacity: 0,
          scale: 0.95
        }}
        transition={{
          duration: 0.15
        }}
        className="absolute z-50 w-64 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl overflow-hidden pointer-events-auto"
        style={style}>
        
        <div className="flex justify-between items-start p-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white leading-tight pr-4">
              {node.name}
            </h3>
            <span
              className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded border ${getTierColor(node.type)}`}>
              
              {node.type} {node.region ? `• ${node.region}` : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors">
            
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3 space-y-3">
          {/* Inventory */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Inventory Level</span>
              <span className="font-mono text-slate-200">
                {Math.round(node.inventory)} / {node.max_capacity}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-500"
                style={{ width: `${(node.inventory / node.max_capacity) * 100}%` }} />
              
            </div>
          </div>

          {/* Stress Index */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Stress Index</span>
              <span className="font-mono text-slate-200">
                {Math.round(node.stressIndex)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getStressColor(node.stressIndex)}`}
                style={{
                  width: `${node.stressIndex}%`
                }} />
              
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/50">
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Lead Time</p>
              <p className="text-xs font-mono text-slate-300">
                {node.leadTime} days
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Status</p>
              <p className="text-xs font-medium text-slate-300">
                {node.stressIndex > 70 ?
                <span className="text-red-400">Critical</span> :
                node.stressIndex > 30 ?
                <span className="text-yellow-400">Warning</span> :

                <span className="text-green-400">Normal</span>
                }
              </p>
              <div className="pt-3 mt-3 border-t border-slate-800/50">
              <p className="text-[10px] text-slate-500 uppercase mb-2">Quick Edit (Live Network)</p>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  className="bg-slate-800 text-xs text-white p-1 rounded w-full border border-slate-700" 
                  defaultValue={node.inventory}
                  placeholder="Inventory"
                  onBlur={(e) => {/* Call your updateNode function here with { inventory: Number(e.target.value) } */}}
                />
                <input 
                  type="number" 
                  className="bg-slate-800 text-xs text-white p-1 rounded w-full border border-slate-700" 
                  defaultValue={node.max_capacity}
                  placeholder="Capacity"
                  onBlur={(e) => {/* Call your updateNode function here with { max_capacity: Number(e.target.value) } */}}
                />
              </div>
            </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>);

}