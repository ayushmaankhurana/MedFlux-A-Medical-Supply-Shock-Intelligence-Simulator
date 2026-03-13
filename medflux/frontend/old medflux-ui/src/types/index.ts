export type Tier = 'Tier 3' | 'Tier 2' | 'Tier 1' | 'Tier 0';

export interface NetworkNode {
  id: string;
  name: string;
  type: Tier;
  // --- BACKEND REQUIRED FIELDS ---
  inventory: number;           
  max_capacity: number;        
  demand: number;              
  processing_duration: number; 
  fixed_upgrade_cost: number;  
  upgrade_capacity_boost: number;
  holding_cost_per_unit: number;
  is_shocked: boolean;
  // --- FRONTEND VISUAL FIELDS ---
  leadTime: number; 
  stressIndex: number; 
  x: number; 
  y: number; 
  region?: string;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  // --- BACKEND REQUIRED FIELDS ---
  capacity: number;           
  delivery_time: number;      
  shipping_cost_per_unit: number;
  // --- FRONTEND VISUAL FIELDS ---
  flow: number; 
  active: boolean;
}

export type ShockType =
  | 'Node Failure'
  | 'Demand Surge'
  | 'Transport Delay'
  | 'Capacity Reduction';

export interface ShockConfig {
  type: ShockType;
  magnitude: number; 
  duration: number; 
  targetNodeId: string | null;
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  time: number; 
  activeShocks: {
    nodeId: string;
    type: ShockType;
    magnitude: number;
    remainingDuration: number;
  }[];
}

export type SupplyChainNetwork =
  | 'Insulin Supply Chain'
  | 'PPE Supply Chain'
  | 'Blood Distribution Network';

export interface NetworkData {
  id: SupplyChainNetwork;
  name: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}