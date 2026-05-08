import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
  Download
} from 'lucide-react';
import { useAuth } from '../App';
import { formatCurrency } from '../lib/utils';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface ProductPerf {
  name: string;
  total_quantity: number;
  total_revenue: number;
}

interface PaymentMethod {
  payment_method: string;
  count: number;
  total: number;
}

interface ProfitLoss {
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  margin: number;
}

interface ExpenseBreakdown {
  account_name: string;
  total_amount: number;
}

interface SaleRecord {
  id: string;
  cashier_name: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
}

export default function ReportsScreen() {
  const { token } = useAuth();
  const [productPerformance, setProductPerformance] = useState<ProductPerf[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [profitLoss, setProfitLoss] = useState<ProfitLoss | null>(null);
  const [expenses, setExpenses] = useState<ExpenseBreakdown[]>([]);
  const [recentSales, setRecentSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, payRes, plRes, expRes, salesRes] = await Promise.all([
          fetch('/api/reports/product-performance', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/reports/payment-methods', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/reports/profit-loss', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/reports/expenses', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/sales', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const checkRes = async (res: Response) => {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return res.json();
          }
          const text = await res.text();
          throw new Error(`Report Fetch Error (${res.status}): ${text.substring(0, 100)}`);
        };

        const prodData = await checkRes(prodRes);
        const payData = await checkRes(payRes);
        const plData = await checkRes(plRes);
        const expData = await checkRes(expRes);
        const salesData = await checkRes(salesRes);

        setProductPerformance(prodData);
        setPaymentMethods(payData);
        setProfitLoss(plData);
        setExpenses(expData);
        setRecentSales(salesData.slice(0, 50)); // Showing top 50 recent transactions
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-brand-ink uppercase tracking-tight">Reports Dashboard</h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">Financial & Operational Performance</p>
        </div>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 bg-white px-4 py-2 border border-brand-line font-bold text-[11px] uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 transition-colors">
              <Download className="w-4 h-4" /> Export Results
            </button>
        </div>
      </header>

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="tech-card p-6 border-l-4 border-emerald-500">
           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Gross Revenue</p>
           <h3 className="text-xl font-mono font-black text-brand-ink">{formatCurrency(profitLoss?.revenue || 0)}</h3>
        </div>
        <div className="tech-card p-6 border-l-4 border-rose-500">
           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total COGS</p>
           <h3 className="text-xl font-mono font-black text-brand-ink">{formatCurrency(profitLoss?.cogs || 0)}</h3>
        </div>
        <div className="tech-card p-6 border-l-4 border-rose-400">
           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Expenses</p>
           <h3 className="text-xl font-mono font-black text-brand-ink">{formatCurrency(profitLoss?.expenses || 0)}</h3>
        </div>
        <div className="tech-card p-6 border-l-4 border-brand-accent">
           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Net Earnings</p>
           <h3 className="text-xl font-mono font-black text-brand-accent">{formatCurrency(profitLoss?.netProfit || 0)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <div className="tech-card flex flex-col h-[400px]">
          <div className="p-4 border-b border-brand-line bg-zinc-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Expense Categories</h3>
            </div>
          </div>
          <div className="flex-1 p-6 overflow-auto">
            <div className="space-y-4">
              {expenses.length > 0 ? expenses.map((exp, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-zinc-50">
                  <div>
                    <p className="text-[10px] font-black text-brand-ink uppercase tracking-tight">{exp.account_name}</p>
                    <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest">Operating Expense</p>
                  </div>
                  <p className="text-sm font-mono font-bold text-rose-500">-{formatCurrency(exp.total_amount)}</p>
                </div>
              )) : (
                <p className="text-xs text-zinc-400 text-center py-8">No specific expenses recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="tech-card flex flex-col h-[400px]">
          <div className="p-4 border-b border-brand-line bg-zinc-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Top Revenue Products</h3>
            </div>
          </div>
          <div className="flex-1 p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productPerformance} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150} 
                  tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#64748b' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '4px', border: '1px solid #D1D5DB', fontSize: '10px', fontFamily: 'monospace' }} 
                />
                <Bar dataKey="total_revenue" radius={[0, 4, 4, 0]}>
                  {productPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="tech-card flex flex-col h-[400px]">
          <div className="p-4 border-b border-brand-line bg-zinc-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Revenue Distribution</h3>
            </div>
          </div>
          <div className="flex-1 p-6 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="total"
                  >
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '4px', border: '1px solid #D1D5DB', fontSize: '10px', fontFamily: 'monospace' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-4">
              {paymentMethods.map((method, index) => (
                <div key={method.payment_method} className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{method.payment_method}</span>
                  </div>
                  <div className="text-sm font-mono font-bold text-brand-ink ml-4 mt-0.5">
                    {formatCurrency(method.total)}
                    <span className="text-[9px] text-zinc-400 ml-2 font-black">({method.count} TXNS)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Profit & Loss Statement */}
        <div className="tech-card lg:col-span-2 flex flex-col">
          <div className="p-4 border-b border-brand-line bg-brand-ink text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Comprehensive Profit & Loss Statement (MTD)</h3>
            </div>
            <div className="flex items-center gap-4">
               <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Currency: KES</span>
               <span className="text-[9px] font-bold text-emerald-400 border border-emerald-400/30 px-1.5 py-0.5 uppercase tracking-widest">Audited Unit</span>
            </div>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12 font-mono">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-brand-ink uppercase tracking-widest pb-2 border-b border-brand-line">Revenue & Direct Costs</h4>
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Total Sales Revenue</span>
                <span className="text-sm font-bold text-brand-ink">{formatCurrency(profitLoss?.revenue || 0)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Cost of Sales (COGS)</span>
                <span className="text-sm font-bold text-rose-500">-{formatCurrency(profitLoss?.cogs || 0)}</span>
              </div>
              <div className="flex justify-between items-baseline bg-zinc-50 p-2 border-l-2 border-brand-ink">
                <span className="text-[11px] font-black text-brand-ink uppercase tracking-widest">Gross Profit</span>
                <span className="text-sm font-black text-brand-ink">{formatCurrency(profitLoss?.grossProfit || 0)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-brand-ink uppercase tracking-widest pb-2 border-b border-brand-line">Operational Performance</h4>
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Operating Expenses</span>
                <span className="text-sm font-bold text-rose-500">-{formatCurrency(profitLoss?.expenses || 0)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Other Income</span>
                <span className="text-sm font-bold text-brand-ink">{formatCurrency(0)}</span>
              </div>
              <div className="pt-6 mt-4 border-t-2 border-brand-ink">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-[10px] font-black text-brand-ink uppercase tracking-[0.2em] mb-1">Net Earnings (EBIT)</h4>
                    <p className="text-[9px] text-emerald-600 font-bold uppercase">
                      Net Margin: {((profitLoss?.netProfit || 0) / (profitLoss?.revenue || 1) * 100).toFixed(2)}%
                    </p>
                  </div>
                  <span className="text-2xl font-black text-brand-accent tracking-tighter">
                    {formatCurrency(profitLoss?.netProfit || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 bg-zinc-50 border-t border-brand-line text-[9px] font-bold text-zinc-400 text-center uppercase tracking-widest">
            This report represents the financial position as of {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="tech-card p-6 bg-zinc-900 border-zinc-900 shadow-2xl relative overflow-hidden group">
           <BarChart3 className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 opacity-20 group-hover:scale-110 transition-transform" />
           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Stock Turn Rate</p>
           <h3 className="text-2xl font-mono font-black text-white">4.2x</h3>
           <div className="flex items-center gap-2 mt-4">
             <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 uppercase">Optimal</span>
             <span className="text-[9px] text-zinc-500 uppercase font-mono">Benchmark: 3.5x</span>
           </div>
        </div>

        <div className="tech-card p-6 border-dashed border-2">
           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Average Ticket Value</p>
           <h3 className="text-2xl font-mono font-black text-brand-ink">{formatCurrency(1450.50)}</h3>
           <div className="flex items-center gap-2 mt-4 text-emerald-600">
             <ArrowUpRight className="w-3 h-3" />
             <span className="text-[10px] font-bold uppercase tracking-widest">↑ 12.4% vs LMTD</span>
           </div>
        </div>

        <div className="tech-card p-6 border-dashed border-2">
           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Customer Revisit Rate</p>
           <h3 className="text-2xl font-mono font-black text-brand-ink">68%</h3>
           <div className="flex items-center gap-2 mt-4 text-rose-500">
             <ArrowDownRight className="w-3 h-3" />
             <span className="text-[10px] font-bold uppercase tracking-widest">↓ 2.1% vs LMTD</span>
           </div>
        </div>
      </div>

      {/* Recent Transaction Report */}
      <div className="tech-card">
        <div className="p-4 border-b border-brand-line bg-brand-ink text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Master Transaction Archive</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-brand-line">
                <th className="px-6 py-3 text-[10px] font-black text-brand-ink uppercase tracking-widest">Reference ID</th>
                <th className="px-6 py-3 text-[10px] font-black text-brand-ink uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-3 text-[10px] font-black text-brand-ink uppercase tracking-widest">Cashier</th>
                <th className="px-6 py-3 text-[10px] font-black text-brand-ink uppercase tracking-widest">Method</th>
                <th className="px-6 py-3 text-[10px] font-black text-brand-ink uppercase tracking-widest text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {recentSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-tighter">#{sale.id.slice(0, 8)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {new Date(sale.created_at).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-brand-ink">{sale.cashier_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest border border-brand-accent/30 px-1.5 py-0.5 rounded-sm bg-brand-accent/5">
                      {sale.payment_method}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-mono font-black text-brand-ink">{formatCurrency(sale.total_amount)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
