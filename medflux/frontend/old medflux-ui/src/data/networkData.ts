import { NetworkData, NetworkNode, NetworkEdge } from '../types';

const generateEdges = (nodes: NetworkNode[]): NetworkEdge[] => {
  const edges: NetworkEdge[] = [];
  const tiers = {
    'Tier 3': nodes.filter((n) => n.type === 'Tier 3'),
    'Tier 2': nodes.filter((n) => n.type === 'Tier 2'),
    'Tier 1': nodes.filter((n) => n.type === 'Tier 1'),
    'Tier 0': nodes.filter((n) => n.type === 'Tier 0')
  };

  // Helper to create edges with backend data
  const createEdge = (source: string, target: string, baseCapacity: number) => ({
    id: `${source}-${target}`,
    source,
    target,
    capacity: baseCapacity,
    delivery_time: Math.floor(Math.random() * 3) + 1, // 1-3 days
    shipping_cost_per_unit: 2.0 + Math.random(),
    flow: 0,
    active: true
  });

  // Connect Tier 3 to Tier 2
  tiers['Tier 3'].forEach((t3) => {
    const targets = tiers['Tier 2'].sort(() => 0.5 - Math.random()).slice(0, 2);
    targets.forEach((t2) => edges.push(createEdge(t3.id, t2.id, 800)));
  });

  // Connect Tier 2 to Tier 1
  tiers['Tier 2'].forEach((t2) => {
    const targets = tiers['Tier 1'].sort(() => 0.5 - Math.random()).slice(0, 2);
    targets.forEach((t1) => edges.push(createEdge(t2.id, t1.id, 600)));
  });

  // Connect Tier 1 to Tier 0
  tiers['Tier 1'].forEach((t1) => {
    const targets = tiers['Tier 0'].sort(() => 0.5 - Math.random()).slice(0, 3);
    targets.forEach((t0) => edges.push(createEdge(t1.id, t0.id, 400)));
  });

  return edges;
};

// Common default backend values for nodes to save space
const defaultBackend = {
  processing_duration: 1,
  fixed_upgrade_cost: 5000,
  upgrade_capacity_boost: 500,
  holding_cost_per_unit: 1.5,
  is_shocked: false,
};

const insulinNodes: NetworkNode[] = [
  // Tier 3: Raw Materials (Suppliers have 0 demand, high capacity)
  { id: 'i-t3-1', name: 'BioChem Synthetics', type: 'Tier 3', inventory: 2000, max_capacity: 3000, demand: 0, leadTime: 14, stressIndex: 5, x: 10, y: 20, ...defaultBackend },
  { id: 'i-t3-2', name: 'Global Pharma Raw', type: 'Tier 3', inventory: 1800, max_capacity: 2500, demand: 0, leadTime: 21, stressIndex: 12, x: 10, y: 50, ...defaultBackend },
  { id: 'i-t3-3', name: 'EuroExtracts Ltd', type: 'Tier 3', inventory: 2200, max_capacity: 3000, demand: 0, leadTime: 10, stressIndex: 8, x: 10, y: 80, ...defaultBackend },

  // Tier 2: Manufacturers
  { id: 'i-t2-1', name: 'Novo Nordisk Plant A', type: 'Tier 2', inventory: 800, max_capacity: 1200, demand: 0, leadTime: 7, stressIndex: 15, x: 35, y: 30, ...defaultBackend },
  { id: 'i-t2-2', name: 'Eli Lilly Facility', type: 'Tier 2', inventory: 900, max_capacity: 1500, demand: 0, leadTime: 5, stressIndex: 10, x: 35, y: 70, ...defaultBackend },

  // Tier 1: Distributors
  { id: 'i-t1-1', name: 'McKesson Hub East', type: 'Tier 1', inventory: 500, max_capacity: 800, demand: 0, leadTime: 2, stressIndex: 25, x: 60, y: 20, ...defaultBackend },
  { id: 'i-t1-2', name: 'AmerisourceBergen Central', type: 'Tier 1', inventory: 600, max_capacity: 1000, demand: 0, leadTime: 3, stressIndex: 20, x: 60, y: 50, ...defaultBackend },
  { id: 'i-t1-3', name: 'Cardinal Health West', type: 'Tier 1', inventory: 450, max_capacity: 700, demand: 0, leadTime: 2, stressIndex: 30, x: 60, y: 80, ...defaultBackend },

  // Tier 0: Hospitals (Hospitals have high demand)
  { id: 'i-t0-1', name: 'Memorial General', type: 'Tier 0', inventory: 150, max_capacity: 300, demand: 80, leadTime: 1, stressIndex: 40, x: 85, y: 15, region: 'Northeast', ...defaultBackend },
  { id: 'i-t0-2', name: 'City Health Center', type: 'Tier 0', inventory: 200, max_capacity: 400, demand: 90, leadTime: 1, stressIndex: 35, x: 85, y: 35, region: 'Midwest', ...defaultBackend },
  { id: 'i-t0-3', name: 'University Medical', type: 'Tier 0', inventory: 100, max_capacity: 250, demand: 60, leadTime: 1, stressIndex: 60, x: 85, y: 55, region: 'West Coast', ...defaultBackend },
  { id: 'i-t0-4', name: 'St. Jude Regional', type: 'Tier 0', inventory: 180, max_capacity: 350, demand: 75, leadTime: 1, stressIndex: 38, x: 85, y: 75, region: 'South', ...defaultBackend },
  { id: 'i-t0-5', name: 'County General', type: 'Tier 0', inventory: 120, max_capacity: 200, demand: 50, leadTime: 1, stressIndex: 45, x: 85, y: 95, region: 'Northeast', ...defaultBackend }
];

export const networks: NetworkData[] = [
  {
    id: 'Insulin Supply Chain',
    name: 'Insulin Supply Chain',
    nodes: insulinNodes,
    edges: generateEdges(insulinNodes)
  }
  // (You can update the PPE and Blood arrays similarly later, let's just get Insulin working first!)
];