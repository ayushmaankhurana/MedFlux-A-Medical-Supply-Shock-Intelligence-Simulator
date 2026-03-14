import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MedFluxProvider, useMedFlux } from './store';

// YOUR Core Simulator Components
import { TopNav } from './components/TopNav';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { Canvas } from './components/Canvas';

// Teammate's Auth Page (We keep this for the login wall)
import { AuthPage } from './components/AuthPage';

// 1. Bundle YOUR components into the main view
function MainSimulatorView() {
  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-slate-200 overflow-hidden font-sans">
      <TopNav />
      <div className="flex flex-1 overflow-hidden relative">
        <LeftPanel />
        <Canvas />
        <RightPanel />
      </div>
    </div>
  );
}

// 2. The clean routing logic
function AppRouter() {
  const { session, isLoadingAuth } = useMedFlux();

  // Prevent routing flashes while checking the login token
  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* THE LOGIN WALL */}
        <Route 
          path="/auth" 
          element={!session ? <AuthPage /> : <Navigate to="/" replace />} 
        />
        
        {/* YOUR ACTUAL APPLICATION */}
        <Route 
          path="/" 
          element={session ? <MainSimulatorView /> : <Navigate to="/auth" replace />} 
        />
      </Routes>
    </Router>
  );
}

// 3. The App Entry
export function App() {
  return (
    <MedFluxProvider>
      <AppRouter />
    </MedFluxProvider>
  );
}