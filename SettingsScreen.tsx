import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Shield, 
  Lock, 
  Unlock,
  MoreVertical,
  X,
  Check,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../App';
import { User, UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ExtendedUser extends User {
  is_active: number;
  created_at: string;
}

export default function UsersScreen() {
  const { token } = useAuth();
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'cashier' as UserRole
  });

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async res => {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return res.json();
        }
        const text = await res.text();
        throw new Error(`Unexpected server response (${res.status}): ${text.substring(0, 100)}`);
      })
      .then(data => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching users:', err);
        setError(err.message);
        setLoading(false);
      });
  };

  const toggleStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Unexpected response (${res.status} ${res.statusText}): ${text.substring(0, 100)}`);
      }
      
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ username: '', password: '', full_name: '', role: 'cashier' });
        fetchUsers();
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(error.message || 'A network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const roles: UserRole[] = ['admin', 'manager', 'cashier', 'accountant', 'storekeeper', 'auditor'];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-brand-ink uppercase tracking-tight">Identity & Access</h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">Personnel Management & Role-Based Control</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand-ink text-white font-bold px-4 py-2 rounded-sm text-[11px] uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Provision New Account
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
        <input
          type="text"
          placeholder="SEARCH PERSONNEL BY NAME OR IDENTIFIER..."
          className="w-full pl-12 pr-4 py-2.5 bg-white border border-brand-line rounded-none shadow-sm focus:border-brand-accent outline-none transition-all font-mono text-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user.id} className={cn(
            "tech-card p-6 flex flex-col gap-4 relative overflow-hidden transition-all",
            !user.is_active && "opacity-60 bg-zinc-50 grayscale"
          )}>
            {!user.is_active && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-100 rounded text-[8px] font-black text-rose-600 uppercase tracking-widest z-10">
                <Lock className="w-2 h-2" /> Deactivated
              </div>
            )}
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-sm font-black text-sm border-b-2",
                  user.role === 'admin' ? "bg-zinc-900 text-white border-brand-accent text-[12px]" : "bg-white text-brand-ink border-brand-line"
                )}>
                  {user.full_name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xs font-black text-brand-ink uppercase tracking-tight leading-none">{user.full_name}</h3>
                  <p className="text-[10px] font-mono text-zinc-400 mt-1 uppercase">ID: {user.id.split('-')[0]}</p>
                </div>
              </div>
              <button 
                onClick={() => toggleStatus(user.id)}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  user.is_active ? "hover:bg-rose-50 text-rose-400" : "hover:bg-emerald-50 text-emerald-400"
                )}
              >
                {user.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className={cn(
                "text-[9px] font-black px-2 py-0.5 border uppercase tracking-widest leading-none",
                user.role === 'admin' ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-500 border-brand-line"
              )}>
                {user.role}
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 border border-brand-line bg-zinc-50 text-zinc-400 uppercase tracking-widest leading-none">
                @{user.username}
              </span>
            </div>

            <div className="pt-4 border-t border-brand-line mt-auto">
              <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                <span>Access Logs</span>
                <span className="font-mono text-brand-ink">v2.4.1</span>
              </div>
              <div className="mt-2 h-1 bg-zinc-100 rounded-full overflow-hidden">
                <div className={cn(
                  "h-full animate-pulse",
                  user.is_active ? "bg-emerald-500 w-full" : "bg-rose-500 w-0"
                )} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md border border-brand-ink shadow-[12px_12px_0px_rgba(0,0,0,0.1)] overflow-hidden"
            >
              <div className="p-4 border-b border-brand-line flex justify-between items-center bg-zinc-50/50">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-accent" />
                  <h3 className="text-xs font-black text-brand-ink uppercase tracking-[0.2em]">Personnel Provisioning</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-zinc-200 text-zinc-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                    <X className="w-4 h-4" /> {error}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Full Name</label>
                  <input
                    required
                    type="text"
                    disabled={submitting}
                    className="tech-input h-10 w-full"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Username</label>
                    <input
                      required
                      type="text"
                      disabled={submitting}
                      className="tech-input h-10 w-full font-mono text-xs"
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Role</label>
                    <select
                      disabled={submitting}
                      className="tech-input h-10 w-full appearance-none bg-white cursor-pointer"
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    >
                      {roles.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Initial Password</label>
                  <input
                    required
                    type="password"
                    disabled={submitting}
                    className="tech-input h-10 w-full font-mono"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div className="pt-4 flex gap-2">
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-brand-ink text-white font-bold py-3 text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-[4px_4px_0px_#d1d5db] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Provisioning...' : 'Confirm Provisioning'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submitting}
                    className="px-6 bg-white border border-brand-line text-zinc-600 font-bold py-3 text-[10px] uppercase tracking-widest hover:bg-zinc-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
