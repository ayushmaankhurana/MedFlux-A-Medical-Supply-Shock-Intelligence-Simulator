# MedFlux: AI-Driven Medical Supply Chain Resiliency Engine


Hosted on https://medflux-ui.vercel.app/


**MedFlux** is a proactive intelligence platform designed to mitigate the impact of sudden supply chain shocks (facility outages, logistics failures, or resource surges) in hospital networks. 

By combining **Mixed-Integer Linear Programming (MILP)** with **LLM-driven executive insights**, MedFlux doesn't just show you where the system is failing—it calculates the mathematically optimal way to save it.

## 🚀 The Tech Stack
- **Frontend:** React (TypeScript), Tailwind CSS, React Flow (for network visualization).
- **Backend:** FastAPI (Python) deployed on **AWS Lambda** via Docker & Mangum.
- **Optimization Engine:** PuLP (Mixed-Integer Linear Programming solver).
- **AI Intelligence:** Gemini 2.0 Flash Lite (for automated executive briefings).
- **Database/Auth:** Supabase (PostgreSQL) with Row Level Security (RLS).

## 🧠 Key Features
### 1. The Optimization Engine (The Math)
Unlike simple heuristics, MedFlux uses a **MILP solver** to minimize stockouts and shipping costs across a complex network. It accounts for:
- Node capacities and daily demand.
- Delivery lead times.
- Budgetary constraints.
- Resource shelf-life (vital for blood/vaccine logistics).

### 2. Generative Intelligence
Every simulation includes an **AI Executive Briefing**. We feed the complex results of the MILP solver into **Gemini 2.0 Flash Lite** to translate raw matrix data into a 2-sentence actionable brief for hospital administrators.

### 3. Dynamic Simulation
A 30-day time-series simulation that allows users to visualize "Cascading Failures"—where a shock at a single supplier ripple through the network over time.

## 🛠 Installation & Local Setup

### Backend (Python)
1. Navigate to `/backend`.
2. Install dependencies: `pip install -r requirements.txt`.
3. Set Environment Variables:
   - `GEMINI_API_KEY`: Your Google AI Studio Key.
   - `SUPABASE_JWT_SECRET`: (Optional) For JWT verification.
4. Run locally: `uvicorn main:app --reload`.

### Frontend (React)
1. Navigate to `/medflux-ui`.
2. Install dependencies: `npm install`.
3. Set Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Run: `npm run dev`.

## ⚖️ Judge's Note (Evaluation Bypass)
For the purpose of the judging ZIP and live preview, **Authentication has been temporarily bypassed** in the backend. You can run simulations and access the intelligence dashboard without creating a Supabase account. 

## 🏗 Roadmap
- **Citizen Portal:** A consumer-facing UI allowing residents to see real-time ICU and resource availability based on optimized logistics data.
- **Multi-Resource Support:** Expanding from single-resource shocks to cross-dependent supply failures.