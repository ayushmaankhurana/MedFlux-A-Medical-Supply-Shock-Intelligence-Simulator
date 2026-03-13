import pulp
import networkx as nx

def optimize_network(G, budget=100, shelf_life_days=365):
    """
    Optimize supply chain resilience by allocating buffers,
    recommending capacity upgrades, and routing flow under a fixed budget.
    Includes a spoilage penalty for stationary buffer stock.
    """
    nodes = list(G.nodes)
    edges = list(G.edges)

    # Compute node importance based on network structure
    centrality = nx.betweenness_centrality(G)

    # Optimization model
    problem = pulp.LpProblem("SupplyChain_Optimization", pulp.LpMaximize)

    # --- 1. DECISION VARIABLES ---
    buffer_vars = {
        n: pulp.LpVariable(f"buffer_{str(n).replace('-','_')}", lowBound=0, upBound=G.nodes[n].get('max_capacity', 100))
        for n in nodes
    }

    capacity_upgrade = {
        n: pulp.LpVariable(f"upgrade_{str(n).replace('-','_')}", cat="Binary")
        for n in nodes
    }

    # Flow variables for every edge (bounded by the edge's capacity)
    flow_vars = {
        (u, v): pulp.LpVariable(f"flow_{str(u).replace('-','_')}_{str(v).replace('-','_')}", lowBound=0, upBound=G.edges[u, v].get('capacity', 100))
        for u, v in edges
    }

    # --- 2. DYNAMIC BUDGET CONSTRAINT ---
    problem += (
        pulp.lpSum(buffer_vars[n] * G.nodes[n].get('holding_cost_per_unit', 1.0) for n in nodes) +
        pulp.lpSum(capacity_upgrade[n] * G.nodes[n].get('fixed_upgrade_cost', 0) for n in nodes) +
        pulp.lpSum(flow_vars[u, v] * G.edges[u, v].get('shipping_cost_per_unit', 0) for u, v in edges)
        <= budget
    )

    # --- 3. THE OBJECTIVE FUNCTION ---
    objective_terms = []
    
    # Calculate the stationary Spoilage Rate
    spoilage_rate = 1.0 / shelf_life_days if shelf_life_days > 0 else 0
    spoilage_weight = 5.0 # Tuning multiplier

    # Part A: Reward Buffers/Upgrades, but Penalize Hoarding Perishables
    for n in nodes:
        base_value = 0.1 
        shock_bonus = 2.0 if G.nodes[n].get('is_shocked', False) else 0.0
        node_score = base_value + centrality[n] + shock_bonus
        
        spoilage_penalty = buffer_vars[n] * spoilage_rate * spoilage_weight

        objective_terms.append(
            (buffer_vars[n] * node_score) + 
            (capacity_upgrade[n] * node_score * 10.0) - 
            spoilage_penalty  # <-- Subtracting the spoilage penalty!
        )

    # Part B: Triage - Reward Shipping to High-Demand Nodes (Hospitals)
    for u, v in edges:
        destination_demand = G.nodes[v].get('demand', 0)
        if destination_demand > 0:
            # Massive mathematical incentive to route inventory to high-demand nodes
            objective_terms.append(flow_vars[u, v] * destination_demand * 5.0)

    # Apply the equation to the problem
    problem += pulp.lpSum(objective_terms)

    # Solve
    problem.solve()

    # --- 4. EXTRACT RESULTS SAFELY ---
    buffer_plan = {n: buffer_vars[n].value() if buffer_vars[n].value() is not None else 0.0 for n in nodes}
    upgrade_plan = {n: capacity_upgrade[n].value() if capacity_upgrade[n].value() is not None else 0.0 for n in nodes}
    flow_plan = {f"{u}->{v}": flow_vars[u, v].value() if flow_vars[u, v].value() is not None else 0.0 for u, v in edges}

    return {
        "buffers": buffer_plan,
        "capacity_upgrades": upgrade_plan,
        "edge_flows": flow_plan
    }


def generate_recommendations(plan, G):
    """
    Convert optimization results into readable recommendations
    using percentages of max capacity.
    """
    recommendations = []
    
    # 1. Buffer Recommendations
    for node, value in plan["buffers"].items():
        if value <= 0:
            continue
            
        max_cap = G.nodes[node].get('max_capacity', 100)
        utilization = value / max_cap if max_cap > 0 else 0

        if utilization >= 0.8:
            recommendations.append(f"Add alternate supplier upstream of {node} (Buffer maxed out)")
        elif utilization >= 0.5:
            recommendations.append(f"Add large buffer stock at {node} (+{int(value)} units)")
        elif utilization > 0:
            recommendations.append(f"Increase buffer stock at {node} (+{int(value)} units)")

    # 2. Upgrade Recommendations
    for node, value in plan["capacity_upgrades"].items():
        if value == 1:
            boost = G.nodes[node].get('upgrade_capacity_boost', 'additional')
            recommendations.append(f"Upgrade production capacity at {node} (Gain {boost} capacity)")

    # 3. Logistics/Flow Recommendations
    for route, value in plan["edge_flows"].items():
        if value > 0:
            recommendations.append(f"Prioritize logistics routing: Ship {int(value)} units via {route}")

    return recommendations


def find_critical_nodes(G, top_k=2):
    """
    Identify the most critical nodes in the network
    using betweenness centrality
    """
    centrality = nx.betweenness_centrality(G)
    sorted_nodes = sorted(
        centrality.items(),
        key=lambda x: x[1],
        reverse=True
    )
    return [node for node, _ in sorted_nodes[:top_k]]


# Notice **kwargs catches extra variables safely if the API sends them
def run_optimizer(G, budget=100, shelf_life_days=365, **kwargs):
    """
    Main function called by backend API
    """
    # 1. Run the mathematical optimization (Now passes shelf_life_days)
    plan = optimize_network(G, budget, shelf_life_days)

    # 2. Generate human-readable recommendations
    recommendations = generate_recommendations(plan, G)

    # 3. Identify the structural bottlenecks
    critical_nodes = find_critical_nodes(G)

    return {
        "buffers": plan["buffers"],
        "capacity_upgrades": plan["capacity_upgrades"],
        "edge_flows": plan["edge_flows"],
        "critical_nodes": critical_nodes,
        "recommendations": recommendations
    }