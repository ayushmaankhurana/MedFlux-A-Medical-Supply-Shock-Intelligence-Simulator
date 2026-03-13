# MedFlux Backend API Documentation

**Generated:** March 13, 2026  
**Backend Framework:** FastAPI  
**Base URL:** `http://localhost:8000`

---

## Table of Contents
1. Overview
2. Core Endpoints
3. Request/Response Models
4. Error Handling
5. Frontend Integration Guide
6. Data Flow Diagrams

---

## Overview

MedFlux exposes three primary endpoints that orchestrate the supply chain simulation pipeline:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | `GET` | Health check |
| `/optimize` | `POST` | Optimize network with PuLP solver (plan only, no simulation) |
| `/predict_recovery` | `POST` | Standalone ML prediction (no optimization) |
| `/simulate` | `POST` | **Full pipeline**: graph → shock → optimize → simulate → ML prediction |

The `/simulate` endpoint is the main entry point for the dashboard and returns everything needed for visualization in a single response.

---

## Core Endpoints

### 1. Health Check

**Endpoint:** `GET /`

**Description:** Returns server status.

**cURL Example:**
```bash
curl http://localhost:8000/
```

**Response (200 OK):**
```json
{
  "status": "MedFlux API is live and ready!"
}
```

---

### 2. Optimize Network (Plan Only)

**Endpoint:** `POST /optimize`

**Description:** 
- Builds the network graph from payload
- Injects a shock (if configured)
- Runs PuLP linear programming optimizer
- **Does NOT run simulation** — returns only the optimization plan and recommendations
- Use this when you want optimization insights without the full timeline simulation

**Request Body:**

```json
{
  "scenario_settings": {
    "budget": 50000,
    "shock_type_selected": "Facility Offline",
    "specific_resource": "masks",
    "shelf_life_days": 365,
    "shocked_node_id": "warehouse_1",
    "shock_magnitude": 0.8,
    "simulation_steps": 30
  },
  "nodes": [
    {
      "id": "warehouse_1",
      "type": "supplier",
      "inventory": 1000,
      "processing_duration": 1,
      "max_capacity": 2000,
      "demand": 0,
      "fixed_upgrade_cost": 5000,
      "upgrade_capacity_boost": 500,
      "holding_cost_per_unit": 2.0,
      "is_shocked": true
    },
    {
      "id": "hospital_1",
      "type": "hospital",
      "inventory": 200,
      "processing_duration": 2,
      "max_capacity": 500,
      "demand": 50,
      "fixed_upgrade_cost": 3000,
      "upgrade_capacity_boost": 100,
      "holding_cost_per_unit": 5.0,
      "is_shocked": false
    }
  ],
  "edges": [
    {
      "source": "warehouse_1",
      "target": "hospital_1",
      "capacity": 200,
      "delivery_time": 2,
      "shipping_cost_per_unit": 10.0
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "buffers": {
    "warehouse_1": 500.0,
    "hospital_1": 150.0
  },
  "capacity_upgrades": {
    "warehouse_1": 1.0,
    "hospital_1": 0.0
  },
  "edge_flows": {
    "warehouse_1->hospital_1": 175.5
  },
  "critical_nodes": [
    "warehouse_1",
    "hospital_1"
  ],
  "recommendations": [
    "Upgrade production capacity at warehouse_1 (Gain 500 capacity)",
    "Add large buffer stock at hospital_1 (+150 units)",
    "Prioritize logistics routing: Ship 175 units via warehouse_1->hospital_1",
    "Add alternate supplier upstream of hospital_1 (Buffer maxed out)"
  ]
}
```

**Error Response (400 Bad Request):**
```json
{
  "detail": "Cannot process an empty network."
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "detail": "Optimization failed: [PuLP solver error details]"
}
```

---

### 3. Predict Recovery (ML Only)

**Endpoint:** `POST /predict_recovery`

**Description:**
- Calls the ML model directly with user-supplied features
- **Does NOT optimize or simulate** — pure ML prediction
- Returns predicted recovery time with uncertainty margin
- Use this when you want a quick "how long to recover?" estimate without building a full network

**Request Body:**

```json
{
  "shock": 0.8,
  "centrality": 0.6,
  "buffer": 3500.0,
  "lead_var": 0.5
}
```

**Field Descriptions:**
- `shock` (float, 0.0–1.0): Magnitude of the disruption (0 = no impact, 1 = total failure)
- `centrality` (float, 0.0–1.0): How central is the shocked node in the network (0 = isolated, 1 = hub)
- `buffer` (float, ≥ 0): Total inventory across entire network (units)
- `lead_var` (float, ≥ 0): Variance in delivery lead times across edges (standard deviation in days)

**Response (200 OK):**

```json
{
  "prediction_days": 14.32,
  "uncertainty_margin_days": 2.15
}
```

**Interpretation:**
- Network is expected to recover in **14.32 ± 2.15 days** (i.e., 12–16 days range)

**Error Response (503 Service Unavailable):**
```json
{
  "detail": "ML model is not loaded on the server."
}
```

---

### 4. Simulate (Full Pipeline)

**Endpoint:** `POST /simulate`

**Description:**
- **The primary endpoint** for the dashboard
- Executes the complete MedFlux pipeline in one request:
  1. Loads network from payload
  2. Injects shock at specified node
  3. Runs PuLP optimizer to get buffer/upgrade/flow plan
  4. Simulates two scenarios in parallel:
     - **Baseline**: no optimizations applied
     - **Optimized**: with optimizer plan applied
  5. Calls ML model for recovery prediction
  6. Returns everything in one structured response

**Request Body:**

Use the same schema as `/optimize` (see Optimize Request above):

```json
{
  "scenario_settings": {
    "budget": 50000,
    "shock_type_selected": "Facility Offline",
    "specific_resource": "masks",
    "shelf_life_days": 365,
    "shocked_node_id": "warehouse_1",
    "shock_magnitude": 0.8,
    "simulation_steps": 30
  },
  "nodes": [
    {
      "id": "warehouse_1",
      "type": "supplier",
      "inventory": 1000,
      "processing_duration": 1,
      "max_capacity": 2000,
      "demand": 0,
      "fixed_upgrade_cost": 5000,
      "upgrade_capacity_boost": 500,
      "holding_cost_per_unit": 2.0,
      "is_shocked": true
    },
    {
      "id": "hospital_1",
      "type": "hospital",
      "inventory": 200,
      "processing_duration": 2,
      "max_capacity": 500,
      "demand": 50,
      "fixed_upgrade_cost": 3000,
      "upgrade_capacity_boost": 100,
      "holding_cost_per_unit": 5.0,
      "is_shocked": false
    }
  ],
  "edges": [
    {
      "source": "warehouse_1",
      "target": "hospital_1",
      "capacity": 200,
      "delivery_time": 2,
      "shipping_cost_per_unit": 10.0
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "steps": 30,
  "baseline": {
    "timeseries": [
      {
        "step": 0,
        "warehouse_1": 1000.0,
        "hospital_1": 200.0
      },
      {
        "step": 1,
        "warehouse_1": 950.0,
        "hospital_1": 175.0
      },
      {
        "step": 2,
        "warehouse_1": 895.0,
        "hospital_1": 165.0
      }
    ],
    "metrics": {
      "recovery_time_steps": 18,
      "peak_shortage": 250.5,
      "shock_amplification": 0.2145,
      "critical_node": "hospital_1"
    }
  },
  "optimized": {
    "timeseries": [
      {
        "step": 0,
        "warehouse_1": 1500.0,
        "hospital_1": 350.0
      },
      {
        "step": 1,
        "warehouse_1": 1450.0,
        "hospital_1": 325.0
      },
      {
        "step": 2,
        "warehouse_1": 1395.0,
        "hospital_1": 315.0
      }
    ],
    "metrics": {
      "recovery_time_steps": 8,
      "peak_shortage": 45.2,
      "shock_amplification": 0.0312,
      "critical_node": "hospital_1"
    }
  },
  "ml_prediction": {
    "ml_available": true,
    "predicted_recovery_days": 14.32,
    "uncertainty_margin_days": 2.15,
    "features_used": {
      "shock": 0.8,
      "centrality": 0.75,
      "buffer": 3350.0,
      "lead_var": 0.35
    }
  },
  "optimization_plan": {
    "buffers": {
      "warehouse_1": 500.0,
      "hospital_1": 150.0
    },
    "capacity_upgrades": {
      "warehouse_1": 1.0,
      "hospital_1": 0.0
    },
    "edge_flows": {
      "warehouse_1->hospital_1": 175.5
    },
    "critical_nodes": [
      "warehouse_1",
      "hospital_1"
    ],
    "recommendations": [
      "Upgrade production capacity at warehouse_1 (Gain 500 capacity)",
      "Add large buffer stock at hospital_1 (+150 units)",
      "Prioritize logistics routing: Ship 175 units via warehouse_1->hospital_1"
    ]
  }
}
```

**Response Structure Breakdown:**

| Key | Type | Purpose |
|-----|------|---------|
| `steps` | int | Number of simulation time steps executed |
| `baseline.timeseries` | array | Day-by-day inventory levels with NO optimization applied |
| `baseline.metrics` | object | Recovery time, peak shortage, amplification for baseline |
| `optimized.timeseries` | array | Day-by-day inventory levels WITH optimization applied |
| `optimized.metrics` | object | Recovery time, peak shortage, amplification for optimized scenario |
| `ml_prediction` | object | ML model prediction + confidence intervals |
| `optimization_plan` | object | Detailed optimizer output (buffers, upgrades, flows, recommendations) |

**Timeseries Entry:**
- `step`: Day number (0 to N)
- `{node_id}`: Inventory level at that node on that day (float, ≥ 0)

**Metrics Object:**
- `recovery_time_steps`: Number of days until network recovers (reaches safety threshold)
- `peak_shortage`: Worst-case total shortage across all nodes (units)
- `shock_amplification`: Ratio of peak shortage to initial inventory (0–1)
- `critical_node`: Node with lowest average inventory (bottleneck)

**Error Response (400 Bad Request):**
```json
{
  "detail": "Cannot process an empty network."
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "detail": "Simulation failed: [error details]"
}
```

---

## Request/Response Models

### ScenarioSettings (Pydantic Model)

```python
class ScenarioSettings(BaseModel):
    budget              : float              # Budget for optimization (e.g., 50000)
    shock_type_selected : str                # One of the shock type options (see below)
    specific_resource   : str                # Free text (e.g., "masks", "ventilators")
    shelf_life_days     : int                # Product shelf life (e.g., 365)
    shocked_node_id     : Optional[str]      # Which node to shock; None = auto-detect
    shock_magnitude     : float              # 0.0–1.0, default 0.5
    simulation_steps    : int                # Days to simulate (1–365), default 30
```

**Shock Type Options** (valid values for `shock_type_selected`):
- `"Facility Offline"` → Internal code: `node_failure` (inventory drops to 0, capacity reduced)
- `"Demand Spike"` → Internal code: `demand_spike` (demand increases)
- `"Transport Delay"` → Internal code: `transport_delay` (delivery times increase)
- `"Capacity Reduction"` → Internal code: `capacity_reduction` (max capacity and edge capacity reduced)

---

### NodeData (Pydantic Model)

```python
class NodeData(BaseModel):
    id                    : str      # Unique node identifier (e.g., "warehouse_1")
    type                  : str      # "supplier", "warehouse", "hospital", "clinic", etc.
    inventory             : int      # Current stock (units)
    processing_duration   : int      # Days to process/manufacture (not currently used)
    max_capacity          : int      # Maximum inventory this node can hold (units)
    demand                : int      # Daily demand (units/day)
    fixed_upgrade_cost    : int      # Cost to upgrade capacity (currency units)
    upgrade_capacity_boost: int      # How many units of capacity gained by upgrade
    holding_cost_per_unit : float    # Daily cost to store 1 unit (currency/unit/day)
    is_shocked            : bool     # Pre-mark this node as target (if no explicit shocked_node_id)
```

---

### EdgeData (Pydantic Model)

```python
class EdgeData(BaseModel):
    source                : str      # Source node ID
    target                : str      # Target node ID
    capacity              : int      # Max units that can transit this edge per day
    delivery_time         : int      # Days for goods to arrive (e.g., 2)
    shipping_cost_per_unit: float    # Cost per unit shipped (currency/unit)
```

---

### MLPredictionRequest (Pydantic Model)

```python
class MLPredictionRequest(BaseModel):
    shock      : float   # 0.0–1.0 (validation enforced)
    centrality : float   # 0.0–1.0 (validation enforced)
    buffer     : float   # ≥ 0.0 (validation enforced)
    lead_var   : float   # ≥ 0.0 (validation enforced)
```

---

## Error Handling

### Standard Error Response Format

All error responses follow this structure:

```json
{
  "detail": "Human-readable error message"
}
```

**HTTP Status Codes:**

| Code | Scenario |
|------|----------|
| `200` | Successful GET or POST |
| `201` | Successful creation (not used in MedFlux) |
| `400` | Invalid input (empty network, unknown shock type, validation failed) |
| `404` | Resource not found |
| `500` | Server error (optimizer infeasible, ML model crash, etc.) |
| `503` | Service unavailable (ML model not loaded) |

### Common Error Scenarios

**Empty Network:**
```json
{
  "detail": "Cannot process an empty network."
}
```

**Unknown Shock Type:**
```json
{
  "detail": "Unknown shock_type 'Invalid Shock'. Valid values: ['Facility Offline', 'Demand Spike', 'Transport Delay', 'Capacity Reduction', 'node_failure', 'demand_spike', 'transport_delay', 'capacity_reduction']"
}
```

**Node Not Found (for shock injection):**
```json
{
  "detail": "Node 'nonexistent_node' not found in graph."
}
```

**ML Model Not Available:**
```json
{
  "detail": "ML model is not loaded on the server."
}
```

**Optimizer Infeasible:**
- Optimizer returns all zeros (infeasible problem)
- Endpoint still returns 200 OK with zero values
- Check the `recommendations` array — it may be empty

---

## Frontend Integration Guide

### Step 1: Setup API Service

Create `src/services/api.ts`:

```typescript
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Simulations can take time
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Type definitions ──
export interface ScenarioSettings {
  budget: number;
  shock_type_selected: string;
  specific_resource: string;
  shelf_life_days: number;
  shocked_node_id?: string;
  shock_magnitude?: number;
  simulation_steps?: number;
}

export interface NodeData {
  id: string;
  type: string;
  inventory: number;
  processing_duration: number;
  max_capacity: number;
  demand: number;
  fixed_upgrade_cost: number;
  upgrade_capacity_boost: number;
  holding_cost_per_unit: number;
  is_shocked: boolean;
}

export interface EdgeData {
  source: string;
  target: string;
  capacity: number;
  delivery_time: number;
  shipping_cost_per_unit: number;
}

export interface NetworkPayload {
  scenario_settings: ScenarioSettings;
  nodes: NodeData[];
  edges: EdgeData[];
}

export interface SimulationResponse {
  steps: number;
  baseline: {
    timeseries: Array<{ step: number; [nodeId: string]: number }>;
    metrics: {
      recovery_time_steps: number;
      peak_shortage: number;
      shock_amplification: number;
      critical_node: string;
    };
  };
  optimized: {
    timeseries: Array<{ step: number; [nodeId: string]: number }>;
    metrics: {
      recovery_time_steps: number;
      peak_shortage: number;
      shock_amplification: number;
      critical_node: string;
    };
  };
  ml_prediction: {
    ml_available: boolean;
    predicted_recovery_days?: number;
    uncertainty_margin_days?: number;
    features_used?: {
      shock: number;
      centrality: number;
      buffer: number;
      lead_var: number;
    };
  };
  optimization_plan: {
    buffers: { [nodeId: string]: number };
    capacity_upgrades: { [nodeId: string]: number };
    edge_flows: { [edgeId: string]: number };
    critical_nodes: string[];
    recommendations: string[];
  };
}

// ── API Methods ──
export const medfluxAPI = {
  // Health check
  healthCheck: () => apiClient.get('/'),

  // Optimize only (no simulation)
  optimize: (payload: NetworkPayload) =>
    apiClient.post('/optimize', payload),

  // ML prediction only (no optimization or simulation)
  predictRecovery: (shock: number, centrality: number, buffer: number, lead_var: number) =>
    apiClient.post('/predict_recovery', {
      shock,
      centrality,
      buffer,
      lead_var,
    }),

  // Full pipeline (optimize + simulate + ML)
  simulate: (payload: NetworkPayload) =>
    apiClient.post<SimulationResponse>('/simulate', payload),
};

export default apiClient;
```

### Step 2: Create a Custom Hook for Simulation

Create `src/hooks/useSimulation.ts`:

```typescript
import { useState, useCallback } from 'react';
import { medfluxAPI, NetworkPayload, SimulationResponse } from '../services/api';

interface UseSimulationState {
  loading: boolean;
  error: string | null;
  data: SimulationResponse | null;
  isOptimizing: boolean;
  isSimulating: boolean;
}

export const useSimulation = () => {
  const [state, setState] = useState<UseSimulationState>({
    loading: false,
    error: null,
    data: null,
    isOptimizing: false,
    isSimulating: false,
  });

  const runSimulation = useCallback(async (payload: NetworkPayload) => {
    setState(prev => ({ ...prev, loading: true, error: null, isSimulating: true }));
    try {
      const response = await medfluxAPI.simulate(payload);
      setState(prev => ({
        ...prev,
        data: response.data,
        loading: false,
        isSimulating: false,
      }));
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Unknown error';
      setState(prev => ({
        ...prev,
        error: errorMsg,
        loading: false,
        isSimulating: false,
      }));
      throw err;
    }
  }, []);

  const optimize = useCallback(async (payload: NetworkPayload) => {
    setState(prev => ({ ...prev, loading: true, error: null, isOptimizing: true }));
    try {
      const response = await medfluxAPI.optimize(payload);
      setState(prev => ({
        ...prev,
        loading: false,
        isOptimizing: false,
      }));
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Unknown error';
      setState(prev => ({
        ...prev,
        error: errorMsg,
        loading: false,
        isOptimizing: false,
      }));
      throw err;
    }
  }, []);

  const predictRecovery = useCallback(
    async (shock: number, centrality: number, buffer: number, lead_var: number) => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const response = await medfluxAPI.predictRecovery(shock, centrality, buffer, lead_var);
        setState(prev => ({ ...prev, loading: false }));
        return response.data;
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || err.message || 'Unknown error';
        setState(prev => ({
          ...prev,
          error: errorMsg,
          loading: false,
        }));
        throw err;
      }
    },
    []
  );

  return {
    ...state,
    runSimulation,
    optimize,
    predictRecovery,
  };
};
```

### Step 3: Use in Your Dashboard Component

Create `src/components/SimulationDashboard.tsx`:

```typescript
import React, { useState } from 'react';
import { useSimulation, NetworkPayload } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const SimulationDashboard: React.FC = () => {
  const { loading, error, data, runSimulation } = useSimulation();
  const [selectedScenario, setSelectedScenario] = useState<'baseline' | 'optimized'>('baseline');

  const handleRunSimulation = async () => {
    // Build your payload from form inputs
    const payload: NetworkPayload = {
      scenario_settings: {
        budget: 50000,
        shock_type_selected: 'Facility Offline',
        specific_resource: 'masks',
        shelf_life_days: 365,
        shocked_node_id: 'warehouse_1',
        shock_magnitude: 0.8,
        simulation_steps: 30,
      },
      nodes: [
        {
          id: 'warehouse_1',
          type: 'supplier',
          inventory: 1000,
          processing_duration: 1,
          max_capacity: 2000,
          demand: 0,
          fixed_upgrade_cost: 5000,
          upgrade_capacity_boost: 500,
          holding_cost_per_unit: 2.0,
          is_shocked: true,
        },
        {
          id: 'hospital_1',
          type: 'hospital',
          inventory: 200,
          processing_duration: 2,
          max_capacity: 500,
          demand: 50,
          fixed_upgrade_cost: 3000,
          upgrade_capacity_boost: 100,
          holding_cost_per_unit: 5.0,
          is_shocked: false,
        },
      ],
      edges: [
        {
          source: 'warehouse_1',
          target: 'hospital_1',
          capacity: 200,
          delivery_time: 2,
          shipping_cost_per_unit: 10.0,
        },
      ],
    };

    try {
      await runSimulation(payload);
    } catch (err) {
      console.error('Simulation failed:', err);
    }
  };

  if (loading) return <div>Running simulation...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  const scenarioData = data ? data[selectedScenario] : null;

  return (
    <div className="dashboard">
      <button onClick={handleRunSimulation}>Run Simulation</button>

      {data && (
        <>
          <div className="scenario-selector">
            <button
              onClick={() => setSelectedScenario('baseline')}
              className={selectedScenario === 'baseline' ? 'active' : ''}
            >
              Baseline (No Optimization)
            </button>
            <button
              onClick={() => setSelectedScenario('optimized')}
              className={selectedScenario === 'optimized' ? 'active' : ''}
            >
              Optimized (With Plan)
            </button>
          </div>

          <div className="metrics">
            <div className="metric-card">
              <h3>Recovery Time</h3>
              <p>{scenarioData?.metrics.recovery_time_steps} days</p>
            </div>
            <div className="metric-card">
              <h3>Peak Shortage</h3>
              <p>{scenarioData?.metrics.peak_shortage} units</p>
            </div>
            <div className="metric-card">
              <h3>Shock Amplification</h3>
              <p>{(scenarioData?.metrics.shock_amplification ?? 0).toFixed(4)}</p>
            </div>
            <div className="metric-card">
              <h3>Critical Node</h3>
              <p>{scenarioData?.metrics.critical_node}</p>
            </div>
          </div>

          <div className="chart">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={scenarioData?.timeseries || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="step" />
                <YAxis />
                <Tooltip />
                <Legend />
                {/* Dynamically render line for each node */}
                {data.baseline.timeseries[0] &&
                  Object.keys(data.baseline.timeseries[0])
                    .filter(key => key !== 'step')
                    .map(nodeId => (
                      <Line
                        key={nodeId}
                        type="monotone"
                        dataKey={nodeId}
                        stroke={`hsl(${Math.random() * 360}, 70%, 50%)`}
                        dot={false}
                      />
                    ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {data.ml_prediction.ml_available && (
            <div className="ml-prediction">
              <h3>ML Recovery Prediction</h3>
              <p>
                Predicted recovery: <strong>{data.ml_prediction.predicted_recovery_days}</strong> ±{' '}
                {data.ml_prediction.uncertainty_margin_days} days
              </p>
            </div>
          )}

          <div className="recommendations">
            <h3>Optimization Recommendations</h3>
            <ul>
              {data.optimization_plan.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
```

### Step 4: Environment Configuration

Create `.env` file in your frontend root:

```bash
# .env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=60000
```

---

## Data Flow Diagrams

### Flow 1: Full Pipeline (`/simulate`)

```
Frontend Form Input
        ↓
Build NetworkPayload
        ↓
POST /simulate
        ↓
Backend: main.py
  1. _build_graph() → load network from nodes/edges
  2. inject_shock() → modify graph (node_failure, demand_spike, etc.)
  3. run_optimizer() → PuLP solver → plan (buffers, upgrades, flows)
  4. run_simulation() → simulate 2 scenarios:
     - Baseline (no plan applied)
     - Optimized (plan applied)
  5. _get_ml_prediction() → predict recovery days ± margin
        ↓
Return SimulationResponse
        ↓
Frontend: Dashboard
  - Show timeseries chart (baseline vs optimized)
  - Display metrics (recovery time, peak shortage, etc.)
  - List recommendations
  - Show ML confidence intervals
```

### Flow 2: Optimize Only (`/optimize`)

```
Frontend Form Input
        ↓
Build NetworkPayload
        ↓
POST /optimize
        ↓
Backend: main.py
  1. _build_graph() → load and shock network
  2. run_optimizer() → PuLP solver → plan
        ↓
Return { buffers, capacity_upgrades, edge_flows, critical_nodes, recommendations }
        ↓
Frontend: Display plan only (no timeseries)
```

### Flow 3: ML Prediction Only (`/predict_recovery`)

```
Frontend: Manual Input
  - shock: 0.8
  - centrality: 0.6
  - buffer: 3500
  - lead_var: 0.5
        ↓
POST /predict_recovery
        ↓
Backend: ml_model.py
  predict_with_uncertainty()
  → Returns (mean_days, std_days)
        ↓
Response: { prediction_days, uncertainty_margin_days }
        ↓
Frontend: Show recovery estimate
```

---

## Key Implementation Notes for Frontend Developers

### 1. **Which Endpoint Should I Use?**

| Use Case | Endpoint |
|----------|----------|
| Full analysis with optimization + simulation | `/simulate` |
| Just want the optimization plan (fast) | `/optimize` |
| Just want ML prediction (very fast) | `/predict_recovery` |

### 2. **Handling Long Simulations**

The `/simulate` endpoint can take **several seconds** depending on `simulation_steps`. Consider:
- Show a loading spinner during the request
- Set axios timeout to at least 60 seconds
- Allow user to cancel if needed

### 3. **Timeseries Data Structure**

Each timeseries entry is a **flat object** with the step number plus node inventories:

```json
{
  "step": 5,
  "warehouse_1": 1200.5,
  "hospital_1": 350.0,
  "clinic_1": 75.0
}
```

**To chart**: Use `step` as X-axis and each node ID as a Y-axis line.

### 4. **Comparing Scenarios**

The response includes **both baseline and optimized** timeseries. Show them on the same chart with different colors:
- Baseline: red/dashed
- Optimized: green/solid

This visually demonstrates the impact of the optimization plan.

### 5. **Shock Type Dropdown**

Frontend should present these options to user:
- `Facility Offline`
- `Demand Spike`
- `Transport Delay`
- `Capacity Reduction`

These map to internal codes; **always send the frontend label** (main.py handles conversion).

### 6. **Validation**

- Node IDs must be unique
- Edge source/target must reference existing node IDs
- Inventory ≤ max_capacity
- delivery_time ≥ 1
- shock_magnitude: 0.0–1.0

### 7. **Error Messages**

Catch errors and display user-friendly messages:
- **400 error** → "Invalid network configuration — check node/edge data"
- **500 error** → "Server error — optimizer may be infeasible"
- **503 error** → "ML model not loaded on server — predictions unavailable"

---

## Example: Complete Frontend Integration Flow

```typescript
// Complete example of running a simulation
import { medfluxAPI, NetworkPayload, SimulationResponse } from './services/api';

const runFullPipeline = async () => {
  const payload: NetworkPayload = {
    scenario_settings: {
      budget: 50000,
      shock_type_selected: 'Facility Offline',
      specific_resource: 'PPE',
      shelf_life_days: 180,
      shocked_node_id: 'warehouse_central',
      shock_magnitude: 0.7,
      simulation_steps: 30,
    },
    nodes: [
      {
        id: 'warehouse_central',
        type: 'supplier',
        inventory: 5000,
        processing_duration: 1,
        max_capacity: 10000,
        demand: 0,
        fixed_upgrade_cost: 10000,
        upgrade_capacity_boost: 2000,
        holding_cost_per_unit: 1.5,
        is_shocked: true,
      },
      {
        id: 'hospital_a',
        type: 'hospital',
        inventory: 500,
        processing_duration: 2,
        max_capacity: 1000,
        demand: 100,
        fixed_upgrade_cost: 5000,
        upgrade_capacity_boost: 500,
        holding_cost_per_unit: 3.0,
        is_shocked: false,
      },
      {
        id: 'hospital_b',
        type: 'hospital',
        inventory: 400,
        processing_duration: 2,
        max_capacity: 800,
        demand: 80,
        fixed_upgrade_cost: 4000,
        upgrade_capacity_boost: 400,
        holding_cost_per_unit: 3.0,
        is_shocked: false,
      },
    ],
    edges: [
      {
        source: 'warehouse_central',
        target: 'hospital_a',
        capacity: 300,
        delivery_time: 1,
        shipping_cost_per_unit: 5.0,
      },
      {
        source: 'warehouse_central',
        target: 'hospital_b',
        capacity: 250,
        delivery_time: 2,
        shipping_cost_per_unit: 6.0,
      },
    ],
  };

  try {
    // Run the full pipeline
    const result: SimulationResponse = await (await medfluxAPI.simulate(payload)).data;

    // Extract data for visualization
    const baselineTimeseries = result.baseline.timeseries;
    const optimizedTimeseries = result.optimized.timeseries;
    const baselineMetrics = result.baseline.metrics;
    const optimizedMetrics = result.optimized.metrics;
    const recommendations = result.optimization_plan.recommendations;

    // Calculate improvement
    const recoveryImprovement =
      baselineMetrics.recovery_time_steps - optimizedMetrics.recovery_time_steps;
    const shortageReduction =
      baselineMetrics.peak_shortage - optimizedMetrics.peak_shortage;

    console.log(
      `Optimization improved recovery by ${recoveryImprovement} days ` +
        `and reduced peak shortage by ${shortageReduction} units`
    );

    return {
      baselineTimeseries,
      optimizedTimeseries,
      baselineMetrics,
      optimizedMetrics,
      recommendations,
      recoveryImprovement,
      shortageReduction,
    };
  } catch (error) {
    console.error('Simulation failed:', error);
    throw error;
  }
};
```

---

## Summary

| Endpoint | Purpose | Speed | Response Size |
|----------|---------|-------|----------------|
| `POST /simulate` | Full pipeline (optimize + simulate + ML) | ~5–10s | Large (full timeseries) |
| `POST /optimize` | Optimization plan only | ~1–2s | Small (plan + recommendations) |
| `POST /predict_recovery` | ML prediction only | <1s | Tiny (2 numbers + details) |

**Recommendation:** Use `/simulate` for your main dashboard. It provides everything in one call and is optimized for typical network sizes.
