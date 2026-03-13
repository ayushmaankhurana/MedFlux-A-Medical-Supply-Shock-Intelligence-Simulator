import axios from 'axios';
import {
  NetworkNode,
  NetworkEdge,
  ScenarioSettings,
  SimulationResult
} from './types';

// ⚠️ REPLACE THIS WITH YOUR ACTUAL AWS URL ⚠️
// Make sure there is NO trailing slash (/) at the very end!
const PROD_API_URL = 'https://900132385444.dkr.ecr.ap-south-1.amazonaws.com/medflux-api@sha256:5b35b9a7b9f1389ba62c32f09151bb189696e804d66ff806feff00c1bb350d54';

export const simulateNetwork = async (
  settings: ScenarioSettings,
  nodes: NetworkNode[],
  edges: NetworkEdge[]
): Promise<SimulationResult> => {
  const payload = {
    scenario_settings: {
      budget: settings.budget,
      shock_type_selected: settings.shock_type_selected,
      specific_resource: settings.specific_resource,
      shelf_life_days: settings.shelf_life_days,
      shocked_node_id: settings.shocked_node_id,
      shock_magnitude: settings.shock_magnitude,
      simulation_steps: 30
    },
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type,
      inventory: n.inventory,
      processing_duration: n.processing_duration,
      max_capacity: n.max_capacity,
      demand: n.demand,
      fixed_upgrade_cost: n.fixed_upgrade_cost,
      upgrade_capacity_boost: n.upgrade_capacity_boost,
      holding_cost_per_unit: n.holding_cost_per_unit,
      is_shocked: n.id === settings.shocked_node_id
    })),
    edges: edges.map((e) => ({
      source: e.source,
      target: e.target,
      capacity: e.capacity,
      delivery_time: e.delivery_time,
      shipping_cost_per_unit: e.shipping_cost_per_unit
    }))
  };

  try {
    // Attempt to hit the live AWS Backend
    const res = await axios.post(`${PROD_API_URL}/simulate`, payload);
    return res.data;
  } catch (error) {
    console.warn(
      'AWS API call failed, generating safe fallback mock data...',
      error
    );

    // Fallback: Generate 30 days of flat mock timeseries data
    const timeseries = [];
    const shockedNodeId = settings.shocked_node_id;

    for (let day = 0; day <= 30; day++) {
      // Structure matches the real Python API: { step: 0, Supplier_1: 100, ... }
      const dayData: Record<string, any> = { step: day };

      nodes.forEach((node) => {
        let baseStress = node.stressIndex || 0;
        let currentInv = node.inventory;

        // Simulate shock impact
        if (node.id === shockedNodeId && day >= 2 && day <= 15) {
          baseStress = Math.min(100, baseStress + settings.shock_magnitude * 100);
          currentInv = Math.max(0, currentInv - currentInv * settings.shock_magnitude * 0.2);
        } else if (day > 15) {
          // Recovery phase
          baseStress = Math.max(0, baseStress - (day - 15) * 2);
          currentInv = Math.min(node.max_capacity, currentInv + 100);
        }

        // Ripple effect to downstream (hospitals)
        if (node.type === 'hospital' && day > 5 && day <= 20) {
          if (settings.shock_magnitude > 0.5) {
            baseStress = Math.min(100, baseStress + 20);
            currentInv = Math.max(0, currentInv - 50);
          }
        }

        // Store just the raw inventory number using the node's ID as the key
        dayData[node.id] = Math.floor(currentInv);
      });

      timeseries.push(dayData);
    }

    // Calculate mock metrics based on shock
    const peakShortage =
      settings.shock_magnitude > 0.3
        ? Math.floor(settings.shock_magnitude * 5000)
        : 0;
    const recoveryTime =
      settings.shock_magnitude > 0.3
        ? 12 + Math.floor(settings.shock_magnitude * 10)
        : 0;

    return {
      baseline: {
        timeseries,
        metrics: {
          recovery_time_steps: recoveryTime, // updated key to match backend
          peak_shortage: peakShortage,
          shock_amplification: 0.15,
          critical_node: settings.shocked_node_id || "Supplier_1"
        }
      },
      optimization_plan: {
        recommendations: [
          `Increase buffer capacity at ${
            nodes.find((n) => n.type === 'manufacturer')?.name || 'Manufacturer'
          } by 25%`,
          `Diversify supplier network for ${settings.specific_resource}`,
          `Pre-position inventory closer to high-demand hospitals`
        ]
      }
    };
  }
};