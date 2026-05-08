import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Product } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  ArrowUpDown,
  AlertTriangle,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  X,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function InventoryScreen() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', sku: '', barcode: '', price: 0, cost_price: 0, stock_quantity: 0, min_stock_level: 5, unit: 'pcs', tax_rate: 0.16
  });

  const fetchProducts = () => {
    fetch('/api/inventory', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async res => {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return res.json();
        }
        const text = await res.text();
        throw new Error(`Inventory Fetch Error (${res.status}): ${text.substring(0, 100)}`);
      })
      .then(setProducts)
      .catch(err => console.error('Products fetch error:', err));
  };

  useEffect(fetchProducts, [token]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newProduct),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewProduct({ name: '', sku: '', barcode: '', price: 0, cost_price: 0, stock_quantity: 0, min_stock_level: 5, unit: 'pcs', tax_rate: 0.16 });
        fetchProducts();
      }
    } catch (err) {
      alert('Failed to add product');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-brand-ink uppercase tracking-tight">Inventory Registry</h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">Stock Control & Logistics</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-brand-accent hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-sm shadow-sm transition-all text-xs uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </header>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <input
            type="text"
            placeholder="FILTER BY SKU, BARCODE OR NAME..."
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-brand-line rounded-none shadow-sm focus:border-brand-accent outline-none transition-all font-mono text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 bg-white px-4 py-2.5 border border-brand-line font-bold text-[11px] uppercase tracking-widest text-zinc-600 hover:bg-zinc-50">
          <Filter className="w-4 h-4" /> Sort/Filter
        </button>
      </div>

      <div className="tech-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b-2 border-brand-line">
                <th className="tech-table-header">Product Definition</th>
                <th className="tech-table-header">Identity</th>
                <th className="tech-table-header text-right">Available Qty</th>
                <th className="tech-table-header text-right">Unit Price</th>
                <th className="tech-table-header text-center">Status</th>
                <th className="tech-table-header"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredProducts.map((p) => {
                const isLowStock = p.stock_quantity <= p.min_stock_level;
                return (
                  <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-100 rounded-sm flex items-center justify-center text-zinc-400 border border-brand-line">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-brand-ink uppercase tracking-tight">{p.name}</p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{p.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-[11px] font-mono font-bold text-zinc-600">{p.sku}</p>
                      <p className="text-[9px] text-zinc-300 font-mono mt-0.5">{p.barcode}</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                       <div className="flex flex-col items-end">
                         <span className={cn(
                           "text-xs font-mono font-bold",
                           isLowStock ? "text-brand-danger" : "text-brand-ink"
                         )}>
                           {p.stock_quantity.toString().padStart(3, '0')}
                         </span>
                         {isLowStock && (
                            <span className="text-[8px] font-black text-brand-danger uppercase tracking-[0.2em] mt-1 bg-rose-50 px-1 border border-rose-100">LOW</span>
                         )}
                       </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-xs font-mono font-bold text-brand-ink">{formatCurrency(p.price)}</p>
                    </td>
                    <td className="px-4 py-4">
                       <div className="flex justify-center">
                         <span className={cn(
                           "px-2 py-0.5 border text-[9px] font-black uppercase tracking-[0.1em]",
                           p.stock_quantity > 0 ? "bg-emerald-50 text-brand-accent border-emerald-200" : "bg-rose-50 text-brand-danger border-rose-200"
                         )}>
                           {p.stock_quantity > 0 ? 'NOMINAL' : 'DEPLETED'}
                         </span>
                       </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="p-1 text-zinc-300 hover:text-zinc-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-24">
              <Package className="w-16 h-16 text-zinc-100 mx-auto mb-4" />
              <p className="text-zinc-400 font-medium">No products found in inventory</p>
            </div>
          )}

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 overflow-hidden relative"
            >
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute right-6 top-6 p-2 hover:bg-zinc-100 rounded-full text-zinc-400"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-2xl font-bold text-zinc-900 mb-8">Register New Inventory</h3>

              <form onSubmit={handleAddProduct} className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Product Name</label>
                  <input 
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-emerald-500 outline-none transition-all font-medium"
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">SKU code</label>
                  <input 
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-emerald-500 outline-none transition-all font-mono"
                    value={newProduct.sku}
                    onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Barcode</label>
                  <input 
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-emerald-500 outline-none transition-all font-mono"
                    value={newProduct.barcode}
                    onChange={e => setNewProduct({...newProduct, barcode: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Cost Price (KES)</label>
                  <input 
                    type="number" 
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-emerald-500 outline-none transition-all font-bold"
                    value={newProduct.cost_price}
                    onChange={e => setNewProduct({...newProduct, cost_price: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Selling Price (KES)</label>
                  <input 
                    type="number" 
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-emerald-500 outline-none transition-all font-bold text-emerald-600"
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Opening Stock</label>
                  <input 
                    type="number" 
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-emerald-500 outline-none transition-all"
                    value={newProduct.stock_quantity}
                    onChange={e => setNewProduct({...newProduct, stock_quantity: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Unit</label>
                  <select 
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-100 focus:border-emerald-500 outline-none transition-all"
                    value={newProduct.unit}
                    onChange={e => setNewProduct({...newProduct, unit: e.target.value})}
                  >
                    <option value="pcs">Pieces (Pcs)</option>
                    <option value="kg">Kilograms (Kg)</option>
                    <option value="l">Litres (L)</option>
                    <option value="pkt">Packet (Pkt)</option>
                  </select>
                </div>
                
                <div className="col-span-2 pt-4">
                  <button type="submit" className="w-full bg-zinc-900 text-white font-bold py-4 rounded-2xl shadow-xl shadow-zinc-200">
                    Add to Inventory
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
