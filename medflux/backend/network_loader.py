"""
network_loader.py — MedFlux Network Hydration

Converts the validated Pydantic objects from main.py into a NetworkX DiGraph
that simulation.py and optimizer.py can consume.

The Pydantic models (NodeData, EdgeData, ScenarioSettings) live in main.py and
are imported here to keep a single source of truth for the schema.
"""
from __future__ import annotations
import networkx as nx

# ── We import the Pydantic models from main.py so this file never
#    duplicates schema definitions.  main.py imports load_network from here,
#    so we use TYPE_CHECKING to avoid a circular import at runtime.

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from main import NodeData, EdgeData  # only for IDE type hints


# ============================================================
# PRIMARY LOADER
# ============================================================

def load_network(nodes: list, edges: list) -> nx.DiGraph:
    """
    Build a NetworkX DiGraph from lists of NodeData and EdgeData Pydantic objects.

    All node and edge attributes are stored verbatim so that simulation.py
    and optimizer.py can read them with .get() using the exact field names
    defined in the Pydantic schema.

    Parameters
    ----------
    nodes : list[NodeData]   — validated node objects from the API payload
    edges : list[EdgeData]   — validated edge objects from the API payload

    Returns
    -------
    nx.DiGraph with node attrs:
        id, type, inventory, processing_duration, max_capacity,
        demand, fixed_upgrade_cost, upgrade_capacity_boost,
        holding_cost_per_unit, is_shocked

    and edge attrs:
        capacity, delivery_time, shipping_cost_per_unit
    """
    G = nx.DiGraph()

    for node in nodes:
        G.add_node(
            node.id,
            # ── identity ──
            type                  = node.type,
            # ── inventory state ──
            inventory             = node.inventory,
            processing_duration   = node.processing_duration,
            max_capacity          = node.max_capacity,
            demand                = node.demand,
            # ── cost / optimiser inputs ──
            fixed_upgrade_cost    = node.fixed_upgrade_cost,
            upgrade_capacity_boost= node.upgrade_capacity_boost,
            holding_cost_per_unit = node.holding_cost_per_unit,
            # ── shock flag ──
            is_shocked            = node.is_shocked,
        )

    for edge in edges:
        G.add_edge(
            edge.source,
            edge.target,
            capacity              = edge.capacity,
            delivery_time         = edge.delivery_time,
            shipping_cost_per_unit= edge.shipping_cost_per_unit,
        )

    return G


# ============================================================
# SHOCK-TYPE MAPPING
# ============================================================
# The frontend sends human-readable shock labels (e.g. "Facility Offline").
# simulation.inject_shock() expects the internal snake_case keys.
# This map is the single place where that translation lives.

SHOCK_TYPE_MAP: dict[str, str] = {
    "Facility Offline"   : "node_failure",
    "Demand Spike"       : "demand_spike",
    "Transport Delay"    : "transport_delay",
    "Capacity Reduction" : "capacity_reduction",
    # snake_case pass-throughs (direct API callers)
    "node_failure"       : "node_failure",
    "demand_spike"       : "demand_spike",
    "transport_delay"    : "transport_delay",
    "capacity_reduction" : "capacity_reduction",
}


def resolve_shock_type(raw_label: str) -> str:
    """
    Convert a frontend shock label to the internal token expected by
    simulation.inject_shock().

    Raises ValueError with a descriptive message if the label is unknown,
    so the API returns a clean 400 rather than a silent default.
    """
    internal = SHOCK_TYPE_MAP.get(raw_label)
    if internal is None:
        valid = list(SHOCK_TYPE_MAP.keys())
        raise ValueError(
            f"Unknown shock_type '{raw_label}'. "
            f"Valid values: {valid}"
        )
    return internal


# ============================================================
# HELPER — find the first shocked node in the graph
# ============================================================

def find_shocked_node(G: nx.DiGraph) -> str | None:
    """
    Return the first node that has is_shocked == True, or None.
    Used by main.py to pass shocked_node into run_simulation().
    """
    for node_id, data in G.nodes(data=True):
        if data.get("is_shocked", False):
            return node_id
    return None