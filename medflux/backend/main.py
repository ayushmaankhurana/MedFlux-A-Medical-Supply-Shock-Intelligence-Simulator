from fastapi import FastAPI
import networkx as nx
from optimizer import run_optimizer

app = FastAPI()

@app.post("/optimize")
def optimize():
    # For demonstration, we create a simple network graph
    G = nx.DiGraph()

    G.add_node("S1")
    G.add_node("M1")
    G.add_node("D1")
    G.add_node("H1")

    G.add_edge("S1","M1")
    G.add_edge("M1","D1")
    G.add_edge("D1","H1")

    result = run_optimizer(G)

    return result