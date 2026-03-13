from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import networkx as nx

# Import your Optimization Engine
from optimizer import run_optimizer

# Import Member 2's ML Engine (Make sure ml_model.py is in the same folder)
try:
    from medflux.backend.old_ml_model import predict_with_uncertainty
except ImportError:
    print("Warning: ml_model.py not found. Is Member 2's file in this directory?")

app = FastAPI()

# ==========================================
# 1. PYDANTIC MODELS (The API Bouncer)
# ==========================================

# -- Optimization Models (Member 3) --
class ScenarioSettings(BaseModel):
    budget: float
    shock_type_selected: str
    specific_resource: str
    shelf_life_days: int

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

# -- ML Models (Member 2) --
class MLPredictionRequest(BaseModel):
    shock: float
    centrality: float
    buffer: float
    lead_var: float


# ==========================================
# 2. THE ENDPOINTS
# ==========================================

# --- Endpoint 1: The Optimization Engine (Your Code) ---
@app.post("/optimize")
def optimize(payload: NetworkPayload):
    G = nx.DiGraph()

    # Load Nodes
    # Dynamically load all nodes (Added processing_duration)
    for node in payload.nodes:
        G.add_node(
            node.id,
            type=node.type,
            inventory=node.inventory,
            processing_duration=node.processing_duration, # <-- ADDED THIS
            max_capacity=node.max_capacity,
            fixed_upgrade_cost=node.fixed_upgrade_cost,
            upgrade_capacity_boost=node.upgrade_capacity_boost,
            holding_cost_per_unit=node.holding_cost_per_unit,
            is_shocked=node.is_shocked,
            demand=node.demand
        )

    # Dynamically load all edges (Added delivery_time)
    for edge in payload.edges:
        G.add_edge(
            edge.source,
            edge.target,
            capacity=edge.capacity,
            delivery_time=edge.delivery_time,             # <-- ADDED THIS
            shipping_cost_per_unit=edge.shipping_cost_per_unit
        )

    user_budget = payload.scenario_settings.budget
    item_shelf_life = payload.scenario_settings.shelf_life_days

    # Run the PuLP MILP Solver
    result = run_optimizer(G, budget=user_budget, shelf_life_days=item_shelf_life)
    return result


# --- Endpoint 2: The ML Prediction Engine (Member 2's Code) ---
@app.post("/predict_recovery")
def predict_recovery(data: MLPredictionRequest):
    """
    Predicts the supply chain recovery time using Random Forest.
    """
    # Use Pydantic dot notation (data.shock) instead of dictionary syntax
    pred, std = predict_with_uncertainty(
        data.shock, 
        data.centrality, 
        data.buffer, 
        data.lead_var
    )
    
    return {
        "prediction_days": round(pred, 2),
        "uncertainty_margin_days": round(std, 2)
    }