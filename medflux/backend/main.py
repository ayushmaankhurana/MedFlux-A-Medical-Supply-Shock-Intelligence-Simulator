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
POST /optimize           run PuLP optimizer, return plan + recommendations (SECURED)
POST /predict_recovery   call ML model directly (standalone) (SECURED)
POST /simulate           run full pipeline: build graph → shock → optimize → simulate (SECURED)
gemini-3.1-flash-lite-preview
"""

# import os
# import jwt
# from fastapi import FastAPI, HTTPException, Depends, Security
# from pydantic import BaseModel, Field
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from typing import List, Optional
# import networkx as nx
# from mangum import Mangum  # For AWS Lambda compatibility
# from google import genai
# from optimizer import run_optimizer
# from network_loader import load_network, resolve_shock_type, find_shocked_node
# from simulation import run_simulation, inject_shock

# try:
#     from ml_model import predict_with_uncertainty
#     _ML_AVAILABLE = True
# except ImportError:
#     print("Warning: ml_model.py not found.")
#     _ML_AVAILABLE = False

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Allows all origins (perfect for a hackathon)
#     allow_credentials=True,
#     allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
#     allow_headers=["*"],  # Allows all headers
# )

# # ============================================================
# # 0. SECURITY & AUTHENTICATION BOUNCER
# # ============================================================
# security = HTTPBearer()
# SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

# def verify_user(credentials: HTTPAuthorizationCredentials = Security(security)):
#     """Validates the Supabase JWT token sent by the frontend."""
#     token = credentials.credentials
#     if not SUPABASE_JWT_SECRET:
#         print("CRITICAL: SUPABASE_JWT_SECRET is missing from environment variables!")
#         raise HTTPException(status_code=500, detail="Server configuration error.")
    
#     try:
#         # Decode the token using your Supabase secret
#         decoded_token = jwt.decode(
#             token, 
#             SUPABASE_JWT_SECRET, 
#             algorithms=["HS256"],
#             audience="authenticated"
#         )
#         return decoded_token # Returns user data if valid
#     except jwt.ExpiredSignatureError:
#         raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
#     except jwt.InvalidTokenError:
#         raise HTTPException(status_code=401, detail="Invalid authentication token.")

# # ============================================================
# # 1.  PYDANTIC MODELS  (single source of truth for the schema)
# # ============================================================

# class ScenarioSettings(BaseModel):
#     budget              : float
#     shock_type_selected : str
#     specific_resource   : str
#     shelf_life_days     : int
#     shocked_node_id     : Optional[str]  = None
#     shock_magnitude     : float          = Field(default=0.5, ge=0.0, le=1.0)
#     simulation_steps    : int            = Field(default=30, ge=1, le=365)


# class NodeData(BaseModel):
#     id                    : str
#     type                  : str
#     inventory             : int
#     processing_duration   : int
#     max_capacity          : int
#     demand                : int
#     fixed_upgrade_cost    : int
#     upgrade_capacity_boost: int
#     holding_cost_per_unit : float
#     is_shocked            : bool


# class EdgeData(BaseModel):
#     source                : str
#     target                : str
#     capacity              : int
#     delivery_time         : int
#     shipping_cost_per_unit: float


# class NetworkPayload(BaseModel):
#     scenario_settings: ScenarioSettings
#     nodes            : List[NodeData]
#     edges            : List[EdgeData]


# class MLPredictionRequest(BaseModel):
#     shock      : float = Field(..., ge=0.0, le=1.0)
#     centrality : float = Field(..., ge=0.0, le=1.0)
#     buffer     : float = Field(..., ge=0.0)
#     lead_var   : float = Field(..., ge=0.0)


# # ============================================================
# # 2.  SHARED GRAPH BUILDER 
# # ============================================================

# def _build_graph(payload: NetworkPayload) -> nx.DiGraph:
#     if not payload.nodes:
#         raise HTTPException(status_code=400, detail="Cannot process an empty network.")

#     G = load_network(payload.nodes, payload.edges)
#     settings = payload.scenario_settings
#     target_node = settings.shocked_node_id or find_shocked_node(G)

#     if target_node:
#         try:
#             internal_shock_type = resolve_shock_type(settings.shock_type_selected)
#             inject_shock(G, target_node, internal_shock_type, settings.shock_magnitude)
#         except ValueError as e:
#             raise HTTPException(status_code=400, detail=str(e))

#     return G, target_node


# # ============================================================
# # 3.  ENDPOINTS
# # ============================================================

# @app.get("/")
# def read_root():
#     return {"status": "MedFlux API is live and secured!"}

# # ── /optimize (SECURED) ──────────────────────────────────────
# @app.post("/optimize")
# def optimize(payload: NetworkPayload, user: dict = Depends(verify_user)):
#     try:
#         G, _ = _build_graph(payload)
#         settings = payload.scenario_settings
#         result   = run_optimizer(
#             G,
#             budget          = settings.budget,
#             shelf_life_days = settings.shelf_life_days,
#         )
#         return result
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Optimization API Error: {e}")
#         raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


# # ── /predict_recovery (SECURED) ──────────────────────────────
# @app.post("/predict_recovery")
# def predict_recovery(data: MLPredictionRequest, user: dict = Depends(verify_user)):
#     if not _ML_AVAILABLE:
#         raise HTTPException(status_code=503, detail="ML model is not loaded on the server.")
#     try:
#         pred, std = predict_with_uncertainty(
#             data.shock, data.centrality, data.buffer, data.lead_var
#         )
#         return {
#             "prediction_days"       : round(pred, 2),
#             "uncertainty_margin_days": round(std, 2),
#         }
#     except Exception as e:
#         print(f"ML API Error: {e}")
#         raise HTTPException(status_code=500, detail=str(e))


# # ── /simulate (SECURED) ──────────────────────────────────────
# @app.post("/simulate")
# def simulate_endpoint(payload: NetworkPayload, user: dict = Depends(verify_user)):
#     try:
#         settings = payload.scenario_settings
#         G, shocked_node = _build_graph(payload)
#         plan = run_optimizer(
#             G,
#             budget          = settings.budget,
#             shelf_life_days = settings.shelf_life_days,
#         )
#         sim_result = run_simulation(
#             G               = G,
#             plan            = plan,
#             steps           = settings.simulation_steps,
#             shocked_node    = shocked_node,
#             shock_magnitude = settings.shock_magnitude,
#         )
#         return {
#             **sim_result,
#             "optimization_plan": plan,
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Simulation API Error: {e}")
#         raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")
    
# handler = Mangum(app)  # For AWS Lambda compatibility

# import os
# import jwt
# import google.generativeai as genai
# from fastapi import FastAPI, HTTPException, Depends, Security
# from pydantic import BaseModel, Field
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from typing import List, Optional
# import networkx as nx
# from mangum import Mangum

# from optimizer import run_optimizer
# from network_loader import load_network, resolve_shock_type, find_shocked_node
# from simulation import run_simulation, inject_shock

# # Standard FastAPI setup
# app = FastAPI()
# app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# # --- AUTH & API CONFIG ---
# security = HTTPBearer()
# SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")
# GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# if GEMINI_API_KEY:
#     genai.configure(api_key=GEMINI_API_KEY)

# def verify_user(credentials: HTTPAuthorizationCredentials = Security(security)):
#     token = credentials.credentials
#     try:
#         return jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
#     except:
#         raise HTTPException(status_code=401, detail="Invalid token")

# # --- DATA MODELS ---
# class ScenarioSettings(BaseModel):
#     budget: float
#     shock_type_selected: str
#     specific_resource: str
#     shelf_life_days: int
#     shocked_node_id: Optional[str] = None
#     shock_magnitude: float = Field(default=0.5, ge=0.0, le=1.0)
#     simulation_steps: int = Field(default=30, ge=1, le=365)

# class NodeData(BaseModel):
#     id: str
#     type: str
#     inventory: int
#     max_capacity: int
#     demand: int
#     holding_cost_per_unit: float
#     is_shocked: bool
#     # Keeping fields minimal to match your loader requirements
#     processing_duration: int = 1
#     fixed_upgrade_cost: int = 0
#     upgrade_capacity_boost: int = 0

# class EdgeData(BaseModel):
#     source: str; target: str; capacity: int; delivery_time: int; shipping_cost_per_unit: float

# class NetworkPayload(BaseModel):
#     scenario_settings: ScenarioSettings; nodes: List[NodeData]; edges: List[EdgeData]

# # --- GEMINI SUMMARY LOGIC ---
# def get_ai_summary(settings, plan):
#     if not GEMINI_API_KEY: return "Optimization engaged."
#     try:
#         # Using the Lite Preview for maximum speed
#         model = genai.GenerativeModel('gemini-2.0-flash-lite-preview-02-05')
#         prompt = f"MedFlux AI: A {settings.shock_magnitude*100}% {settings.shock_type_selected} shock occurred. Plan: {plan}. Provide a 2-sentence summary for a director on which hospitals are being assisted. No markdown. Max 35 words."
#         return model.generate_content(prompt).text.strip()
#     except:
#         return "Critical inventory rerouted to stabilize network nodes."

# # --- MAIN ENDPOINT ---
# @app.post("/simulate")
# def simulate_endpoint(payload: NetworkPayload, user: dict = Depends(verify_user)):
#     try:
#         setts = payload.scenario_settings
#         G = load_network(payload.nodes, payload.edges)
        
#         # Handle Shock
#         target = setts.shocked_node_id or find_shocked_node(G)
#         if target:
#             inject_shock(G, target, resolve_shock_type(setts.shock_type_selected), setts.shock_magnitude)
        
#         # Optimize & Simulate
#         plan = run_optimizer(G, budget=setts.budget, shelf_life_days=setts.shelf_life_days)
#         sim_res = run_simulation(G=G, plan=plan, steps=setts.simulation_steps, shocked_node=target, shock_magnitude=setts.shock_magnitude)
        
#         return {
#             **sim_res,
#             "optimization_plan": plan,
#             "executive_summary": get_ai_summary(setts, plan)
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# handler = Mangum(app)

import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import networkx as nx
from mangum import Mangum

from optimizer import run_optimizer
from network_loader import load_network, resolve_shock_type, find_shocked_node
from simulation import run_simulation, inject_shock

app = FastAPI()

# Allow all origins so judges can run it from any local or web environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIG ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# ============================================================
# 1.  DATA MODELS
# ============================================================

class ScenarioSettings(BaseModel):
    budget: float
    shock_type_selected: str
    specific_resource: str
    shelf_life_days: int
    shocked_node_id: Optional[str] = None
    shock_magnitude: float = Field(default=0.5, ge=0.0, le=1.0)
    simulation_steps: int = Field(default=30, ge=1, le=365)

class NodeData(BaseModel):
    id: str
    type: str
    inventory: int
    max_capacity: int
    demand: int
    holding_cost_per_unit: float
    is_shocked: bool
    processing_duration: int = 1
    fixed_upgrade_cost: int = 0
    upgrade_capacity_boost: int = 0

class EdgeData(BaseModel):
    source: str; target: str; capacity: int; delivery_time: int; shipping_cost_per_unit: float

class NetworkPayload(BaseModel):
    scenario_settings: ScenarioSettings; nodes: List[NodeData]; edges: List[EdgeData]

# ============================================================
# 2.  GEMINI SUMMARY
# ============================================================

def get_ai_summary(settings, plan):
    if not GEMINI_API_KEY:
        return "Optimization complete. Rerouting logic engaged to protect critical nodes."
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-lite-preview-02-05')
        prompt = f"MedFlux AI: A {settings.shock_magnitude*100}% {settings.shock_type_selected} shock occurred. Plan: {plan}. Summarize in 2 sentences for a hospital director. No markdown. Max 35 words."
        return model.generate_content(prompt).text.strip()
    except:
        return "Logistics stabilized. Inventory rerouted from supply hubs to at-risk hospital facilities."

# ============================================================
# 3.  OPEN ENDPOINTS (No Auth Required for Judges)
# ============================================================

@app.get("/")
def read_root():
    return {"status": "MedFlux API is Live (Open Access for Evaluation)"}

@app.post("/simulate")
def simulate_endpoint(payload: NetworkPayload): # <-- Dependency removed
    try:
        setts = payload.scenario_settings
        G = load_network(payload.nodes, payload.edges)
        
        target = setts.shocked_node_id or find_shocked_node(G)
        if target:
            inject_shock(G, target, resolve_shock_type(setts.shock_type_selected), setts.shock_magnitude)
        
        plan = run_optimizer(G, budget=setts.budget, shelf_life_days=setts.shelf_life_days)
        sim_res = run_simulation(G=G, plan=plan, steps=setts.simulation_steps, shocked_node=target, shock_magnitude=setts.shock_magnitude)
        
        return {
            **sim_res,
            "optimization_plan": plan,
            "executive_summary": get_ai_summary(setts, plan)
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

handler = Mangum(app)