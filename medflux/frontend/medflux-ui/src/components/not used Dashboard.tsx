import React, { cloneElement } from 'react';
import { supabase } from '../supabaseClient';
import { LogOut, Network, Activity, Database, Server, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  session: any;
}


export function Dashboard({ session }: DashboardProps) {
  const navigate = useNavigate(); // <-- ADD THIS
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };
  const userEmail = session?.user?.email || 'Unknown User';
  return (
    <div className="min-h-screen bg-slate-900 bg-tech-grid text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Top Navigation */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-blue-500/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-8 w-8 rounded" />
            <div>
              <h1 className="font-mono font-bold text-slate-100 tracking-tight">
                SC-SIMULATOR
              </h1>
              <div className="text-[10px] font-mono text-blue-400 uppercase tracking-widest leading-none">
                Global Network Control
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-sm font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></span>
              SYSTEM ONLINE
            </div>
            <div className="h-6 w-px bg-slate-700"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-slate-200">
                  {userEmail}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  OPERATOR ID: {session?.user?.id?.substring(0, 8)}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
                title="Sign Out">
                
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                icon={<Database />}
                label="Network Nodes"
                value="1,204"
                trend="+12% this week" />
              
              <StatCard
                icon={<Activity />}
                label="Active Routes"
                value="843"
                trend="Optimal"
                trendColor="text-emerald-400" />
              
              <StatCard
                icon={<Server />}
                label="Server Load"
                value="24%"
                trend="Stable"
                trendColor="text-blue-400" />
              
            </div>

            <div className="bg-slate-800/50 glow-border rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-mono font-semibold text-slate-100 flex items-center gap-2">
                  <Network className="w-5 h-5 text-blue-400" />
                  NETWORK TOPOLOGY
                </h2>
                <button onClick={() => navigate('/simulate')} className="text-xs font-mono bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded border border-blue-500/30 hover:bg-blue-500/20 transition-colors">
                  
                   SIMULATION
                </button>
              </div>

              {/* Placeholder for Network Graph */}
              <div className="aspect-[21/9] w-full bg-slate-900/80 rounded-lg border border-slate-700 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-tech-grid opacity-50"></div>
                <div className="relative z-10 text-center">
                  <Network className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 font-mono text-sm">
                    Awaiting network structure data...
                  </p>
                  <p className="text-slate-500 font-mono text-xs mt-1">
                    JSONB payload required
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Recent Activity */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 glow-border rounded-xl p-6 backdrop-blur-sm h-full">
              <h2 className="text-lg font-mono font-semibold text-slate-100 mb-6 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-400" />
                SYSTEM LOGS
              </h2>

              <div className="space-y-4">
                <LogEntry
                  time="10:42:05"
                  message="Operator authenticated successfully"
                  type="success" />
                
                <LogEntry
                  time="10:42:01"
                  message="Establishing secure connection..."
                  type="info" />
                
                <LogEntry
                  time="09:15:33"
                  message="Route optimization completed"
                  type="info" />
                
                <LogEntry
                  time="08:03:12"
                  message="Node latency detected in EU-West"
                  type="warning" />
                
                <LogEntry
                  time="07:55:00"
                  message="Daily snapshot saved to JSONB"
                  type="success" />
                
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>);

}
function StatCard({
  icon,
  label,
  value,
  trend,
  trendColor = 'text-slate-400'






}: {icon: React.ReactNode;label: string;value: string;trend: string;trendColor?: string;}) {
  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 hover:border-blue-500/30 transition-colors group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-xs font-mono mb-1 uppercase tracking-wider">
            {label}
          </p>
          <h3 className="text-2xl font-semibold text-slate-100">{value}</h3>
        </div>
        <div className="text-slate-500 group-hover:text-blue-400 transition-colors">
          {cloneElement(icon as React.ReactElement, {
            className: 'w-5 h-5'
          })}
        </div>
      </div>
      <div className={`mt-3 text-xs font-mono ${trendColor}`}>{trend}</div>
    </div>);

}
function LogEntry({
  time,
  message,
  type




}: {time: string;message: string;type: 'success' | 'info' | 'warning';}) {
  const colors = {
    success: 'text-emerald-400',
    info: 'text-blue-400',
    warning: 'text-amber-400'
  };
  return (
    <div className="flex gap-3 text-sm font-mono border-l-2 border-slate-700 pl-3 py-1 hover:border-slate-500 transition-colors">
      <span className="text-slate-500 shrink-0">{time}</span>
      <span className={`text-slate-300 ${colors[type]}`}>{message}</span>
    </div>);

}