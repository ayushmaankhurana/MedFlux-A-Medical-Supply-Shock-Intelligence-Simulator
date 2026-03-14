import React, { useEffect, useState, createContext, useContext } from 'react';
import {
  NetworkNode,
  NetworkEdge,
  ScenarioSettings,
  SimulationResult
} from './types';
import { MEDICAL_RESOURCES, generateMockNetwork } from './mockData';
import { supabase } from './supabaseClient'; // Make sure this path is correct!
import { Session } from '@supabase/supabase-js';
interface SelectedEntity {
  type: 'node' | 'edge';
  id: string;
}

interface MedFluxState {
  savedNetworks: any[];
  fetchSavedNetworks: () => Promise<void>;
  saveNetworkToDb: (scenarioName: string) => Promise<void>;
  loadNetworkFromDb: (id: string) => Promise<void>;
  
  settings: ScenarioSettings;
  setSettings: React.Dispatch<React.SetStateAction<ScenarioSettings>>;
  nodes: NetworkNode[];
  setNodes: React.Dispatch<React.SetStateAction<NetworkNode[]>>;
  edges: NetworkEdge[];
  setEdges: React.Dispatch<React.SetStateAction<NetworkEdge[]>>;
  timelineDay: number;
  setTimelineDay: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  selectedEntity: SelectedEntity | null;
  setSelectedEntity: React.Dispatch<React.SetStateAction<SelectedEntity | null>>;
  simulationResult: SimulationResult | null;
  setSimulationResult: React.Dispatch<React.SetStateAction<SimulationResult | null>>;

  loadResourceNetwork: (resource: string) => void;
  saveNetwork: () => void;
  updateNode: (id: string, updates: Partial<NetworkNode>) => void;
  updateEdge: (id: string, updates: Partial<NetworkEdge>) => void;
  deleteEntity: () => void;
  addNode: () => void;
  session: Session | null;
  isLoadingAuth: boolean;
  logout: () => Promise<void>;
}

const MedFluxContext = createContext<MedFluxState | undefined>(undefined);

export const MedFluxProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoadingAuth(false);
    });

    // Listen for logins/logouts
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };
  const [settings, setSettings] = useState<ScenarioSettings>({
    budget: 50000,
    shock_type_selected: 'Facility Offline',
    specific_resource: MEDICAL_RESOURCES[0],
    shelf_life_days: 30,
    shock_magnitude: 0.8,
    shocked_node_id: null
  });

  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [timelineDay, setTimelineDay] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  
  // NEW: State to hold the list of user's saved scenarios
  const [savedNetworks, setSavedNetworks] = useState<any[]>([]);

  // ==========================================
  // SUPABASE CLOUD FUNCTIONS
  // ==========================================

  const fetchSavedNetworks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Exit if not logged in

    const { data, error } = await supabase
      .from('network_structures')
      .select('id, name, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching networks:", error);
    } else if (data) {
      setSavedNetworks(data);
    }
  };

  const saveNetworkToDb = async (scenarioName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to save scenarios to the cloud.");
      return;
    }

    // Compress the entire map into a single JSON object
    const structurePayload = { settings, nodes, edges };

    const { error } = await supabase
      .from('network_structures')
      .insert({
        user_id: user.id, // RLS requires this to match!
        name: scenarioName,
        structure: structurePayload
      });

    if (error) {
      console.error("Save error:", error);
      alert("Failed to save network.");
    } else {
      alert("Network saved to the cloud successfully!");
      fetchSavedNetworks(); // Refresh the list
    }
  };

  const loadNetworkFromDb = async (id: string) => {
    const { data, error } = await supabase
      .from('network_structures')
      .select('structure')
      .eq('id', id)
      .single();

    if (error) {
      console.error("Load error:", error);
      alert("Failed to load network.");
    } else if (data && data.structure) {
      // Overwrite the current React Flow state with the saved data
      setSettings(data.structure.settings);
      setNodes(data.structure.nodes);
      setEdges(data.structure.edges);
      
      // Reset the timeline and results
      setTimelineDay(0);
      setIsPlaying(false);
      setSimulationResult(null);
      setSelectedEntity(null);
      alert("Network loaded successfully!");
    }
  };

  // Fetch saved networks immediately when the app loads
  useEffect(() => {
    fetchSavedNetworks();
  }, []);

  // ==========================================
  // EXISTING LOCAL FUNCTIONS
  // ==========================================

  // Load initial local fallback data
  useEffect(() => {
    const saved = localStorage.getItem('medflux_network');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed.settings);
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
      } catch (e) {
        loadResourceNetwork(MEDICAL_RESOURCES[0]);
      }
    } else {
      loadResourceNetwork(MEDICAL_RESOURCES[0]);
    }
  }, []);

  // Playback loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimelineDay((prev) => {
          if (prev >= 30) {
            setIsPlaying(false);
            return 30;
          }
          return prev + 1;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Sync nodes with AWS Simulation Data when the timeline changes
  useEffect(() => {
    if (!simulationResult || !simulationResult.baseline?.timeseries) return;

    const todayData = simulationResult.baseline.timeseries[timelineDay];
    if (!todayData) return;

    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const newInventoryLevel = todayData[node.id];

        if (newInventoryLevel !== undefined) {
          const calculatedStress = Math.min(
            100,
            Math.max(0, 100 - (newInventoryLevel / node.max_capacity) * 100)
          );

          return {
            ...node,
            inventory: newInventoryLevel,
            stressIndex: Math.floor(calculatedStress)
          };
        }
        return node;
      })
    );
  }, [timelineDay, simulationResult]);

  const loadResourceNetwork = (resource: string) => {
    const { nodes: newNodes, edges: newEdges } = generateMockNetwork(resource);
    setNodes(newNodes);
    setEdges(newEdges);
    setSettings((prev) => ({
      ...prev,
      specific_resource: resource,
      shocked_node_id: newNodes[0].id
    }));
    setTimelineDay(0);
    setIsPlaying(false);
    setSimulationResult(null);
    setSelectedEntity(null);
  };

  const saveNetwork = () => {
    localStorage.setItem(
      'medflux_network',
      JSON.stringify({
        settings,
        nodes,
        edges
      })
    );
    alert('Local fallback network saved!');
  };

  const updateNode = (id: string, updates: Partial<NetworkNode>) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );
  };

  const updateEdge = (id: string, updates: Partial<NetworkEdge>) => {
    setEdges((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const deleteEntity = () => {
    if (!selectedEntity) return;
    if (selectedEntity.type === 'node') {
      setNodes((prev) => prev.filter((n) => n.id !== selectedEntity.id));
      setEdges((prev) =>
        prev.filter(
          (e) => e.source !== selectedEntity.id && e.target !== selectedEntity.id
        )
      );
    } else {
      setEdges((prev) => prev.filter((e) => e.id !== selectedEntity.id));
    }
    setSelectedEntity(null);
  };

  const addNode = () => {
    const newNode: NetworkNode = {
      id: `NewNode_${Date.now()}`,
      name: 'New Facility',
      type: 'hospital',
      inventory: 0,
      max_capacity: 1000,
      demand: 100,
      processing_duration: 1,
      fixed_upgrade_cost: 5000,
      upgrade_capacity_boost: 500,
      holding_cost_per_unit: 1.0,
      is_shocked: false,
      stressIndex: 0
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedEntity({
      type: 'node',
      id: newNode.id
    });
  };

  return (
    <MedFluxContext.Provider
      value={{
        session,          // <-- Add this
        isLoadingAuth,    // <-- Add this
        logout,
        // Cloud functions exposed to the rest of the app
        savedNetworks,
        fetchSavedNetworks,
        saveNetworkToDb,
        loadNetworkFromDb,
        
        // Everything else
        settings,
        setSettings,
        nodes,
        setNodes,
        edges,
        setEdges,
        timelineDay,
        setTimelineDay,
        isPlaying,
        setIsPlaying,
        selectedEntity,
        setSelectedEntity,
        simulationResult,
        setSimulationResult,
        loadResourceNetwork,
        saveNetwork,
        updateNode,
        updateEdge,
        deleteEntity,
        addNode
      }}
    >
      {children}
    </MedFluxContext.Provider>
  );
};

export const useMedFlux = () => {
  const context = useContext(MedFluxContext);
  if (!context) throw new Error('useMedFlux must be used within MedFluxProvider');
  return context;
};