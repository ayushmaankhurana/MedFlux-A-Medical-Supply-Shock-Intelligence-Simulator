import { NetworkNode, NetworkEdge } from './types';

export const MEDICAL_RESOURCES = [
'PPE',
'Insulin',
'Oxygen',
'IV Fluids',
'Antibiotics',
'Blood Platelets',
'Surgical Sutures',
'mRNA Vaccines',
'Anesthetics',
'Dialysis Fluid'];


const generateId = (type: string, index: number) =>
`${type.charAt(0).toUpperCase() + type.slice(1)}_${index}`;

export const generateMockNetwork = (
resourceName: string)
: {nodes: NetworkNode[];edges: NetworkEdge[];} => {
  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];

  // Generate 1-2 Suppliers
  const numSuppliers = Math.floor(Math.random() * 2) + 1;
  for (let i = 1; i <= numSuppliers; i++) {
    nodes.push({
      id: generateId('supplier', i),
      name: `Global ${resourceName} Supplier ${i}`,
      type: 'supplier',
      inventory: 5000 + Math.floor(Math.random() * 5000),
      max_capacity: 12000,
      demand: 0,
      processing_duration: 2,
      fixed_upgrade_cost: 10000,
      upgrade_capacity_boost: 5000,
      holding_cost_per_unit: 0.5,
      is_shocked: false,
      stressIndex: Math.floor(Math.random() * 20)
    });
  }

  // Generate 1-2 Manufacturers
  const numMakers = Math.floor(Math.random() * 2) + 1;
  for (let i = 1; i <= numMakers; i++) {
    nodes.push({
      id: generateId('manufacturer', i),
      name: `${resourceName} Processing Plant ${i}`,
      type: 'manufacturer',
      inventory: 2000 + Math.floor(Math.random() * 2000),
      max_capacity: 5000,
      demand: 1000,
      processing_duration: 3,
      fixed_upgrade_cost: 20000,
      upgrade_capacity_boost: 2000,
      holding_cost_per_unit: 1.2,
      is_shocked: false,
      stressIndex: Math.floor(Math.random() * 30)
    });
  }

  // Generate 1-2 Distributors
  const numDist = Math.floor(Math.random() * 2) + 1;
  for (let i = 1; i <= numDist; i++) {
    nodes.push({
      id: generateId('distributor', i),
      name: `Regional Hub ${i}`,
      type: 'distributor',
      inventory: 1000 + Math.floor(Math.random() * 1000),
      max_capacity: 3000,
      demand: 500,
      processing_duration: 1,
      fixed_upgrade_cost: 5000,
      upgrade_capacity_boost: 1000,
      holding_cost_per_unit: 0.8,
      is_shocked: false,
      stressIndex: Math.floor(Math.random() * 20)
    });
  }

  // Generate 2-3 Hospitals
  const numHosp = Math.floor(Math.random() * 2) + 2;
  for (let i = 1; i <= numHosp; i++) {
    nodes.push({
      id: generateId('hospital', i),
      name: `City Hospital ${i}`,
      type: 'hospital',
      inventory: 200 + Math.floor(Math.random() * 300),
      max_capacity: 1000,
      demand: 150 + Math.floor(Math.random() * 100),
      processing_duration: 0,
      fixed_upgrade_cost: 2000,
      upgrade_capacity_boost: 500,
      holding_cost_per_unit: 2.0,
      is_shocked: false,
      stressIndex: Math.floor(Math.random() * 40)
    });
  }

  // Connect them
  const suppliers = nodes.filter((n) => n.type === 'supplier');
  const makers = nodes.filter((n) => n.type === 'manufacturer');
  const dists = nodes.filter((n) => n.type === 'distributor');
  const hosps = nodes.filter((n) => n.type === 'hospital');

  let edgeId = 1;
  suppliers.forEach((s) => {
    makers.forEach((m) => {
      edges.push({
        id: `e${edgeId++}`,
        source: s.id,
        target: m.id,
        capacity: 1000,
        delivery_time: 2,
        shipping_cost_per_unit: 1.5
      });
    });
  });

  makers.forEach((m) => {
    dists.forEach((d) => {
      edges.push({
        id: `e${edgeId++}`,
        source: m.id,
        target: d.id,
        capacity: 800,
        delivery_time: 1,
        shipping_cost_per_unit: 2.0
      });
    });
  });

  dists.forEach((d) => {
    hosps.forEach((h) => {
      edges.push({
        id: `e${edgeId++}`,
        source: d.id,
        target: h.id,
        capacity: 300,
        delivery_time: 1,
        shipping_cost_per_unit: 5.0
      });
    });
  });

  return { nodes, edges };
};