import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Smartphone, 
  Banknote,
  CheckCircle2,
  X,
  Printer
} from 'lucide-react';
import { useAuth } from '../App';
import { Product, SaleItem, SaleResult } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';


export default function POSScreen() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [search, setSearch] = useState('');
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'card'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null);
  const [mpesaNumber, setMpesaNumber] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/inventory', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()).then(setProducts);
  }, [token]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product_id: product.id, name: product.name, quantity: 1, price: product.price, tax_rate: product.tax_rate }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity * item.tax_rate), 0);
  const total = subtotal + taxTotal;

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ items: cart, payment_method: paymentMethod, mpesa_number: mpesaNumber }),
      });
      
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Transaction Server Error (${res.status}): ${text.substring(0, 100)}`);
      }

      if (res.ok) {
        setSaleResult(data);
        setCart([]);
        setCheckoutModal(false);
      } else {
        alert(data.error || 'Transaction failed');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert(err.message || 'Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-108px)] flex gap-6 overflow-hidden">
      {/* Products Selection */}
      <div className="flex-1 flex flex-col min-w-0 pointer-events-auto">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <input
            ref={searchRef}
            type="text"
            placeholder="SCAN SKU / CATEGORY SEARCH..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-brand-line rounded-none shadow-sm focus:border-brand-accent transition-all outline-none font-mono text-sm placeholder:text-zinc-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-auto pr-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
          {filteredProducts.map((p) => (
            <motion.button
              whileTap={{ scale: 0.98 }}
              key={p.id}
              onClick={() => addToCart(p)}
              className="tech-card p-4 text-left hover:border-brand-accent group transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-bold text-zinc-400 bg-zinc-50 border border-brand-line px-1.5 py-0.5 uppercase tracking-widest leading-none">{p.category_name}</span>
                <span className="text-xs font-mono font-bold text-brand-accent">{formatCurrency(p.price)}</span>
              </div>
              <h3 className="font-bold text-xs text-brand-ink uppercase tracking-tight line-clamp-2 leading-snug">{p.name}</h3>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-50">
                 <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">STOCK: {p.stock_quantity}</p>
                 <Plus className="w-3 h-3 text-zinc-300 group-hover:text-brand-accent" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Cart & Summary */}
      <div className="w-[360px] flex flex-col tech-card overflow-hidden shrink-0">
        <div className="p-4 border-b border-brand-line bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-zinc-500" />
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Order Stream</h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-zinc-400">{cart.length} UNITS</span>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-2">
          {cart.map((item) => (
            <motion.div 
               layout
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               key={item.product_id} 
               className="flex items-center gap-3 bg-white p-3 border border-brand-line shadow-[2px_2px_0px_#f1f5f9]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-brand-ink uppercase truncate">{item.name}</p>
                <p className="text-[10px] font-mono text-zinc-400">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQuantity(item.product_id, -1)} className="p-1 hover:bg-zinc-100 rounded text-zinc-400 border border-brand-line"><Minus className="w-3 h-3" /></button>
                <span className="text-[11px] font-mono font-bold w-6 text-center">{item.quantity.toString().padStart(2, '0')}</span>
                <button onClick={() => updateQuantity(item.product_id, 1)} className="p-1 hover:bg-zinc-100 rounded text-zinc-400 border border-brand-line"><Plus className="w-3 h-3" /></button>
              </div>
              <button 
                onClick={() => removeFromCart(item.product_id)}
                className="p-1.5 text-zinc-300 hover:text-brand-danger"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale">
              <ShoppingCart className="w-12 h-12 text-zinc-300 mb-2" />
              <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em]">Idle Terminal</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-50 border-t border-brand-line space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Net Revenue</span>
              <span className="text-xs font-mono font-bold text-zinc-600">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">VAT (16.0%)</span>
              <span className="text-xs font-mono font-bold text-zinc-600">{formatCurrency(taxTotal)}</span>
            </div>
            <div className="flex justify-between items-end border-t border-brand-line pt-3 mt-2">
              <span className="text-[12px] font-black text-brand-ink uppercase tracking-tight">TOTAL DUE</span>
              <span className="text-xl font-mono font-black text-brand-ink leading-none">{formatCurrency(total)}</span>
            </div>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={() => setCheckoutModal(true)}
            className="w-full bg-brand-ink hover:bg-zinc-800 disabled:bg-zinc-200 text-white font-bold py-4 rounded-none shadow-[4px_4px_0px_#d1d5db] transition-all transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none uppercase tracking-widest text-[11px]"
          >
            PROCESS SETTLEMENT
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {checkoutModal && (
          <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg border border-brand-ink shadow-[12px_12px_0px_rgba(0,0,0,0.1)] overflow-hidden"
            >
              <div className="p-6 border-b border-brand-line flex justify-between items-center bg-zinc-50/50">
                <h3 className="text-xs font-black text-brand-ink uppercase tracking-[0.2em]">Settlement Configuration</h3>
                <button onClick={() => setCheckoutModal(false)} className="p-1 hover:bg-zinc-200 text-zinc-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'Cash', icon: Banknote },
                    { id: 'mpesa', label: 'M-Pesa', icon: Smartphone },
                    { id: 'card', label: 'Card', icon: CreditCard },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 border transition-all rounded-none",
                        paymentMethod === method.id 
                          ? "border-brand-ink bg-zinc-900 text-white font-bold" 
                          : "border-brand-line text-zinc-400 hover:border-zinc-300"
                      )}
                    >
                      <method.icon className="w-5 h-5" />
                      <span className="text-[9px] uppercase tracking-widest font-bold">{method.label}</span>
                    </button>
                  ))}
                </div>

                {paymentMethod === 'mpesa' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Target MSISDN</label>
                    <input 
                      type="text" 
                      placeholder="07XXXXXXXX" 
                      className="w-full px-4 py-3 bg-zinc-50 border border-brand-line focus:border-brand-accent outline-none font-mono text-lg font-bold"
                      value={mpesaNumber}
                      onChange={(e) => setMpesaNumber(e.target.value)}
                    />
                  </motion.div>
                )}

                <div className="bg-zinc-900 p-6 text-white border-brand-ink">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Payable</p>
                      <h4 className="text-2xl font-mono font-black">{formatCurrency(total)}</h4>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Status</p>
                       <p className="text-[10px] font-bold text-brand-accent uppercase underline decoration-brand-accent/30 underline-offset-4 tracking-widest">Awaiting Auth</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-brand-accent hover:bg-emerald-700 disabled:bg-zinc-200 text-white font-black py-4 shadow-[4px_4px_0px_#d1d5db] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all uppercase tracking-widest text-xs"
                >
                  {isProcessing ? 'SYNCHRONIZING WITH SERVER...' : `EXECUTE ${paymentMethod.toUpperCase()} TRANSACTION`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sale Result / eTIMS Modal */}
      <AnimatePresence>
        {saleResult && (
          <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white w-full max-w-sm border border-brand-ink shadow-2xl overflow-hidden"
            >
              <div className="bg-zinc-900 p-6 text-white border-b border-brand-line">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-brand-accent flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                       <h3 className="text-xs font-black uppercase tracking-[0.2em]">Transaction Verified</h3>
                       <p className="text-[9px] font-mono text-zinc-500 mt-0.5">ID: {saleResult.sale_id.split('-')[0].toUpperCase()}</p>
                    </div>
                 </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="text-center py-8">
                   <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                      <CheckCircle2 className="w-10 h-10 text-brand-accent" />
                   </div>
                   <h3 className="text-lg font-black text-brand-ink uppercase tracking-tight">Transaction Successful</h3>
                   <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Receipt Generated & Logged</p>
                </div>

                <div className="space-y-2 pt-2">
                   <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                     <span>Payment Method</span>
                     <span className="text-brand-ink">{paymentMethod.toUpperCase()}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest pt-1 border-t border-zinc-50">
                     <span>Total Final</span>
                     <span className="text-sm font-mono font-black text-brand-ink">{formatCurrency(saleResult.total_amount)}</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setSaleResult(null)} className="bg-brand-ink text-white font-bold py-3 text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-colors">
                    NEW SESSION
                  </button>
                  <button onClick={() => window.print()} className="bg-white border border-brand-line text-zinc-600 font-bold py-3 text-[10px] uppercase tracking-widest hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2">
                    <Printer className="w-3 h-3" /> PRINT INV
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
