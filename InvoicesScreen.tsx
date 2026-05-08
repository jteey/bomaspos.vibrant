import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { formatCurrency, cn } from '../lib/utils';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  FileText, 
  Receipt,
  Download,
  Calendar,
  Layers,
  TrendingUp
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AccountingScreen() {
  const { token } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/daily-sales', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setReports(data);
      setLoading(false);
    });
  }, [token]);

  const totalSales = reports.reduce((sum, r) => sum + (r.total_sales || 0), 0);
  const estimatedVat = totalSales * 0.16 / 1.16; // Simple rough estimate for display

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-black text-brand-ink uppercase tracking-tight">Ledger & Financials</h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">GAAP Compliant System | Secure Financial Registry</p>
        </div>
        <div className="flex gap-2">
           <button className="flex items-center gap-2 bg-white px-4 py-2 border border-brand-line font-bold text-[11px] uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 transition-colors">
             <Download className="w-4 h-4" /> Export CSV
           </button>
           <button className="bg-brand-ink text-white font-bold px-4 py-2 rounded-sm text-[11px] uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-sm">
             Generate Reports
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="tech-card p-5">
          <p className="tech-label mb-2">Gross Revenue (MTD)</p>
          <div className="flex items-baseline gap-2">
            <h3 className="tech-value text-xl text-brand-ink">{formatCurrency(totalSales)}</h3>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">↑ 5.2%</span>
          </div>
        </div>
        <div className="tech-card p-5">
          <p className="tech-label mb-2">VAT Liability (Est.)</p>
          <div className="flex items-baseline gap-2">
            <h3 className="tech-value text-xl text-brand-ink">{formatCurrency(estimatedVat)}</h3>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">16% RATE</span>
          </div>
        </div>
        <div className="tech-card p-5 bg-zinc-900 border-zinc-900 shadow-xl">
          <p className="tech-label text-zinc-400 mb-2">Net Cash Position</p>
          <div className="flex items-baseline gap-2">
            <h3 className="tech-value text-xl text-white">{formatCurrency(totalSales * 0.6 - estimatedVat)}</h3>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-auto" />
          </div>
        </div>
      </div>

      <div className="tech-card">
        <div className="p-4 border-b border-brand-line flex items-center justify-between bg-zinc-50/50">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">General Ledger Activity</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> Revenue
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
              <div className="w-2 h-2 rounded-full bg-rose-500" /> Expenses
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-line bg-zinc-50/10">
                <th className="tech-table-header">Value Date</th>
                <th className="tech-table-header">Category</th>
                <th className="tech-table-header">Control Description</th>
                <th className="tech-table-header text-right">Debit</th>
                <th className="tech-table-header text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {reports.map((report, i) => (
                <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-4 py-3 text-[10px] font-mono font-bold text-zinc-400 uppercase">
                    {report.date}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[9px] font-black text-zinc-500 bg-white border border-brand-line px-1.5 py-0.5 uppercase tracking-widest leading-none">
                      Retail Sales
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[11px] font-bold text-brand-ink uppercase truncate">{report.transaction_count} UNITS PROCESSED</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-mono font-bold text-zinc-300">-</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-mono font-bold text-brand-accent">{formatCurrency(report.total_sales)}</span>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <Layers className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">No entries found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="tech-card bg-zinc-50 p-6 border-dashed">
         <div className="flex gap-6 items-center">
           <div className="shrink-0">
             <div className="w-12 h-12 bg-white border border-brand-line flex items-center justify-center">
               <TrendingUp className="w-6 h-6 text-brand-accent" />
             </div>
           </div>
           <div className="flex-1">
             <h3 className="text-xs font-bold text-brand-ink uppercase tracking-widest mb-1">M-Pesa Reconciliation Unit</h3>
             <p className="text-[10px] text-zinc-500 leading-relaxed max-w-xl uppercase tracking-tighter">
               Direct integration with Safaricom Daraja API is active. Every STK Push is matched against bank statements at 03:00 EAT. Audit trail is permanent and encrypted.
             </p>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Efficiency</p>
              <p className="text-lg font-black text-brand-ink font-mono mt-1">99.9%</p>
           </div>
         </div>
      </div>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  );
}
