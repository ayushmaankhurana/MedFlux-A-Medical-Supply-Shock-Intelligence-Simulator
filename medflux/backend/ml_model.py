import joblib
import pandas as pd
import numpy as np
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "recovery_model.pkl")

# Load the model safely, but keep track if it fails
try:
    model = joblib.load(MODEL_PATH)
    print("✅ ML Model successfully loaded!")
except FileNotFoundError:
    print(f"❌ CRITICAL ERROR: Could not find model at {MODEL_PATH}")
    model = None

def predict_with_uncertainty(shock, centrality, buffer, lead_var):
    """
    Predicts recovery time with a ± standard deviation margin.
    Raises RuntimeError if model is missing or prediction fails.
    """
    if model is None:
        raise RuntimeError("ML Model (recovery_model.pkl) is not loaded on the server.")

    try:
        data = pd.DataFrame([{
            "shock": shock,
            "centrality": centrality,
            "buffer": buffer,
            "lead_var": lead_var
        }])

        preds = []
        
        for _ in range(20):
            noise = np.random.normal(0, 0.02)
            temp = data.copy()
            temp["shock"] += noise
            
            p = model.predict(temp)[0]
            preds.append(p)

        mean_pred = np.mean(preds)
        std_pred = np.std(preds)

        return float(mean_pred), float(std_pred)
    except Exception as e:
        # Propagate the exact error up to main.py
        raise RuntimeError(f"ML Processing Error: {str(e)}")