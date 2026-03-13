import React, { useState } from "react";

import NetworkGraph from "./components/NetworkGraph";
import ControlPanel from "./components/ControlPanel";
import MetricsPanel from "./components/MetricsPanel";
import PredictionPanel from "./components/PredictionPanel";

import { initialNetwork } from "./data/initialNetwork";
import { runSimulation } from "./services/api";

function App() {

  const [network, setNetwork] = useState(initialNetwork);
  const [results, setResults] = useState(null);

  const handleSimulation = async () => {

    try {

      const response = await runSimulation(network);

      setResults(response.data);

    } catch (err) {

      console.log(err);

    }

  };

  return (

    <div className="min-h-screen bg-gray-100">

      {/* Header */}

      <div className="bg-blue-600 text-white p-4 shadow">

        <h1 className="text-2xl font-bold">
          MedFlux — Medical Supply Shock Simulator
        </h1>

      </div>

      {/* Dashboard */}

      <div className="grid grid-cols-3 gap-6 p-6">

        {/* Graph */}

        <div className="col-span-2 bg-white rounded-lg shadow p-4">

          <NetworkGraph network={network} />

        </div>

        {/* Sidebar */}

        <div className="space-y-4">

          <ControlPanel
            network={network}
            setNetwork={setNetwork}
            runSimulation={handleSimulation}
          />

          <PredictionPanel results={results} />

          <MetricsPanel results={results} />

        </div>

      </div>

    </div>

  );

}

export default App;