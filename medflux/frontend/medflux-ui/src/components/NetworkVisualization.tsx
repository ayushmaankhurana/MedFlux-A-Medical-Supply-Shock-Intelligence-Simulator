import React, { useEffect, useState, useRef } from 'react';
import { NetworkNode, NetworkEdge, SimulationState } from '../types';
import { NodeTooltip } from './NodeTooltip';

interface NetworkVisualizationProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  simState: SimulationState;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;

  // NEW (for backend simulation playback)
  inventoryHistory?: any;
}

export function NetworkVisualization({
  nodes,
  edges,
  simState,
  selectedNodeId,
  onSelectNode
}: NetworkVisualizationProps) {

  const containerRef = useRef<HTMLDivElement>(null);

  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0
  });

  useEffect(() => {

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();

    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);

  }, []);

  const handleNodeClick = (e: React.MouseEvent, node: NetworkNode) => {

    e.stopPropagation();

    onSelectNode(node.id);

    if (containerRef.current) {

      const rect = containerRef.current.getBoundingClientRect();

      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });

    }
  };

  const handleBackgroundClick = () => {

    onSelectNode(null);
    setTooltipPos(null);

  };

  const getTierColor = (tier: string) => {

    switch (tier) {
      case 'Tier 3': return '#3B82F6';
      case 'Tier 2': return '#8B5CF6';
      case 'Tier 1': return '#F59E0B';
      case 'Tier 0': return '#10B981';
      default: return '#94A3B8';
    }
  };

  // NEW: Stress color override
  const getStressColor = (stress: number, tierColor: string) => {

    if (stress > 70) return "#ef4444";
    if (stress > 40) return "#f59e0b";

    return tierColor;
  };

  const getPixelCoords = (xPct: number, yPct: number) => {

    const paddingX = 100;
    const paddingY = 60;

    const usableWidth = dimensions.width - paddingX * 2;
    const usableHeight = dimensions.height - paddingY * 2;

    return {
      x: paddingX + (xPct / 100) * usableWidth,
      y: paddingY + (yPct / 100) * usableHeight
    };
  };

  return (

    <div
      ref={containerRef}
      className="flex-1 relative bg-[#0a0e1a] overflow-hidden grid-pattern"
      onClick={handleBackgroundClick}
    >

      {/* Tier Labels */}
      <div className="absolute inset-0 pointer-events-none opacity-20 flex justify-between px-[100px] pt-4">

        <div className="text-blue-400 font-bold tracking-widest uppercase text-sm">
          Tier 3: Raw Materials
        </div>

        <div className="text-purple-400 font-bold tracking-widest uppercase text-sm">
          Tier 2: Manufacturers
        </div>

        <div className="text-orange-400 font-bold tracking-widest uppercase text-sm">
          Tier 1: Distributors
        </div>

        <div className="text-green-400 font-bold tracking-widest uppercase text-sm">
          Tier 0: Hospitals
        </div>

      </div>

      {dimensions.width > 0 && (

        <svg className="absolute inset-0 w-full h-full pointer-events-none">

          <defs>

            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#334155" />
            </marker>

            <marker
              id="arrowhead-active"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#06b6d4" />
            </marker>

            {/* Glow Filters */}
            <filter id="glow-low" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="glow-high" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

          </defs>

          {/* EDGES */}

          {edges.map((edge) => {

            const source = nodes.find((n) => n.id === edge.source);
            const target = nodes.find((n) => n.id === edge.target);

            if (!source || !target) return null;

            const s = getPixelCoords(source.x, source.y);
            const t = getPixelCoords(target.x, target.y);

            const dx = t.x - s.x;

            const cp1x = s.x + dx * 0.5;
            const cp2x = t.x - dx * 0.5;

            const pathData =
              `M ${s.x} ${s.y} C ${cp1x} ${s.y}, ${cp2x} ${t.y}, ${t.x} ${t.y}`;

            const isRunning = simState.isRunning && !simState.isPaused;

            return (

              <g key={edge.id}>

                <path
                  d={pathData}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="2"
                  markerEnd={`url(#${isRunning ? 'arrowhead-active' : 'arrowhead'})`}
                />

                {isRunning && (

                  <path
                    d={pathData}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    strokeDasharray="8 8"
                    className="animate-flow"
                    opacity="0.5"
                  />

                )}

              </g>
            );

          })}

          {/* NODES */}

          {nodes.map((node) => {

            const coords = getPixelCoords(node.x, node.y);

            const isSelected = selectedNodeId === node.id;
            const isDimmed = selectedNodeId !== null && !isSelected;

const fillPercentage = node.max_capacity > 0 ? (node.inventory / node.max_capacity) : 0;
const radius = 15 + (fillPercentage) * 20;
            const tierColor = getTierColor(node.type);
            const color = getStressColor(node.stressIndex, tierColor);

            const isHighlyStressed = node.stressIndex > 70;

            return (

              <g
                key={node.id}
                transform={`translate(${coords.x}, ${coords.y})`}
                className={`pointer-events-auto cursor-pointer transition-opacity duration-300 ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
                onClick={(e) => handleNodeClick(e as any, node)}
              >

                {/* Shock ripple animation */}

                {node.is_shocked && simState.isRunning && (

                  <circle
                    r={radius + 30}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    opacity="0.5"
                    className="animate-ping"
                  />

                )}

                {/* Node outer */}

                <circle
                  r={radius}
                  fill="#0f172a"
                  stroke={color}
                  strokeWidth={isSelected ? 4 : 2}
                  className="transition-all duration-300"
                />

                {/* Inventory fill */}

            <circle
  r={radius - 4}
  fill={color}
  opacity={fillPercentage}
/>

                {/* Node label */}

                <text
                  y={radius + 16}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="11"
                  className="select-none"
                >
                  {node.name}
                </text>

                {/* Stress label */}

                {node.stressIndex > 40 && (

                  <text
                    y={-radius - 8}
                    textAnchor="middle"
                    fill="#ef4444"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {Math.round(node.stressIndex)}%
                  </text>

                )}

              </g>
            );

          })}

        </svg>

      )}

      {/* Tooltip */}

      {selectedNodeId && tooltipPos && (

        <NodeTooltip
          node={nodes.find((n) => n.id === selectedNodeId) || null}
          position={tooltipPos}
          onClose={() => {
            onSelectNode(null);
            setTooltipPos(null);
          }}
        />

      )}

    </div>

  );
}