import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  ChevronRight } from
'lucide-react';
export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        setMessage(
          'Registration successful! Please check your email to verify your account.'
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin // Automatically uses localhost or vercel.app
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred with Google login.');
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-900 bg-tech-grid flex items-center justify-center p-4 selection:bg-blue-500/30">
      <div className="w-full max-w-md relative z-10">
        {/* Decorative elements */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Main Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl glow-border overflow-hidden relative">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-emerald-400"></div>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-slate-900 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)] mb-4 relative group">
                <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur group-hover:bg-blue-500/30 transition-colors"></div>
                <img src="/icon.jpeg" alt="Logo" className="w-20 h-20 relative z-10" />
              </div>
              <h1 className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
                MEDFLUX
              </h1>
              <p className="text-sm text-slate-400 font-mono mt-2 uppercase tracking-widest">
                Secure Access Portal
              </p>
            </div>

            {/* Error/Message Alerts */}
            {error &&
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            }
            {message &&
            <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/50 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-200">{message}</p>
              </div>
            }

            {/* Auth Form */}
            <form onSubmit={handleEmailAuth} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wider ml-1">
                  Operator Email
                </label>
                <div className="relative glow-border-focus rounded-lg transition-all">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-0 sm:text-sm transition-colors"
                    placeholder="operator@network.local" />
                  
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wider ml-1">
                  Access Code
                </label>
                <div className="relative glow-border-focus rounded-lg transition-all">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-0 sm:text-sm transition-colors"
                    placeholder="••••••••••••" />
                  
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                
                {loading ?
                <Loader2 className="w-5 h-5 animate-spin" /> :

                <>
                    {isSignUp ? 'INITIALIZE ACCOUNT' : 'AUTHENTICATE'}
                    <ChevronRight className="w-4 h-4" />
                  </>
                }
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-800 text-slate-500 font-mono text-xs uppercase tracking-wider">
                    External Auth
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  type="button"
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-slate-600 rounded-lg shadow-sm bg-white hover:bg-slate-50 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4" />
                    
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853" />
                    
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05" />
                    
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335" />
                    
                  </svg>
                  Sign in with Google
                </button>
              </div>
            </div>

            {/* Toggle Mode */}
            <div className="mt-8 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm font-mono text-slate-400 hover:text-blue-400 transition-colors uppercase tracking-wide">
                
                {isSignUp ?
                'Return to Authentication' :
                'Request Operator Access'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs font-mono text-slate-600 uppercase tracking-widest">
          <p>Secure Connection • End-to-End Encrypted</p>
        </div>
      </div>
    </div>);

}