import React from 'react';
import { useSimulation } from './hooks/useSimulation';
import { TopNavBar } from './components/TopNavBar';
import { LeftPanel } from './components/LeftPanel';
import { NetworkVisualization } from './components/NetworkVisualization';
export function App() {
  const {
    selectedNetworkId,
    nodes,
    edges,
    shockConfig,
    simState,
    selectedNodeId,
    changeNetwork,
    updateShockConfig,
    injectShock,
    runSimulation,
    pauseSimulation,
    resetSimulation,
    selectNode
  } = useSimulation();
  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0e1a] text-slate-200 overflow-hidden font-sans">
      <TopNavBar
        selectedNetworkId={selectedNetworkId}
        onChangeNetwork={changeNetwork}
        simState={simState}
        onRun={runSimulation}
        onPause={pauseSimulation}
        onReset={resetSimulation}
        onInjectShock={injectShock}
        hasTargetNode={!!shockConfig.targetNodeId} />
      

      <div className="flex flex-1 overflow-hidden">
        <LeftPanel
          nodes={nodes}
          shockConfig={shockConfig}
          onUpdateShockConfig={updateShockConfig}
          simState={simState}
          onRun={runSimulation}
          onPause={pauseSimulation}
          onReset={resetSimulation} />
        

        <NetworkVisualization
          nodes={nodes}
          edges={edges}
          simState={simState}
          selectedNodeId={selectedNodeId}
          onSelectNode={selectNode} />
        
      </div>
    </div>);

}