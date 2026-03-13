from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field # <-- Added Field
from typing import List
import networkx as nx

from optimizer import run_optimizer

try:
    from ml_model import predict_with_uncertainty
except ImportError:
    print("Warning: ml_model.py not found.")

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "MedFlux API is live and ready!"}

# ==========================================
# 1. PYDANTIC MODELS
# ==========================================
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

# --- FIX V7: INPUT VALIDATION ---
class MLPredictionRequest(BaseModel):
    # Field validation prevents the frontend from sending negative shocks or absurd centralities
    shock: float = Field(..., ge=0.0, le=1.0, description="Shock magnitude between 0 and 1")
    centrality: float = Field(..., ge=0.0, le=1.0, description="Node centrality between 0 and 1")
    buffer: float = Field(..., ge=0.0, description="Total network buffer (cannot be negative)")
    lead_var: float = Field(..., ge=0.0, description="Lead time variance")

# ==========================================
# 2. THE ENDPOINTS
# ==========================================

@app.post("/optimize")
def optimize(payload: NetworkPayload):
    # --- FIX V3: EMPTY GRAPH VALIDATION ---
    if not payload.nodes:
        raise HTTPException(status_code=400, detail="Cannot optimize an empty network. Please provide nodes.")

    try:
        G = nx.DiGraph()

        for node in payload.nodes:
            G.add_node(
                node.id, type=node.type, inventory=node.inventory,
                processing_duration=node.processing_duration, max_capacity=node.max_capacity,
                fixed_upgrade_cost=node.fixed_upgrade_cost, upgrade_capacity_boost=node.upgrade_capacity_boost,
                holding_cost_per_unit=node.holding_cost_per_unit, is_shocked=node.is_shocked, demand=node.demand
            )

        for edge in payload.edges:
            G.add_edge(
                edge.source, edge.target, capacity=edge.capacity,
                delivery_time=edge.delivery_time, shipping_cost_per_unit=edge.shipping_cost_per_unit
            )

        user_budget = payload.scenario_settings.budget
        item_shelf_life = payload.scenario_settings.shelf_life_days

        result = run_optimizer(G, budget=user_budget, shelf_life_days=item_shelf_life)
        return result
        
    except Exception as e:
        print(f"Optimization API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@app.post("/predict_recovery")
def predict_recovery(data: MLPredictionRequest):
    try:
        pred, std = predict_with_uncertainty(
            data.shock, data.centrality, data.buffer, data.lead_var
        )
        return {
            "prediction_days": round(pred, 2),
            "uncertainty_margin_days": round(std, 2)
        }
    except Exception as e:
        # Now catches the specific RuntimeError from ml_model.py
        print(f"ML API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))