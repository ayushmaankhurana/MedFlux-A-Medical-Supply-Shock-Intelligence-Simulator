export const initialNetwork = {
  scenario_settings: {
    budget: 5000,
    shock_type_selected: "Demand Spike",
    specific_resource: "PPE"
  },

  nodes: [
    {
      id: "M1",
      type: "manufacturer",
      inventory: 50,
      max_capacity: 200,
      demand: 0,
      processing_duration: 3,
      fixed_upgrade_cost: 1500,
      upgrade_capacity_boost: 100,
      holding_cost_per_unit: 2.0,
      is_shocked: true
    },
    {
      id: "H1",
      type: "hospital",
      inventory: 10,
      max_capacity: 50,
      demand: 15,
      processing_duration: 0,
      fixed_upgrade_cost: 500,
      upgrade_capacity_boost: 25,
      holding_cost_per_unit: 8.5,
      is_shocked: false
    }
  ],

  edges: [
    {
      source: "M1",
      target: "H1",
      capacity: 80,
      delivery_time: 4,
      shipping_cost_per_unit: 5.0
    }
  ]
};