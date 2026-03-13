# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel, Field # <-- Added Field
# from typing import List
# import networkx as nx

# from optimizer import run_optimizer

# try:
#     from ml_model import predict_with_uncertainty
# except ImportError:
#     print("Warning: ml_model.py not found.")

# app = FastAPI()

# @app.get("/")
# def read_root():
#     return {"status": "MedFlux API is live and ready!"}

# # ==========================================
# # 1. PYDANTIC MODELS
# # ==========================================
# class ScenarioSettings(BaseModel):
#     budget: float
#     shock_type_selected: str
#     specific_resource: str
#     shelf_life_days: int

# class NodeData(BaseModel):
#     id: str
#     type: str
#     inventory: int
#     processing_duration: int
#     max_capacity: int
#     demand: int
#     fixed_upgrade_cost: int
#     upgrade_capacity_boost: int
#     holding_cost_per_unit: float
#     is_shocked: bool

# class EdgeData(BaseModel):
#     source: str
#     target: str
#     capacity: int
#     delivery_time: int
#     shipping_cost_per_unit: float

# class NetworkPayload(BaseModel):
#     scenario_settings: ScenarioSettings
#     nodes: List[NodeData]
#     edges: List[EdgeData]

# # --- FIX V7: INPUT VALIDATION ---
# class MLPredictionRequest(BaseModel):
#     # Field validation prevents the frontend from sending negative shocks or absurd centralities
#     shock: float = Field(..., ge=0.0, le=1.0, description="Shock magnitude between 0 and 1")
#     centrality: float = Field(..., ge=0.0, le=1.0, description="Node centrality between 0 and 1")
#     buffer: float = Field(..., ge=0.0, description="Total network buffer (cannot be negative)")
#     lead_var: float = Field(..., ge=0.0, description="Lead time variance")

# # ==========================================
# # 2. THE ENDPOINTS
# # ==========================================

# @app.post("/optimize")
# def optimize(payload: NetworkPayload):
#     # --- FIX V3: EMPTY GRAPH VALIDATION ---
#     if not payload.nodes:
#         raise HTTPException(status_code=400, detail="Cannot optimize an empty network. Please provide nodes.")

#     try:
#         G = nx.DiGraph()

#         for node in payload.nodes:
#             G.add_node(
#                 node.id, type=node.type, inventory=node.inventory,
#                 processing_duration=node.processing_duration, max_capacity=node.max_capacity,
#                 fixed_upgrade_cost=node.fixed_upgrade_cost, upgrade_capacity_boost=node.upgrade_capacity_boost,
#                 holding_cost_per_unit=node.holding_cost_per_unit, is_shocked=node.is_shocked, demand=node.demand
#             )

#         for edge in payload.edges:
#             G.add_edge(
#                 edge.source, edge.target, capacity=edge.capacity,
#                 delivery_time=edge.delivery_time, shipping_cost_per_unit=edge.shipping_cost_per_unit
#             )

#         user_budget = payload.scenario_settings.budget
#         item_shelf_life = payload.scenario_settings.shelf_life_days

#         result = run_optimizer(G, budget=user_budget, shelf_life_days=item_shelf_life)
#         return result
        
#     except Exception as e:
#         print(f"Optimization API Error: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


# @app.post("/predict_recovery")
# def predict_recovery(data: MLPredictionRequest):
#     try:
#         pred, std = predict_with_uncertainty(
#             data.shock, data.centrality, data.buffer, data.lead_var
#         )
#         return {
#             "prediction_days": round(pred, 2),
#             "uncertainty_margin_days": round(std, 2)
#         }
#     except Exception as e:
#         # Now catches the specific RuntimeError from ml_model.py
#         print(f"ML API Error: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

"""
main.py — MedFlux FastAPI Entry Point

Endpoints
---------
GET  /                   health check
POST /optimize           run PuLP optimizer, return plan + recommendations
POST /predict_recovery   call ML model directly (standalone)
POST /simulate           run full pipeline: build graph → shock → optimize → simulate
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import networkx as nx

from optimizer import run_optimizer
from network_loader import load_network, resolve_shock_type, find_shocked_node
from simulation import run_simulation, inject_shock

try:
    from ml_model import predict_with_uncertainty
    _ML_AVAILABLE = True
except ImportError:
    print("Warning: ml_model.py not found.")
    _ML_AVAILABLE = False

app = FastAPI()


# ============================================================
# 1.  PYDANTIC MODELS  (single source of truth for the schema)
# ============================================================

class ScenarioSettings(BaseModel):
    budget              : float
    shock_type_selected : str
    specific_resource   : str
    shelf_life_days     : int
    # Optional shock controls — frontend may omit these for a baseline run
    shocked_node_id     : Optional[str]  = None   # which node to shock; None = use is_shocked flag
    shock_magnitude     : float          = Field(default=0.5, ge=0.0, le=1.0)
    simulation_steps    : int            = Field(default=30, ge=1, le=365)


class NodeData(BaseModel):
    id                    : str
    type                  : str
    inventory             : int
    processing_duration   : int
    max_capacity          : int
    demand                : int
    fixed_upgrade_cost    : int
    upgrade_capacity_boost: int
    holding_cost_per_unit : float
    is_shocked            : bool


class EdgeData(BaseModel):
    source                : str
    target                : str
    capacity              : int
    delivery_time         : int
    shipping_cost_per_unit: float


class NetworkPayload(BaseModel):
    scenario_settings: ScenarioSettings
    nodes            : List[NodeData]
    edges            : List[EdgeData]


class MLPredictionRequest(BaseModel):
    shock      : float = Field(..., ge=0.0, le=1.0)
    centrality : float = Field(..., ge=0.0, le=1.0)
    buffer     : float = Field(..., ge=0.0)
    lead_var   : float = Field(..., ge=0.0)


# ============================================================
# 2.  SHARED GRAPH BUILDER  (used by /optimize and /simulate)
# ============================================================

def _build_graph(payload: NetworkPayload) -> nx.DiGraph:
    """
    Hydrate a NetworkX DiGraph from the payload, then optionally inject a
    programmatic shock on top of whatever is_shocked flags are already set.

    Returns the mutated graph plus the resolved shocked_node_id string.
    """
    if not payload.nodes:
        raise HTTPException(status_code=400, detail="Cannot process an empty network.")

    G = load_network(payload.nodes, payload.edges)

    settings = payload.scenario_settings

    # Resolve which node to shock
    # Priority: explicit shocked_node_id in settings > first node with is_shocked=True
    target_node = settings.shocked_node_id or find_shocked_node(G)

    if target_node:
        try:
            internal_shock_type = resolve_shock_type(settings.shock_type_selected)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        try:
            inject_shock(G, target_node, internal_shock_type, settings.shock_magnitude)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    return G, target_node


# ============================================================
# 3.  ENDPOINTS
# ============================================================

@app.get("/")
def read_root():
    return {"status": "MedFlux API is live and ready!"}


# ── /optimize ────────────────────────────────────────────────
@app.post("/optimize")
def optimize(payload: NetworkPayload):
    """
    Build graph, apply shock, run PuLP optimizer.
    Returns the optimization plan + recommendations.
    Does NOT run the simulation — use /simulate for the full pipeline.
    """
    try:
        G, _ = _build_graph(payload)

        settings = payload.scenario_settings
        result   = run_optimizer(
            G,
            budget          = settings.budget,
            shelf_life_days = settings.shelf_life_days,
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"Optimization API Error: {e}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


# ── /predict_recovery ────────────────────────────────────────
@app.post("/predict_recovery")
def predict_recovery(data: MLPredictionRequest):
    """
    Standalone ML prediction endpoint (unchanged from original).
    Calls predict_with_uncertainty() directly with user-supplied features.
    """
    if not _ML_AVAILABLE:
        raise HTTPException(status_code=503, detail="ML model is not loaded on the server.")
    try:
        pred, std = predict_with_uncertainty(
            data.shock, data.centrality, data.buffer, data.lead_var
        )
        return {
            "prediction_days"       : round(pred, 2),
            "uncertainty_margin_days": round(std, 2),
        }
    except Exception as e:
        print(f"ML API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── /simulate ────────────────────────────────────────────────
@app.post("/simulate")
def simulate_endpoint(payload: NetworkPayload):
    """
    Full pipeline:
      1. Build & shock the graph
      2. Run PuLP optimizer to get the plan
      3. Run baseline + optimized simulations in parallel
      4. Trigger ML recovery prediction
      5. Return everything the dashboard needs in one response

    Response shape:
    {
        "steps": 30,
        "baseline":  { "timeseries": [...], "metrics": {...} },
        "optimized": { "timeseries": [...], "metrics": {...} },
        "ml_prediction": { "predicted_recovery_days": 14.3, ... },
        "optimization_plan": {
            "buffers": {...},
            "capacity_upgrades": {...},
            "edge_flows": {...},
            "critical_nodes": [...],
            "recommendations": [...]
        }
    }
    """
    try:
        settings = payload.scenario_settings

        # ── Step 1: Build and shock graph ──
        G, shocked_node = _build_graph(payload)

        # ── Step 2: Optimize ──
        plan = run_optimizer(
            G,
            budget          = settings.budget,
            shelf_life_days = settings.shelf_life_days,
        )

        # ── Step 3 & 4: Simulate + ML prediction ──
        sim_result = run_simulation(
            G               = G,
            plan            = plan,
            steps           = settings.simulation_steps,
            shocked_node    = shocked_node,
            shock_magnitude = settings.shock_magnitude,
        )

        # ── Step 5: Merge everything into one response ──
        return {
            **sim_result,
            "optimization_plan": plan,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Simulation API Error: {e}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")