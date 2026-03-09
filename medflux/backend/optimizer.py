import pulp
import networkx as nx


def optimize_network(G, budget=100):
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

    # Decision variables
    buffer_vars = {
        node: pulp.LpVariable(f"buffer_{node}", lowBound=0, upBound=50)
        for node in nodes
    }

    capacity_upgrade = {
        node: pulp.LpVariable(f"upgrade_{node}", cat="Binary")
        for node in nodes
    }

    # Costs
    buffer_cost = 2
    upgrade_cost = 30

    # Budget constraint
    problem += (
        pulp.lpSum(buffer_vars[n] * buffer_cost for n in nodes) +
        pulp.lpSum(capacity_upgrade[n] * upgrade_cost for n in nodes)
        <= budget
    )

    # Objective: prioritize critical nodes
    problem += pulp.lpSum(
        buffer_vars[n] * centrality[n] +
        capacity_upgrade[n] * centrality[n] * 10
        for n in nodes
    )

    # Solve
    problem.solve()

    # Extract results
    buffer_plan = {n: buffer_vars[n].value() for n in nodes}
    upgrade_plan = {n: capacity_upgrade[n].value() for n in nodes}

    return {
        "buffers": buffer_plan,
        "capacity_upgrades": upgrade_plan
    }


def generate_recommendations(plan):
    """
    Convert optimization results into readable recommendations
    """

    recommendations = []

    for node, value in plan["buffers"].items():
        if value is None:
            continue

        if value >= 25:
            recommendations.append(f"Add large buffer stock at {node}")

        elif value >= 10:
            recommendations.append(f"Increase buffer stock at {node}")

    for node, value in plan["capacity_upgrades"].items():
        if value == 1:
            recommendations.append(f"Upgrade production capacity at {node}")

    return recommendations


def run_optimizer(G, budget=100):
    """
    Main function called by backend API
    """

    plan = optimize_network(G, budget)

    recommendations = generate_recommendations(plan)

    return {
        "optimization_plan": plan,
        "recommendations": recommendations
    }