import React, { useState } from 'react';
import { useAuth } from '../App';
import { LayoutDashboard, Store } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-zinc-200/50 p-10 border border-zinc-100"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
            <Store className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Bomas POS</h1>
          <p className="text-zinc-500 mt-2 text-sm font-medium">Kenyan Supermarket System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-medium border border-rose-100 italic">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none bg-zinc-50/50"
              placeholder="e.g. admin"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none bg-zinc-50/50"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 transition-all transform active:scale-[0.98]"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-zinc-100 text-center">
          <p className="text-xs text-zinc-400 font-medium">Bomas Professional Retail Solutions</p>
        </div>
      </motion.div>
    </div>
  );
}
