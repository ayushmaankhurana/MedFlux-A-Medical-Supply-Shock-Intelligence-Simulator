import networkx as nx
import json
from optimizer import run_optimizer

# 1. Massive 11-Node JSON Payload
mock_ui_payload = {
  "scenario_settings": {
    "budget": 15000,
    "shock_type_selected": "Facility Offline",
    "specific_resource": "Blood Platelets",
    "shelf_life_days": 5  # <-- Highly perishable! Spoilage penalty will be huge.
  },
  "nodes": [
    # Tier 1: Suppliers
    {"id": "S1", "type": "supplier", "inventory": 500, "max_capacity": 1000, "fixed_upgrade_cost": 2000, "upgrade_capacity_boost": 500, "holding_cost_per_unit": 0.5, "is_shocked": False},
    {"id": "S2", "type": "supplier", "inventory": 400, "max_capacity": 800, "fixed_upgrade_cost": 2000, "upgrade_capacity_boost": 400, "holding_cost_per_unit": 0.5, "is_shocked": False},
    {"id": "S3", "type": "supplier", "inventory": 600, "max_capacity": 1200, "fixed_upgrade_cost": 2500, "upgrade_capacity_boost": 600, "holding_cost_per_unit": 0.5, "is_shocked": False},
    
    # Tier 2: Manufacturers (M1 is SHOCKED)
    {"id": "M1", "type": "manufacturer", "inventory": 50, "max_capacity": 500, "fixed_upgrade_cost": 5000, "upgrade_capacity_boost": 200, "holding_cost_per_unit": 1.5, "is_shocked": True},
    {"id": "M2", "type": "manufacturer", "inventory": 200, "max_capacity": 600, "fixed_upgrade_cost": 4500, "upgrade_capacity_boost": 250, "holding_cost_per_unit": 1.0, "is_shocked": False},
    
    # Tier 3: Distributors
    {"id": "D1", "type": "distributor", "inventory": 100, "max_capacity": 800, "fixed_upgrade_cost": 3000, "upgrade_capacity_boost": 400, "holding_cost_per_unit": 2.0, "is_shocked": False},
    {"id": "D2", "type": "distributor", "inventory": 150, "max_capacity": 1000, "fixed_upgrade_cost": 3500, "upgrade_capacity_boost": 500, "holding_cost_per_unit": 1.8, "is_shocked": False},
    
    # Tier 4: Hospitals (The Endpoints)
    {"id": "H1", "type": "hospital", "inventory": 20, "max_capacity": 100, "fixed_upgrade_cost": 1000, "upgrade_capacity_boost": 50, "holding_cost_per_unit": 8.0, "is_shocked": False},
    {"id": "H2", "type": "hospital", "inventory": 15, "max_capacity": 120, "fixed_upgrade_cost": 1200, "upgrade_capacity_boost": 60, "holding_cost_per_unit": 8.5, "is_shocked": False},
    {"id": "H3", "type": "hospital", "inventory": 30, "max_capacity": 150, "fixed_upgrade_cost": 1500, "upgrade_capacity_boost": 75, "holding_cost_per_unit": 7.5, "is_shocked": False},
    {"id": "H4", "type": "hospital", "inventory": 10, "max_capacity": 80, "fixed_upgrade_cost": 800, "upgrade_capacity_boost": 40, "holding_cost_per_unit": 9.0, "is_shocked": False}
  ],
  "edges": [
    # Supply -> Manufacturing
    {"source": "S1", "target": "M1"}, {"source": "S2", "target": "M1"}, {"source": "S3", "target": "M2"},
    # Manufacturing -> Distribution (Cross-network routing)
    {"source": "M1", "target": "D1"}, {"source": "M1", "target": "D2"}, {"source": "M2", "target": "D2"},
    # Distribution -> Hospitals
    {"source": "D1", "target": "H1"}, {"source": "D1", "target": "H2"}, {"source": "D2", "target": "H3"}, {"source": "D2", "target": "H4"}
  ]
}

# 2. Build the Graph
G = nx.DiGraph()

for n in mock_ui_payload["nodes"]:
    G.add_node(
        n["id"],
        type=n["type"],
        max_capacity=n["max_capacity"],
        fixed_upgrade_cost=n["fixed_upgrade_cost"],
        upgrade_capacity_boost=n["upgrade_capacity_boost"],
        holding_cost_per_unit=n["holding_cost_per_unit"],
        is_shocked=n["is_shocked"]
    )

for e in mock_ui_payload["edges"]:
    G.add_edge(e["source"], e["target"])

# 3. Run the Optimizer
budget = mock_ui_payload["scenario_settings"]["budget"]
shelf_life = mock_ui_payload["scenario_settings"]["shelf_life_days"]

print(f"--- Running Optimization ---")
print(f"Budget: ${budget}")
print(f"Shelf Life: {shelf_life} days (High Spoilage Risk)")
print(f"Shock Location: M1 (Manufacturer 1)")
print("-" * 30)

result = run_optimizer(G, budget=budget, shelf_life_days=shelf_life)

# 4. Print the Output
print(json.dumps(result, indent=2))