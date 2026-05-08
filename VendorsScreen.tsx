import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  FileBox, 
  ArrowRightLeft,
  ChevronRight,
  Filter,
  Info,
  Hash
} from 'lucide-react';
import { useAuth } from '../App';
import { Account } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function ChartOfAccountsScreen() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');

  useEffect(() => {
    fetch('/api/accounts', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setAccounts(data);
        setLoading(false);
      });
  }, [token]);

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.name.toLowerCase().includes(search.toLowerCase()) || 
                         acc.code.includes(search);
    const matchesCategory = selectedCategory === 'all' || acc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['asset', 'liability', 'equity', 'revenue', 'expense'];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'asset': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'liability': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'equity': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'revenue': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case 'expense': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-zinc-600 bg-zinc-50 border-zinc-100';
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-brand-ink uppercase tracking-tight">Chart of Accounts</h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">Universal Financial Structure & Taxonomy</p>
        </div>
        <button className="flex items-center gap-2 bg-brand-ink text-white font-bold px-4 py-2 rounded-sm text-[11px] uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Define New Account
        </button>
      </header>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 relative min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <input
            type="text"
            placeholder="FILTER BY CODE OR ACCOUNT NAME..."
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-brand-line rounded-none shadow-sm focus:border-brand-accent outline-none transition-all font-mono text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "px-4 py-2 border font-bold text-[10px] uppercase tracking-widest transition-all",
              selectedCategory === 'all' ? "bg-zinc-900 border-zinc-900 text-white" : "bg-white border-brand-line text-zinc-500 hover:bg-zinc-50"
            )}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 border font-bold text-[10px] uppercase tracking-widest transition-all",
                selectedCategory === cat ? "bg-zinc-900 border-zinc-900 text-white" : "bg-white border-brand-line text-zinc-500 hover:bg-zinc-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="tech-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b-2 border-brand-line">
                <th className="tech-table-header px-6">Code</th>
                <th className="tech-table-header px-6">Account Name</th>
                <th className="tech-table-header px-6">Category</th>
                <th className="tech-table-header px-6">Normal Balance</th>
                <th className="tech-table-header px-6">Description</th>
                <th className="tech-table-header px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3 text-zinc-300" />
                      <span className="text-xs font-mono font-bold text-brand-ink">{account.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-black text-brand-ink uppercase tracking-tight">{account.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 border uppercase tracking-widest leading-none rounded-full",
                      getCategoryColor(account.category)
                    )}>
                      {account.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{account.normal_balance}</span>
                      <div className="w-full bg-zinc-100 h-1 mt-1 rounded-full overflow-hidden">
                        <div className={cn(
                          "h-full transition-all",
                          account.normal_balance === 'debit' ? "w-1/2 bg-blue-500" : "w-full bg-indigo-500 ml-auto"
                        )} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[10px] text-zinc-500 line-clamp-1 italic max-w-[200px]">{account.description}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 px-2 text-[9px] font-bold text-zinc-400 hover:text-brand-ink uppercase tracking-widest border border-transparent hover:border-brand-line transition-all">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAccounts.length === 0 && !loading && (
            <div className="py-24 text-center">
              <FileBox className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">No accounts found in this category</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 p-6 border-brand-ink shadow-2xl relative overflow-hidden">
        <ArrowRightLeft className="absolute -right-4 -bottom-4 w-48 h-48 text-white/5 opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-brand-accent" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Financial Integrity Note</h3>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl">
            The Chart of Accounts (COA) is the backbone of your supermarket's financial reporting. Changes to account codes or categories will affect all historical ledger entries and reports. Ensure all definitions align with GAAP standards before committing new entries.
          </p>
        </div>
      </div>
    </div>
  );
}
