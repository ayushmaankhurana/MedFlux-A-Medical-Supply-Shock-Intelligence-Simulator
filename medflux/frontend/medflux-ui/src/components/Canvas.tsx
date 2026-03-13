import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Edge,
  Node,
  Connection,
  Panel,
  MarkerType } from
'@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMedFlux } from '../store';
import { CustomNode } from './CustomNode';
import { Plus } from 'lucide-react';
const nodeTypes = {
  custom: CustomNode
};
const SWIMLANES = [
{
  id: 'supplier',
  label: 'Suppliers',
  x: 0
},
{
  id: 'manufacturer',
  label: 'Manufacturers',
  x: 400
},
{
  id: 'distributor',
  label: 'Distributors',
  x: 800
},
{
  id: 'hospital',
  label: 'Hospitals',
  x: 1200
}];

export const Canvas = () => {
  const { nodes, edges, setEdges, isPlaying, setSelectedEntity, addNode } =
  useMedFlux();
  // Map our domain nodes to React Flow nodes
  const rfNodes: Node[] = useMemo(() => {
    const typeCounts: Record<string, number> = {
      supplier: 0,
      manufacturer: 0,
      distributor: 0,
      hospital: 0
    };
    return nodes.map((node) => {
      const laneIndex = SWIMLANES.findIndex((l) => l.id === node.type);
      const x = laneIndex * 400 + 50;
      const y = (typeCounts[node.type] || 0) * 250 + 100;
      typeCounts[node.type] = (typeCounts[node.type] || 0) + 1;
      return {
        id: node.id,
        type: 'custom',
        position: {
          x,
          y
        },
        data: node
      };
    });
  }, [nodes]);
  // Map domain edges to React Flow edges
  const rfEdges: Edge[] = useMemo(() => {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: isPlaying,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isPlaying ? '#60a5fa' : '#475569',
        width: 20,
        height: 20
      },
      style: {
        stroke: isPlaying ? '#60a5fa' : '#475569',
        strokeWidth: 3
      }
    }));
  }, [edges, isPlaying]);
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      setEdges((eds) => [
      ...eds,
      {
        id: `e_${params.source}_${params.target}`,
        source: params.source,
        target: params.target,
        capacity: 1000,
        delivery_time: 1,
        shipping_cost_per_unit: 1
      }]
      );
    },
    [setEdges]
  );
  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedEntity({
      type: 'node',
      id: node.id
    });
  };
  const onEdgeClick = (_: React.MouseEvent, edge: Edge) => {
    setSelectedEntity({
      type: 'edge',
      id: edge.id
    });
  };
  const onPaneClick = () => {
    setSelectedEntity(null);
  };
  return (
    <div className="flex-1 relative h-full bg-medflux-bg">
      {/* Swimlanes Background */}
      <div className="absolute inset-0 flex pointer-events-none z-0">
        {SWIMLANES.map((lane, i) =>
        <div
          key={lane.id}
          className="flex-1 border-r border-slate-800/50 bg-slate-800/20 relative border-dashed">
          
            <div className="absolute top-6 left-0 w-full text-center text-slate-400 font-bold text-xl tracking-widest uppercase">
              {lane.label}
            </div>
          </div>
        )}
      </div>

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        fitView
        className="z-10">
        
        <Background color="#334155" gap={20} size={2} />
        <Controls className="bg-slate-900 border-slate-700" />
        <Panel position="bottom-center" className="mb-6">
          <button
            onClick={addNode}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-semibold text-lg shadow-lg transition-colors">
            
            <Plus className="w-6 h-6" />
            Add Node
          </button>
        </Panel>
      </ReactFlow>
    </div>);

};