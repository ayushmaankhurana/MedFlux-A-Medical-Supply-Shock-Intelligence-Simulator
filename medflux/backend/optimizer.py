import pulp
import networkx as nx


def optimize_network(G, budget=100, shelf_life_days=365):
    """
    Optimize supply chain resilience by allocating buffers
    and recommending capacity upgrades under a fixed budget.

    Parameters
    ----------
    G : NetworkX Graph
        Supply chain network
    budget : int
        Total optimization budget

    Returns
    -------
    dict
        optimization plan
    """

    nodes = list(G.nodes)

    # Compute node importance
    centrality = nx.betweenness_centrality(G)

    # Optimization model
    problem = pulp.LpProblem("SupplyChain_Optimization", pulp.LpMaximize)

# Dynamic Decision variables
    buffer_vars = {
        n: pulp.LpVariable(f"buffer_{n}", lowBound=0, upBound=G.nodes[n]['max_capacity'])
        for n in nodes
    }

    capacity_upgrade = {
        node: pulp.LpVariable(f"upgrade_{node}", cat="Binary")
        for node in nodes
    }

    # Dynamic Budget Constraint pulling from Frontend Data
    problem += (
        pulp.lpSum(buffer_vars[n] * G.nodes[n]['holding_cost_per_unit'] for n in nodes) +
        pulp.lpSum(capacity_upgrade[n] * G.nodes[n]['fixed_upgrade_cost'] for n in nodes)
        <= budget
    )

    spoilage_rate = 1.0 / shelf_life_days if shelf_life_days > 0 else 0
    
    # A multiplier to tune how aggressively the AI hates spoilage
    spoilage_weight = 5.0 

    # --- THE NEW OBJECTIVE FUNCTION ---
    objective_terms = []

    for n in nodes:
        # 1. Base Score & Centrality
        base_value = 0.1 
        shock_bonus = 2.0 if G.nodes[n].get('is_shocked', False) else 0.0
        node_score = base_value + centrality[n] + shock_bonus
        
        # 2. Calculate the Spoilage Penalty dynamically
        spoilage_penalty = buffer_vars[n] * spoilage_rate * spoilage_weight

        # 3. Add to the objective equation
        objective_terms.append(
            (buffer_vars[n] * node_score) + 
            (capacity_upgrade[n] * node_score * 10) - 
            spoilage_penalty  # <-- Subtracting the penalty!
        )

    # Apply the massive equation to the problem
    problem += pulp.lpSum(objective_terms)

    # Solve
    problem.solve()

    # Extract results
    buffer_plan = {n: buffer_vars[n].value() for n in nodes}
    upgrade_plan = {n: capacity_upgrade[n].value() for n in nodes}

    return {
        "buffers": buffer_plan,
        "capacity_upgrades": upgrade_plan
    }


def generate_recommendations(plan, G):
    """
    Convert optimization results into readable recommendations
    using percentages of max capacity.
    """
    recommendations = []
    
    for node, value in plan["buffers"].items():
        if value is None or value <= 0:
            continue
            
        max_cap = G.nodes[node].get('max_capacity', 100)
        utilization = value / max_cap if max_cap > 0 else 0

        if utilization >= 0.8:  # Using 80% of available space
            recommendations.append(f"Add alternate supplier upstream of {node} (Buffer maxed out)")
        elif utilization >= 0.5: # Using 50% of available space
            recommendations.append(f"Add large buffer stock at {node} (+{int(value)} units)")
        elif utilization > 0:
            recommendations.append(f"Increase buffer stock at {node} (+{int(value)} units)")

    for node, value in plan["capacity_upgrades"].items():
        if value == 1:
            boost = G.nodes[node].get('upgrade_capacity_boost', 'additional')
            recommendations.append(f"Upgrade production capacity at {node} (Gain {boost} capacity)")

    return recommendations

import networkx as nx

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

    return [node for node,_ in sorted_nodes[:top_k]]

def run_optimizer(G, budget=100, shelf_life_days=365):
    """
    Main function called by backend API
    """

    # 1. Run the mathematical optimization
    plan = optimize_network(G, budget, shelf_life_days)

    # 2. Generate human-readable recommendations (Now passing G!)
    recommendations = generate_recommendations(plan, G)

    # 3. Identify the structural bottlenecks
    critical_nodes = find_critical_nodes(G)

    return {
        "buffers": plan["buffers"],
        "capacity_upgrades": plan["capacity_upgrades"],
        "critical_nodes": critical_nodes,
        "recommendations": recommendations
    }