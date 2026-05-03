import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Loader2, Lock } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // App.tsx logic will automatically redirect once auth state updates
    } catch (err: any) {
      setLoading(false);
      console.error("Login Error:", err.code);
      
      // Production Error Mapping
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError("Invalid email or password.");
          break;
        case 'auth/network-request-failed':
          setError("Network error. Please check your connection.");
          break;
        case 'auth/too-many-requests':
          setError("Too many failed attempts. Try again later.");
          break;
        default:
          setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-sans p-4">
      {/* Brand Logo */}
      <div className="mb-8 animate-in fade-in zoom-in duration-700">
        <img 
          src="/Truda-Logo-Red-2022_CMYK.png" 
          alt="Truda Logo" 
          className="h-16 drop-shadow-sm"
        />
      </div>

      {/* Login Card */}
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.05)] w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Debtors Portal</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Lock size={12} className="text-[#E31E24]" />
            <p className="text-gray-400 text-xs uppercase font-bold tracking-widest">
              Authorized Personnel Only
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 ml-1 mb-1">
              Work Email
            </label>
            <input 
              type="email" 
              autoComplete="email"
              className="w-full p-3.5 rounded-xl border border-gray-200 focus:border-[#E31E24] focus:ring-2 focus:ring-red-50 focus:outline-none transition-all text-sm"
              placeholder="e.g. name@truda.co.za"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              disabled={loading}
              required 
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 ml-1 mb-1">
              Password
            </label>
            <input 
              type="password" 
              autoComplete="current-password"
              className="w-full p-3.5 rounded-xl border border-gray-200 focus:border-[#E31E24] focus:ring-2 focus:ring-red-50 focus:outline-none transition-all text-sm"
              placeholder="••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              disabled={loading}
              required 
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-[#E31E24] text-xs py-3 px-4 rounded-lg text-center animate-shake">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#E31E24] text-white font-bold py-3.5 rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all shadow-lg shadow-red-100 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-1">
        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-[0.2em]">
          Truda Foods Portal © 2026
        </p>
        <p className="text-gray-300 text-[9px]">Internal Architecture v2.0.4</p>
      </div>
    </div>
  );
};

export default LoginPage;