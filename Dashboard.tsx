import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Wallet, 
  Settings, 
  LogOut,
  Users,
  BarChart3,
  ReceiptText,
  FileBox,
  Truck
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-[60px] border-b border-brand-line bg-white flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-accent shadow-[0_0_8px_rgba(5,150,105,0.4)]" />
              <span className="text-[11px] font-bold text-zinc-900 uppercase tracking-widest">M-Pesa Active</span>
            </div>
          </div>
          <UserMenu />
        </header>
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function Sidebar() {
  const { user } = useAuth();
  const allLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager', 'accountant', 'auditor', 'cashier', 'storekeeper'] },
    { to: '/pos', icon: ShoppingCart, label: 'POS Checkout', roles: ['admin', 'cashier', 'manager'] },
    { to: '/invoices', icon: ReceiptText, label: 'Invoice Archive', roles: ['admin', 'manager', 'accountant', 'auditor'] },
    { to: '/inventory', icon: Package, label: 'Inventory Mgmt', roles: ['admin', 'manager', 'storekeeper'] },
    { to: '/customers', icon: Users, label: 'Customers', roles: ['admin', 'manager', 'cashier'] },
    { to: '/vendors', icon: Truck, label: 'Vendors', roles: ['admin', 'manager', 'storekeeper'] },
    { to: '/accounting', icon: Wallet, label: 'Accounting / GL', roles: ['admin', 'accountant', 'auditor'] },
    { to: '/accounts', icon: FileBox, label: 'Chart of Accounts', roles: ['admin', 'accountant'] },
    { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin', 'manager', 'accountant', 'auditor'] },
    { to: '/users', icon: Users, label: 'User Accounts', roles: ['admin'] },
    { to: '/settings', icon: Settings, label: 'System Settings', roles: ['admin'] },
  ];

  const links = allLinks.filter(link => link.roles.includes(user?.role || ''));

  const now = new Date();

  return (
    <aside className="w-[220px] bg-white border-r border-brand-line flex flex-col shrink-0">
      <div className="p-6 border-b border-brand-line">
        <div className="flex flex-col">
          <div className="font-black text-xl tracking-tighter leading-none flex items-center gap-1">
            BOMAS <span className="text-brand-accent">POS</span>
          </div>
          <div className="text-[9px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">
            Retail Systems v4.0
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-6 py-3 transition-all text-sm border-l-4",
              isActive 
                ? "bg-zinc-50 text-brand-ink border-brand-accent font-bold" 
                : "text-zinc-500 hover:bg-zinc-50 hover:text-brand-ink border-transparent"
            )}
          >
            <link.icon className="w-4 h-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-brand-line bg-zinc-50/50">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-zinc-400 uppercase font-bold tracking-widest font-mono">24-MAY-24</span>
            <span className="text-zinc-900 font-bold font-mono">14:42:05</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-zinc-400 uppercase font-bold tracking-widest font-mono">Branch ID:</span>
            <span className="text-zinc-900 font-bold font-mono uppercase">NRB-001</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  return (
    <div className="flex items-center gap-6">
      <button className="bg-brand-ink text-white px-4 py-2 rounded-sm text-[11px] font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors">
        End Shift
      </button>
      <div className="h-8 w-px bg-brand-line" />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs font-bold text-brand-ink leading-none">{user?.username.toUpperCase()}</p>
          <p className="text-[10px] font-semibold text-zinc-400 mt-1 uppercase tracking-widest">{user?.role}</p>
        </div>
        <button 
          onClick={logout}
          className="p-2 border border-brand-line rounded-sm hover:bg-zinc-50 transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4 text-zinc-500" />
        </button>
      </div>
    </div>
  );
}
