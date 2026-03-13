import React from "react";

function PredictionPanel({ results }) {

  if (!results) {

    return (
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold">Prediction</h2>
        <p>No prediction available yet.</p>
      </div>
    );

  }

  return (

    <div className="bg-white p-4 rounded shadow">

      <h2 className="text-lg font-bold mb-2">
        AI Prediction
      </h2>

      <p>
        Predicted Recovery Time:
        <span className="font-bold text-blue-600 ml-2">
          {results.prediction}
        </span>
      </p>

    </div>

  );

}

export default PredictionPanel;