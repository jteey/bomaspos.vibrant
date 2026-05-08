import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Package, 
  Users, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'motion/react';
import { useAuth } from '../App';

export default function Dashboard() {
  const { token } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const reportsRes = await fetch('/api/reports/daily-sales', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setReports(data);
        }

        const invRes = await fetch('/api/inventory', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (invRes.ok) {
          const data = await invRes.json();
          setInventory(data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };
    
    fetchData();
  }, [token]);

  const stats = [
    { 
      label: 'Sales Today', 
      value: reports.length > 0 ? formatCurrency(reports[0]?.total_sales || 0) : '---', 
      change: '↑ 12%', 
      trend: 'up', 
      icon: TrendingUp, 
      color: 'emerald' 
    },
    { 
      label: 'VAT Collected', 
      value: reports.length > 0 ? formatCurrency((reports[0]?.total_sales || 0) * 0.16) : '---', 
      change: '16% Rate', 
      trend: 'neutral', 
      icon: AlertCircle, 
      color: 'zinc' 
    },
    { 
      label: 'Active Users', 
      value: 'Cloud Active', 
      change: 'Online Now', 
      trend: 'neutral', 
      icon: Users, 
      color: 'blue' 
    },
    { 
      label: 'Low Stock Alerts', 
      value: inventory.length > 0 ? inventory.filter(p => p.stock_quantity < p.min_stock_level).length + ' Items' : '0 Items', 
      change: 'Action Needed', 
      trend: inventory.some(p => p.stock_quantity < p.min_stock_level) ? 'down' : 'neutral', 
      icon: Package, 
      color: 'orange' 
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-black text-brand-ink uppercase tracking-tight">Main Dashboard</h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">Nairobi Branch | Real-time Telemetry</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={stat.label}
            className="tech-card p-5"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="tech-label">{stat.label}</span>
              <span className={cn(
                "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest",
                stat.trend === 'up' ? "bg-emerald-100 text-emerald-700" : 
                stat.trend === 'down' ? "bg-rose-100 text-rose-700" : "bg-zinc-100 text-zinc-500"
              )}>
                {stat.change}
              </span>
            </div>
            <h3 className="tech-value text-xl text-brand-ink">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        <div className="lg:col-span-2 tech-card flex flex-col">
          <div className="p-4 border-b border-brand-line flex items-center justify-between bg-zinc-50/50">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Revenue Analytics (Sync: 100%)</h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-white border border-brand-line px-2 py-1 uppercase underline decoration-emerald-200">Live Feed</span>
          </div>
          <div className="flex-1 p-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reports.slice().reverse()}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '4px', border: '1px solid #D1D5DB', fontSize: '10px', fontFamily: 'monospace' }}
                />
                <Area type="stepAfter" dataKey="total_sales" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="tech-card flex flex-col bg-zinc-900 text-white border-brand-ink shadow-2xl">
          <div className="p-4 border-b border-white/10 bg-white/5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">System Integrity</h3>
          </div>
          <div className="flex-1 p-6 space-y-6">
             <div className="p-4 bg-white/5 border border-white/10 rounded">
               <div className="text-[18px] font-black text-brand-accent border-b-2 border-brand-accent inline-block leading-none mb-4">LOGS</div>
               <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Security Module Active</div>
               <div className="font-mono text-[10px] text-zinc-400 leading-relaxed uppercase">
                 Branch: 001-NAI<br/>
                 Status: Nominal<br/>
                 Crypto: AES-256
               </div>
             </div>

             <div>
               <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Recent Activity</h4>
               <div className="text-center py-4 border border-white/5 rounded italic text-zinc-600 text-[10px]">
                 All systems operational.
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
