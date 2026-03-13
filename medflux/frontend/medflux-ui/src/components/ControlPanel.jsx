import React from "react";

function ControlPanel({ network, setNetwork, runSimulation }) {

  const changeShockType = (value) => {

    setNetwork({
      ...network,
      scenario_settings: {
        ...network.scenario_settings,
        shock_type_selected: value
      }
    });

  };

  return (

    <div className="bg-white p-4 rounded shadow">

      <h2 className="text-lg font-bold mb-3">Scenario Controls</h2>

      <label className="block mb-2">Shock Type</label>

      <select
        className="border p-2 w-full"
        value={network.scenario_settings.shock_type_selected}
        onChange={(e) => changeShockType(e.target.value)}
      >

        <option>Demand Spike</option>
        <option>Node Failure</option>
        <option>Transport Delay</option>

      </select>

      <button
        onClick={runSimulation}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >

        Run Simulation

      </button>

    </div>

  );

}

export default ControlPanel;