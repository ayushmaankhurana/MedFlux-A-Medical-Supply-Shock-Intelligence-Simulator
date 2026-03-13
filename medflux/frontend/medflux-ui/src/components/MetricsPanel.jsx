import React from "react";

function MetricsPanel({ results }) {

  if (!results) {

    return (

      <div className="bg-white p-4 rounded shadow">

        <h2 className="font-bold">Results</h2>

        <p>No simulation run yet.</p>

      </div>

    );

  }

  return (

    <div className="bg-white p-4 rounded shadow">

      <h2 className="font-bold mb-2">Simulation Results</h2>

      <p>Recovery Time: {results.recovery_time}</p>

      <p>Peak Shortage: {results.peak_shortage}</p>

      <p>Critical Node: {results.critical_node}</p>

    </div>

  );

}

export default MetricsPanel;