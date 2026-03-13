export interface ScenarioSettings {
  budget: number;
  shock_type_selected:
  'Facility Offline' |
  'Demand Spike' |
  'Transport Delay' |
  'Capacity Reduction';
  specific_resource: string;
  shelf_life_days: number;
  shock_magnitude: number;
  shocked_node_id: string | null;
}

export interface NetworkNode {
  id: string;
  name: string;
  type: 'supplier' | 'manufacturer' | 'distributor' | 'hospital';
  inventory: number;
  max_capacity: number;
  demand: number;
  processing_duration: number;
  fixed_upgrade_cost: number;
  upgrade_capacity_boost: number;
  holding_cost_per_unit: number;
  is_shocked: boolean;
  stressIndex: number;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  capacity: number;
  delivery_time: number;
  shipping_cost_per_unit: number;
}

export interface SimulationTimeseriesNode {
  inventory: number;
  stressIndex: number;
}

export interface SimulationTimeseriesStep {
  day: number;
  nodes: Record<string, SimulationTimeseriesNode>;
}

export interface SimulationResult {
  baseline: {
    timeseries: SimulationTimeseriesStep[];
    metrics: {
      recovery_time: number;
      peak_shortage: number;
    };
  };
  optimization_plan?: {
    recommendations: string[];
  };
}