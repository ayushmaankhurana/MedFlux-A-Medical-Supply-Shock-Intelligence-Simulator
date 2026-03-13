import { useState, useEffect, useRef } from "react";
import { medfluxAPI } from "../services/api";
import {
  NetworkNode,
  NetworkEdge,
  ShockConfig,
  SupplyChainNetwork,
  SimulationState
} from "../types";
import { networks } from "../data/networkData";

export function useSimulation() {
  const [selectedNetworkId, setSelectedNetworkId] = useState<SupplyChainNetwork>("Insulin Supply Chain");
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [initialNodes, setInitialNodes] = useState<NetworkNode[]>([]);
  const [initialEdges, setInitialEdges] = useState<NetworkEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Store the massive backend response here
  const [simulationData, setSimulationData] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [scenarioSettings, setScenarioSettings] = useState({
    budget: 50000,
    shock_type_selected: "Facility Offline",
    specific_resource: "Medical Supplies",
    shelf_life: 180
  });

  const [shockConfig, setShockConfig] = useState<ShockConfig>({
    type: "Node Failure",
    magnitude: 80,
    duration: 14,
    targetNodeId: null
  });

  const [simState, setSimState] = useState<SimulationState>({
    isRunning: false,
    isPaused: false,
    time: 0,
    activeShocks: []
  });

  // Load initial network
  useEffect(() => {
    const network = networks.find((n) => n.id === selectedNetworkId);
    if (!network) return;

    const newNodes = JSON.parse(JSON.stringify(network.nodes));
    const newEdges = JSON.parse(JSON.stringify(network.edges));

    setNodes(newNodes);
    setEdges(newEdges);
    setInitialNodes(JSON.parse(JSON.stringify(newNodes)));
    setInitialEdges(JSON.parse(JSON.stringify(newEdges)));
    setSimulationData(null);
    setSimState(prev => ({ ...prev, time: 0, isRunning: false, isPaused: false }));
  }, [selectedNetworkId]);

  const changeNetwork = (networkId: SupplyChainNetwork) => setSelectedNetworkId(networkId);
  const selectNode = (nodeId: string | null) => setSelectedNodeId(nodeId);
  const updateShockConfig = (updates: Partial<ShockConfig>) => setShockConfig((prev) => ({ ...prev, ...updates }));

  // Visual shock prep (UI only)
  const injectShock = () => {
    if (!shockConfig.targetNodeId) return;
    setNodes((prevNodes) =>
      prevNodes.map((node) => ({
        ...node,
        is_shocked: node.id === shockConfig.targetNodeId
      }))
    );
  };

  // 🔥 TRIGGER REAL BACKEND AI
  const runSimulation = async () => {
    setLoading(true);
    try {
      // 1. Build the exact Pydantic payload the backend expects
      const payload = {
        scenario_settings: {
          budget: scenarioSettings.budget,
          shock_type_selected: shockConfig.type === "Node Failure" ? "Facility Offline" : shockConfig.type,
          specific_resource: scenarioSettings.specific_resource,
          shelf_life_days: scenarioSettings.shelf_life,
          shocked_node_id: shockConfig.targetNodeId,
          shock_magnitude: shockConfig.magnitude / 100, // Converts 80% to 0.8
          simulation_steps: 30
        },
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type === 'Tier 3' ? 'supplier' : n.type === 'Tier 0' ? 'hospital' : 'distributor',
          inventory: n.inventory,
          processing_duration: n.processing_duration || 1,
          max_capacity: n.max_capacity || 1000,
          demand: n.demand || 0,
          fixed_upgrade_cost: n.fixed_upgrade_cost || 5000,
          upgrade_capacity_boost: n.upgrade_capacity_boost || 500,
          holding_cost_per_unit: n.holding_cost_per_unit || 1.5,
          is_shocked: n.id === shockConfig.targetNodeId || n.is_shocked
        })),
        edges: edges.map(e => ({
          source: e.source,
          target: e.target,
          capacity: e.capacity || 500,
          delivery_time: e.delivery_time || 2,
          shipping_cost_per_unit: e.shipping_cost_per_unit || 2.0
        }))
      };

      // 2. Await the Optimizer & Simulation math
      const data = await medfluxAPI.simulate(payload);
      
      // 3. Save the results
      setSimulationData(data);
      setMetrics(data.baseline.metrics);
      setRecommendations(data.optimization_plan.recommendations || []);

      // 4. Start the player
      setSimState((prev) => ({
        ...prev,
        isRunning: true,
        isPaused: false,
        time: 0
      }));

    } catch (err) {
      console.error("Simulation API error", err);
      alert("Backend connection failed. Ensure FastAPI is running on port 8000.");
    }
    setLoading(false);
  };

  const pauseSimulation = () => setSimState((prev) => ({ ...prev, isRunning: false, isPaused: true }));

  const resetSimulation = () => {
    setSimState({ isRunning: false, isPaused: false, time: 0, activeShocks: [] });
    setNodes(JSON.parse(JSON.stringify(initialNodes)));
    setEdges(JSON.parse(JSON.stringify(initialEdges)));
    setSimulationData(null);
    setMetrics(null);
    setRecommendations([]);
  };

  // 🎬 THE BACKEND PLAYBACK LOOP
  useEffect(() => {
    if (!simState.isRunning || simState.isPaused || !simulationData) return;

    simIntervalRef.current = setInterval(() => {
      setSimState((prev) => {
        const nextTime = prev.time + 1;
        
        // Stop the simulation if we hit the end of the backend's data (30 days)
        if (nextTime >= simulationData.steps) {
          if (simIntervalRef.current) clearInterval(simIntervalRef.current);
          return { ...prev, isRunning: false };
        }

        // Fetch the exact inventory snapshot for 'nextTime' (Day X)
        // Note: Change 'baseline' to 'optimized' here if you want to view the AI's fixed version!
        const currentFrame = simulationData.baseline.timeseries[nextTime];

        // Update the SVG circles to reflect the true math
        setNodes((currentNodes) => 
          currentNodes.map(node => ({
            ...node,
            inventory: currentFrame[node.id] !== undefined ? currentFrame[node.id] : node.inventory
          }))
        );

        return { ...prev, time: nextTime };
      });
    }, 1000); // 1 second per day

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [simState.isRunning, simState.isPaused, simulationData]);

  return {
    selectedNetworkId,
    nodes,
    edges,
    shockConfig,
    simState,
    selectedNodeId,
    metrics,
    recommendations,
    loading,
    changeNetwork,
    updateShockConfig,
    injectShock,
    runSimulation,
    pauseSimulation,
    resetSimulation,
    selectNode
  };
}