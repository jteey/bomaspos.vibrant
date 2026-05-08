import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  FileText, 
  Download, 
  ChevronRight, 
  Calendar,
  User,
  CreditCard,
  X,
  Printer
} from 'lucide-react';
import { useAuth } from '../App';
import { Sale, DetailedSale } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from '../lib/utils';

export default function InvoicesScreen() {
  const { token } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<DetailedSale | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  useEffect(() => {
    fetch('/api/sales', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setSales(data);
        setLoading(false);
      });
  }, [token]);

  const fetchSaleDetails = async (id: string) => {
    setIsModalLoading(true);
    try {
      const res = await fetch(`/api/sales/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedSale(data);
    } catch (error) {
      console.error('Error fetching sale details:', error);
    } finally {
      setIsModalLoading(false);
    }
  };

  const filteredSales = sales.filter(s => 
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.cashier_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.payment_method.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-brand-ink uppercase tracking-tight">Invoice Archive</h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">Transaction History & Receipt Lookup</p>
        </div>
        <button className="flex items-center gap-2 bg-white px-4 py-2 border border-brand-line font-bold text-[11px] uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 transition-colors">
          <Download className="w-4 h-4" /> Export Bulk PDF
        </button>
      </header>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <input
            type="text"
            placeholder="SEARCH BY INVOICE ID, CASHIER OR METHOD..."
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-brand-line rounded-none shadow-sm focus:border-brand-accent outline-none transition-all font-mono text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 bg-white px-4 py-2.5 border border-brand-line font-bold text-[11px] uppercase tracking-widest text-zinc-600 hover:bg-zinc-50">
          <Filter className="w-4 h-4" /> Date Range
        </button>
      </div>

      <div className="tech-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b-2 border-brand-line">
                <th className="tech-table-header">Reference ID</th>
                <th className="tech-table-header">Timestamp</th>
                <th className="tech-table-header">Cashier</th>
                <th className="tech-table-header">Method</th>
                <th className="tech-table-header text-right">Total Amount</th>
                <th className="tech-table-header"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-4 py-4">
                    <p className="text-[11px] font-mono font-bold text-brand-ink uppercase truncate max-w-[120px]">{sale.id}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-zinc-400 uppercase">
                      <Calendar className="w-3 h-3" />
                      {new Date(sale.created_at).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-zinc-100 rounded-sm flex items-center justify-center text-zinc-400 border border-brand-line">
                        <User className="w-3 h-3" />
                      </div>
                      <span className="text-[11px] font-bold text-brand-ink uppercase">{sale.cashier_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[9px] font-black text-zinc-500 bg-white border border-brand-line px-1.5 py-0.5 uppercase tracking-widest leading-none">
                      {sale.payment_method}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-xs font-mono font-bold text-brand-ink">{formatCurrency(sale.total_amount)}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button 
                      onClick={() => fetchSaleDetails(sale.id)}
                      className="p-1.5 hover:bg-zinc-100 rounded transition-colors text-zinc-400 hover:text-brand-ink"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <FileText className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">No invoices found matching criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {selectedSale && (
          <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg border border-brand-ink shadow-[12px_12px_0px_rgba(0,0,0,0.1)] overflow-hidden"
            >
              <div className="p-4 border-b border-brand-line flex justify-between items-center bg-zinc-50/50">
                <h3 className="text-xs font-black text-brand-ink uppercase tracking-[0.2em]">Invoice Detail: {selectedSale.id.split('-')[0]}</h3>
                <button onClick={() => setSelectedSale(null)} className="p-1 hover:bg-zinc-200 text-zinc-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Date / Time</p>
                    <p className="text-[11px] font-bold text-brand-ink mt-1 font-mono uppercase">{new Date(selectedSale.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Payment Method</p>
                    <p className="text-[11px] font-bold text-brand-ink mt-1 uppercase">{selectedSale.payment_method}</p>
                  </div>
                </div>

                <div className="border border-brand-line">
                  <div className="bg-zinc-50 px-3 py-2 border-b border-brand-line">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Line Items</p>
                  </div>
                  <div className="divide-y divide-zinc-100 max-h-[300px] overflow-auto">
                    {selectedSale.items.map((item, i) => (
                      <div key={i} className="px-3 py-3 flex justify-between items-center">
                        <div>
                          <p className="text-[11px] font-bold text-brand-ink uppercase truncate max-w-[200px]">{item.product_name}</p>
                          <p className="text-[10px] font-mono text-zinc-400">{item.quantity} x {formatCurrency(item.price)}</p>
                        </div>
                        <p className="text-[11px] font-mono font-bold text-brand-ink">{formatCurrency(item.total || 0)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-brand-line">
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCurrency(selectedSale.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <span>VAT (16%)</span>
                    <span className="font-mono">{formatCurrency(selectedSale.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-black text-brand-ink uppercase tracking-tight pt-2">
                    <span>Total Due</span>
                    <span className="font-mono">{formatCurrency(selectedSale.total_amount)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => window.print()} className="bg-brand-ink text-white font-bold py-3 text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 shadow-[4px_4px_0px_#d1d5db]">
                    <Printer className="w-3 h-3" /> Re-Print PDF
                  </button>
                  <button className="bg-white border border-brand-line text-zinc-600 font-bold py-3 text-[10px] uppercase tracking-widest hover:bg-zinc-50 transition-colors">
                    Email Customer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
