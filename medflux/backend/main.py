from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import networkx as nx
from optimizer import run_optimizer

# --- 1. PYDANTIC MODELS (The API Bouncer) ---
class ScenarioSettings(BaseModel):
    budget: float
    shock_type_selected: str
    specific_resource: str
    shelf_life_days: int  # <-- NEW: Tells the backend how fast the item spoils

class NodeData(BaseModel):
    id: str
    type: str
    inventory: int
    processing_duration: int
    max_capacity: int
    demand: int
    fixed_upgrade_cost: int
    upgrade_capacity_boost: int
    holding_cost_per_unit: float
    is_shocked: bool

class EdgeData(BaseModel):
    source: str
    target: str
    capacity: int
    delivery_time: int
    shipping_cost_per_unit: float

class NetworkPayload(BaseModel):
    scenario_settings: ScenarioSettings
    nodes: List[NodeData]
    edges: List[EdgeData]

app = FastAPI()

# --- 2. THE ENDPOINT ---
@app.post("/optimize")
def optimize(payload: NetworkPayload):
    # Create a fresh, empty graph
    G = nx.DiGraph()

    # Dynamically load all nodes and their attributes from the UI
    for node in payload.nodes:
        G.add_node(
            node.id,
            type=node.type,
            inventory=node.inventory,
            max_capacity=node.max_capacity,
            fixed_upgrade_cost=node.fixed_upgrade_cost,
            upgrade_capacity_boost=node.upgrade_capacity_boost,
            holding_cost_per_unit=node.holding_cost_per_unit,
            is_shocked=node.is_shocked
        )

    # Dynamically load all edges
    for edge in payload.edges:
        G.add_edge(
            edge.source,
            edge.target,
            capacity=edge.capacity,
            shipping_cost_per_unit=edge.shipping_cost_per_unit
        )

    # Extract the global settings
    user_budget = payload.scenario_settings.budget
    item_shelf_life = payload.scenario_settings.shelf_life_days

    # Run your optimizer using the dynamic graph, budget, and shelf life!
    result = run_optimizer(
        G, 
        budget=user_budget, 
        shelf_life_days=item_shelf_life  # <-- NEW: Passed into your engine
    )

    return result