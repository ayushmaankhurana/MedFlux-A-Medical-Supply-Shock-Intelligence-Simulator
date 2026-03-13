"""
simulation.py — MedFlux Discrete-Event Simulation Engine
Pull-based demand propagation model.

Correct per-step order:
  a) Snapshot initial state (step 0 only — shows pre-simulation inventory)
     OR for t > 0: receive deliveries, update inventory, then snapshot
  b) Pull pass: nodes request replenishment from upstream
     → goods enter in_transit, arrive after delivery_time steps

Key invariant: demand is fulfilled from available inventory only.
Unfulfilled demand = shortage (tracked separately). Inventory never
goes negative — it clamps at 0 and the shortfall propagates upstream.
"""

import copy
import networkx as nx
import numpy as np
from collections import defaultdict

try:
    from ml_model import predict_with_uncertainty
    _ML_AVAILABLE = True
except ImportError:
    print("Warning: ml_model.py not found — ML predictions will be skipped.")
    _ML_AVAILABLE = False

SHORTAGE_THRESHOLD = 0.10
DEFAULT_STEPS      = 30


# ============================================================
# 1.  SHOCK INJECTION
# ============================================================

def inject_shock(G, node_id, shock_type, magnitude):
    if node_id not in G.nodes:
        raise ValueError(f"Node '{node_id}' not found in graph.")
    magnitude = max(0.0, min(1.0, magnitude))
    data = G.nodes[node_id]
    data["is_shocked"] = True

    if shock_type == "node_failure":
        data["inventory"]    = 0
        data["max_capacity"] = max(1, int(data.get("max_capacity", 100) * (1 - magnitude)))
    elif shock_type == "demand_spike":
        data["demand"] = int(data.get("demand", 10) * (1 + magnitude))
    elif shock_type == "transport_delay":
        for _, _, ed in G.out_edges(node_id, data=True):
            ed["delivery_time"] = int(ed.get("delivery_time", 1) * (1 + magnitude))
    elif shock_type == "capacity_reduction":
        data["max_capacity"] = max(1, int(data.get("max_capacity", 100) * (1 - magnitude)))
        for _, _, ed in G.out_edges(node_id, data=True):
            ed["capacity"] = max(1, int(ed.get("capacity", 100) * (1 - magnitude)))
    else:
        raise ValueError(
            f"Unknown shock_type '{shock_type}'. "
            "Valid: node_failure, demand_spike, transport_delay, capacity_reduction"
        )
    return G


# ============================================================
# 2.  APPLY OPTIMIZER PLAN
# ============================================================

def apply_plan(G, plan):
    G = copy.deepcopy(G)
    for node_id, extra in plan.get("buffers", {}).items():
        if node_id in G.nodes and extra and extra > 0:
            old = G.nodes[node_id].get("inventory", 0)
            cap = G.nodes[node_id].get("max_capacity", 100)
            G.nodes[node_id]["inventory"] = min(old + extra, cap)
    for node_id, upgraded in plan.get("capacity_upgrades", {}).items():
        if node_id in G.nodes and upgraded and upgraded >= 0.5:
            boost = G.nodes[node_id].get("upgrade_capacity_boost", 0)
            old   = G.nodes[node_id].get("max_capacity", 100)
            G.nodes[node_id]["max_capacity"] = old + boost
    return G


# ============================================================
# 3.  PULL-BASED SIMULATION
# ============================================================

def _simulate_pull(G, optimizer_flows, steps):
    G     = copy.deepcopy(G)
    nodes = list(G.nodes)

    # Parse optimizer per-edge flow caps
    opt_limits = {}
    for key, val in optimizer_flows.items():
        if "->" in key and float(val or 0) > 0:
            u, v = key.split("->", 1)
            opt_limits[(u, v)] = float(val)

    try:
        topo = list(nx.topological_sort(G))
    except nx.NetworkXUnfeasible:
        topo = nodes
    reverse_topo = list(reversed(topo))

    # in_transit[(u,v)] = [(arrive_step, units), ...]
    in_transit = defaultdict(list)

    def _snapshot():
        return {n: round(float(G.nodes[n].get("inventory", 0)), 2) for n in nodes}

    def _pull_pass(t):
        """
        Pull replenishment requests upstream.
        Each node requests what it needs; upstream fulfils from available stock.
        Goods are placed in-transit and arrive at t + delivery_time.
        """
        # Each node's need starts as its own demand (only terminal nodes
        # with demand > 0 seed the pull; transit nodes start at 0 and
        # accumulate need only if downstream asks more than they can cover)
        node_need = {n: float(G.nodes[n].get("demand", 0)) for n in nodes}

        for node in reverse_topo:
            in_edges = list(G.in_edges(node, data=True))
            if not in_edges:
                continue

            need = node_need.get(node, 0.0)
            if need <= 0:
                continue

            total_cap = sum(float(ed.get("capacity", 1)) for _, _, ed in in_edges)
            if total_cap <= 0:
                continue

            for u, _, ed in in_edges:
                edge     = (u, node)
                edge_cap = float(ed.get("capacity", 100))
                upstream_inv = float(G.nodes[u].get("inventory", 0))
                
                # ✅ FIX BUG 2: Enforce optimizer flows as priority routing
                opt_flow = opt_limits.get(edge, 0.0)
                if opt_flow > 0:
                    # Optimizer prescribes this route — use it first
                    request = min(opt_flow, upstream_inv)
                else:
                    # Fallback: distribute proportionally across available edges
                    opt_cap = opt_limits.get(edge, edge_cap)
                    eff_cap = min(edge_cap, opt_cap)
                    share = (edge_cap / total_cap) * need
                    request = min(share, eff_cap)
                
                # ✅ FIX BUG 1: Adaptive safety stock to prevent starvation
                node_type = G.nodes[u].get("type", "unknown")
                is_source = node_type == "supplier" or len(list(G.in_edges(u))) == 0
                
                if is_source:
                    safety = 0.0
                else:
                    # Emergency mode: reduce safety stock if inventory critically low
                    capacity = float(G.nodes[u].get("max_capacity", 100))
                    inv_ratio = upstream_inv / capacity if capacity > 0 else 0
                    if inv_ratio < 0.20:  # Below 20% capacity: zero out safety stock
                        safety = 0.0
                    else:
                        safety = capacity * 0.03
                
                available = max(0.0, upstream_inv - safety)
                fulfilled = min(request, available)

                if fulfilled > 0:
                    dt = int(ed.get("delivery_time", 1))
                    in_transit[edge].append((t + dt, fulfilled))
                    G.nodes[u]["inventory"] = max(0.0, upstream_inv - fulfilled)

                shortfall = request - fulfilled
                if shortfall > 0:
                    node_need[u] = node_need.get(u, 0.0) + shortfall

    history = []

    for t in range(steps):

        if t == 0:
            # Step 0: record the true initial state, THEN issue first pull
            snap = {"step": 0}
            snap.update(_snapshot())
            history.append(snap)
            _pull_pass(t)

        else:
            # Steps 1+:
            # 1. Receive deliveries that have arrived
            incoming = defaultdict(float)
            for edge, deliveries in list(in_transit.items()):
                pending = []
                for arrive_step, units in deliveries:
                    if arrive_step <= t:
                        incoming[edge[1]] += units
                    else:
                        pending.append((arrive_step, units))
                in_transit[edge] = pending

            # 2. Add received goods; consume demand (capped at available inventory)
            for node in nodes:
                d       = G.nodes[node]
                inv     = float(d.get("inventory", 0)) + incoming.get(node, 0.0)
                demand  = float(d.get("demand", 0))
                max_cap = float(d.get("max_capacity", 100))
                # Consume only what's available — no negative inventory
                consumed = min(demand, inv)
                d["inventory"] = max(0.0, min(inv - consumed, max_cap))

            # 3. Snapshot post-receive, post-demand
            snap = {"step": t}
            snap.update(_snapshot())
            history.append(snap)

            # 4. Pull replenishment for next cycle
            _pull_pass(t)

    return history


# ============================================================
# 4.  ML PREDICTION
# ============================================================

def _get_ml_prediction(G, shocked_node, shock_magnitude):
    if not _ML_AVAILABLE:
        return {"ml_available": False}
    try:
        centrality      = nx.betweenness_centrality(G)
        node_centrality = centrality.get(shocked_node, 0.0)
        total_buffer    = sum(G.nodes[n].get("inventory", 0) for n in G.nodes)
        delivery_times  = [d.get("delivery_time", 1) for _, _, d in G.edges(data=True)]
        lead_var        = float(np.std(delivery_times)) if delivery_times else 0.0
        pred_days, uncertainty = predict_with_uncertainty(
            shock=shock_magnitude, centrality=node_centrality,
            buffer=total_buffer,   lead_var=lead_var,
        )
        return {
            "ml_available"            : True,
            "predicted_recovery_days" : round(pred_days, 2),
            "uncertainty_margin_days" : round(uncertainty, 2),
            "features_used": {
                "shock"     : round(shock_magnitude, 4),
                "centrality": round(node_centrality, 4),
                "buffer"    : round(total_buffer, 2),
                "lead_var"  : round(lead_var, 4),
            }
        }
    except Exception as e:
        print(f"ML Prediction error (non-fatal): {e}")
        return {"ml_available": False, "error": str(e)}


# ============================================================
# 5.  METRICS
# ============================================================

def _compute_metrics(history, G_ref, nodes):
    thresholds = {n: G_ref.nodes[n].get("max_capacity", 100) * SHORTAGE_THRESHOLD for n in nodes}

    # Skip step 0 (initial state snapshot) for recovery detection
    recovery_time = len(history)
    for snap in history:
        if snap["step"] == 0:
            continue
        if all(snap.get(n, 0) >= thresholds[n] for n in nodes):
            recovery_time = snap["step"]
            break

    peak_shortage = 0.0
    for snap in history:
        if snap["step"] == 0:
            continue  # don't penalise initial state
        shortage = sum(max(0.0, thresholds[n] - snap.get(n, 0)) for n in nodes)
        peak_shortage = max(peak_shortage, shortage)

    initial_inv         = sum(G_ref.nodes[n].get("inventory", 0) for n in nodes)
    shock_amplification = (peak_shortage / initial_inv) if initial_inv > 0 else 0.0
    avg_inv             = {n: np.mean([snap.get(n, 0) for snap in history]) for n in nodes}
    critical_node       = min(avg_inv, key=avg_inv.get) if avg_inv else None

    return {
        "recovery_time_steps" : recovery_time,
        "peak_shortage"       : round(peak_shortage, 2),
        "shock_amplification" : round(shock_amplification, 4),
        "critical_node"       : critical_node,
    }


# ============================================================
# 6.  PUBLIC API
# ============================================================

def run_simulation(G, plan, steps=DEFAULT_STEPS, shocked_node=None, shock_magnitude=0.0):
    if not G or len(G.nodes) == 0:
        raise ValueError("Graph is empty — cannot run simulation.")
    
    # ✅ FIX BUG 5: Validate all nodes have demand attribute
    for node in G.nodes:
        if "demand" not in G.nodes[node]:
            raise ValueError(
                f"Node '{node}' missing 'demand' attribute. "
                "All nodes must have demand (even if 0)."
            )
    
    # ✅ FIX BUG 5: Validate all edges have delivery_time attribute
    for u, v in G.edges:
        if "delivery_time" not in G.edges[u, v]:
            raise ValueError(
                f"Edge {u}->{v} missing 'delivery_time' attribute. "
                "All edges must have delivery_time (default: 1)."
            )

    nodes     = list(G.nodes)
    opt_flows = plan.get("edge_flows", {}) if plan else {}

    baseline_ts      = _simulate_pull(G, optimizer_flows={}, steps=steps)
    baseline_metrics = _compute_metrics(baseline_ts, G, nodes)

    G_opt             = apply_plan(G, plan) if plan else copy.deepcopy(G)
    optimized_ts      = _simulate_pull(G_opt, optimizer_flows=opt_flows, steps=steps)
    optimized_metrics = _compute_metrics(optimized_ts, G_opt, nodes)

    # ✅ FIX BUG 4: Detect if optimization degraded performance
    baseline_shortage = baseline_metrics["peak_shortage"]
    optimized_shortage = optimized_metrics["peak_shortage"]
    
    if optimized_shortage > baseline_shortage * 1.05:  # 5% tolerance
        print(f"⚠️  WARNING: Optimization DEGRADED network resilience!")
        print(f"   Baseline peak shortage:  {baseline_shortage:.2f}")
        print(f"   Optimized peak shortage: {optimized_shortage:.2f}")
        print(f"   Degradation: +{(optimized_shortage - baseline_shortage):.2f} units")

    ml_result = {}
    if shocked_node:
        ml_result = _get_ml_prediction(G, shocked_node, shock_magnitude)

    return {
        "steps"         : steps,
        "baseline"      : {"timeseries": baseline_ts,  "metrics": baseline_metrics},
        "optimized"     : {"timeseries": optimized_ts, "metrics": optimized_metrics},
        "ml_prediction" : ml_result,
    }


# ============================================================
# 7.  CONVENIENCE WRAPPER
# ============================================================

def simulate(G, steps=DEFAULT_STEPS):
    return _simulate_pull(G, optimizer_flows={}, steps=steps)