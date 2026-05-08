import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'bomas-pos-secret-123';

async function startServer() {
  console.log('[SERVER] Starting initialization...');
  
  const db = new Database('bomas.db');
  console.log('[SERVER] Database connected');

  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      full_name TEXT,
      role TEXT CHECK(role IN ('admin', 'manager', 'cashier', 'accountant', 'storekeeper', 'auditor')),
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      category_id TEXT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      barcode TEXT UNIQUE,
      description TEXT,
      price REAL NOT NULL,
      cost_price REAL NOT NULL,
      tax_rate REAL DEFAULT 0.16,
      stock_quantity INTEGER DEFAULT 0,
      min_stock_level INTEGER DEFAULT 10,
      expiry_date DATE,
      unit TEXT DEFAULT 'pcs',
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      kra_pin TEXT
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      supplier_id TEXT,
      status TEXT CHECK(status IN ('pending', 'received', 'cancelled')),
      total_amount REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      cashier_id TEXT,
      customer_id TEXT,
      subtotal REAL,
      tax_amount REAL,
      discount_amount REAL DEFAULT 0,
      total_amount REAL,
      payment_method TEXT CHECK(payment_method IN ('cash', 'mpesa', 'card', 'split')),
      mpesa_transaction_id TEXT,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(cashier_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT,
      product_id TEXT,
      quantity INTEGER,
      unit_price REAL,
      tax_rate REAL,
      discount REAL DEFAULT 0,
      total REAL,
      FOREIGN KEY(sale_id) REFERENCES sales(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT UNIQUE NOT NULL,
      category TEXT CHECK(category IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
      normal_balance TEXT CHECK(normal_balance IN ('debit', 'credit')),
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ledger (
      id TEXT PRIMARY KEY,
      account_name TEXT NOT NULL,
      type TEXT CHECK(type IN ('debit', 'credit')),
      amount REAL NOT NULL,
      reference_id TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      kra_pin TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      loyalty_points INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (id, username, password, full_name, role) VALUES (?, ?, ?, ?, ?)')
      .run(uuidv4(), 'admin', hashedPassword, 'System Admin', 'admin');
  }

  const accountExists = db.prepare('SELECT id FROM accounts').get();
  if (!accountExists) {
    const accountsData = [
      { code: '1000', name: 'Cash on Hand', category: 'asset', balance: 'debit', desc: 'Petty cash and till balances' },
      { code: '1100', name: 'Bank Account', category: 'asset', balance: 'debit', desc: 'Main operating bank account' },
      { code: '1200', name: 'M-Pesa Clearing', category: 'asset', balance: 'debit', desc: 'M-Pesa settlement account' },
      { code: '1300', name: 'Inventory Asset', category: 'asset', balance: 'debit', desc: 'Value of products in warehouse' },
      { code: '2000', name: 'Accounts Payable', category: 'liability', balance: 'credit', desc: 'Unpaid supplier invoices' },
      { code: '3000', name: 'Retained Earnings', category: 'equity', balance: 'credit', desc: 'Accumulated profits' },
      { code: '4000', name: 'Sales Revenue', category: 'revenue', balance: 'credit', desc: 'Income from point of sale' },
      { code: '5000', name: 'Cost of Goods Sold', category: 'expense', balance: 'debit', desc: 'Direct cost of inventory sold' },
      { code: '5100', name: 'Electricity Expense', category: 'expense', balance: 'debit', desc: 'Utility costs' },
      { code: '5200', name: 'Staff Salaries', category: 'expense', balance: 'debit', desc: 'Payroll costs' }
    ];

    const stmt = db.prepare('INSERT INTO accounts (id, code, name, category, normal_balance, description) VALUES (?, ?, ?, ?, ?, ?)');
    accountsData.forEach(acc => {
      stmt.run(uuidv4(), acc.code, acc.name, acc.category, acc.balance, acc.desc);
    });
  }

  const categoryExists = db.prepare('SELECT id FROM categories').get();
  if (!categoryExists) {
    const Cat1Id = uuidv4();
    const Cat2Id = uuidv4();
    db.prepare('INSERT INTO categories (id, name) VALUES (?, ?), (?, ?)').run(Cat1Id, 'Groceries', Cat2Id, 'Household');
    
    db.prepare('INSERT INTO products (id, category_id, name, sku, barcode, price, cost_price, stock_quantity, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), Cat1Id, 'Tuskys Premium Milk 1L', 'MLK-001', '616110001', 120, 95, 50, 'pkt');
    db.prepare('INSERT INTO products (id, category_id, name, sku, barcode, price, cost_price, stock_quantity, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), Cat1Id, 'Jogoo Maize Flour 2Kg', 'MAZ-002', '616110002', 205, 180, 100, 'pkt');
    db.prepare('INSERT INTO products (id, category_id, name, sku, barcode, price, cost_price, stock_quantity, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), Cat2Id, 'Omo Washing Powder 500g', 'DTR-003', '616110003', 185, 140, 30, 'pcs');
  }

  const app = express();
  
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[SERVER] ${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  app.use(cors());
  app.use(express.json());

  const authenticateToken = (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) {
        console.warn('[AUTH] No token provided');
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
      }

      jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
          console.error('[AUTH] Token verification failed:', err.message);
          return res.status(403).json({ error: 'Forbidden: Invalid token' });
        }
        
        try {
          const activeUser = db.prepare('SELECT id, is_active, role FROM users WHERE id = ?').get(user.id) as any;
          if (!activeUser) {
            console.warn(`[AUTH] User not found in DB: ${user.id}`);
            return res.status(403).json({ error: 'Forbidden: User not found' });
          }
          if (!activeUser.is_active) {
            console.warn(`[AUTH] Account deactivated for user: ${user.id}`);
            return res.status(403).json({ error: 'Forbidden: Account is deactivated' });
          }
          req.user = { id: activeUser.id, username: user.username, role: activeUser.role };
          next();
        } catch (dbErr: any) {
          console.error('[AUTH] DB Error in middleware:', dbErr);
          return res.status(500).json({ error: 'Internal server error during authentication' });
        }
      });
    } catch (err: any) {
      console.error('[AUTH] Middleware crash:', err);
      return res.status(500).json({ error: 'Internal server error in auth logic' });
    }
  };

  const checkRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user || !roles.includes(req.user.role)) {
        console.warn(`[AUTH] Insufficient permissions for user ${req.user?.id} (${req.user?.role}). Required: ${roles.join(',')}`);
        return res.status(403).json({ 
          error: 'Forbidden: Insufficient permissions',
          details: `Required role(s): ${roles.join(', ')}. Your role: ${req.user?.role || 'Guest'}`
        });
      }
      next();
    };
  };

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    try {
      const user = db.prepare('SELECT id, username, full_name, role, is_active FROM users WHERE id = ?').get(req.user.id) as any;
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
      
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
      if (user && bcrypt.compareSync(password, user.password)) {
        if (!user.is_active) return res.status(403).json({ error: 'Account deactivated' });
        
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role }, 
          JWT_SECRET, 
          { expiresIn: '24h' }
        );
        
        res.json({ 
          token, 
          user: { 
            id: user.id, 
            username: user.username, 
            full_name: user.full_name, 
            role: user.role 
          } 
        });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // --- USER MANAGEMENT ---
  app.get('/api/users', authenticateToken, checkRole(['admin', 'manager']), (req, res) => {
    try {
      const users = db.prepare('SELECT id, username, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC').all();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/users', authenticateToken, checkRole(['admin']), (req, res) => {
    try {
      const { username, password, full_name, role } = req.body;
      if (!username || !password || !role) return res.status(400).json({ error: 'Missing required fields' });
      
      const hashedPassword = bcrypt.hashSync(password, 10);
      const id = uuidv4();
      
      db.prepare('INSERT INTO users (id, username, password, full_name, role) VALUES (?, ?, ?, ?, ?)')
        .run(id, username.toLowerCase(), hashedPassword, full_name, role);
        
      res.json({ id, username, full_name, role, is_active: 1 });
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/users/:id/toggle-status', authenticateToken, checkRole(['admin']), (req, res) => {
    try {
      const user = db.prepare('SELECT is_active FROM users WHERE id = ?').get(req.params.id) as any;
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      const newStatus = user.is_active ? 0 : 1;
      db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(newStatus, req.params.id);
      
      res.json({ success: true, is_active: newStatus });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- INVENTORY ---
  app.get('/api/categories', authenticateToken, (req, res) => {
    try {
      const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
      res.json(categories);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/inventory', authenticateToken, (req, res) => {
    try {
      const products = db.prepare(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.name ASC
      `).all();
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/inventory', authenticateToken, checkRole(['admin', 'manager', 'storekeeper']), (req, res) => {
    try {
      const p = req.body;
      if (!p.name || !p.price || !p.cost_price) {
        return res.status(400).json({ error: 'Missing required product data' });
      }
      
      const id = uuidv4();
      db.prepare(`
        INSERT INTO products (
          id, category_id, name, sku, barcode, description, 
          price, cost_price, tax_rate, stock_quantity, 
          min_stock_level, expiry_date, unit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, p.category_id, p.name, p.sku, p.barcode, p.description, 
        p.price, p.cost_price, p.tax_rate || 0.16, p.stock_quantity || 0, 
        p.min_stock_level || 10, p.expiry_date, p.unit || 'pcs'
      );
      
      res.json({ id, ...p });
    } catch (err: any) {
      if (err.message && err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'SKU or Barcode already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // --- SALES ---
  app.get('/api/sales', authenticateToken, checkRole(['admin', 'manager', 'auditor']), (req, res) => {
    try {
      const sales = db.prepare(`
        SELECT s.*, u.full_name as cashier_name 
        FROM sales s 
        LEFT JOIN users u ON s.cashier_id = u.id 
        ORDER BY s.created_at DESC
      `).all();
      res.json(sales);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/sales/:id', authenticateToken, (req, res) => {
    try {
      const sale = db.prepare(`
        SELECT s.*, u.full_name as cashier_name 
        FROM sales s 
        LEFT JOIN users u ON s.cashier_id = u.id 
        WHERE s.id = ?
      `).get(req.params.id) as any;
      
      if (!sale) return res.status(404).json({ error: 'Sale record not found' });
      
      const items = db.prepare(`
        SELECT si.*, p.name as product_name 
        FROM sale_items si 
        JOIN products p ON si.product_id = p.id 
        WHERE si.sale_id = ?
      `).all(req.params.id);
      
      res.json({ ...sale, items });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/sales', authenticateToken, checkRole(['admin', 'cashier', 'manager']), (req: any, res: any) => {
    const { items, payment_method, mpesa_transaction_id } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items in sale' });
    }

    try {
      const result = db.transaction(() => {
        let subtotal = 0;
        let tax = 0;
        const sale_id = uuidv4();
        
        // Pre-calculate totals and check stock
        const itemsWithDetails = items.map(item => {
          const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id) as any;
          if (!product) throw new Error(`Product not found: ${item.product_id}`);
          if (product.stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`);
          }
          const itemTotal = item.quantity * product.price;
          const itemTax = itemTotal * product.tax_rate;
          subtotal += itemTotal;
          tax += itemTax;
          return { ...item, product, itemTotal, itemTax };
        });

        const total_amount = subtotal + tax;
        
        // 1. Insert Sales Record FIRST
        db.prepare(`
          INSERT INTO sales (id, cashier_id, subtotal, tax_amount, total_amount, payment_method, mpesa_transaction_id) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(sale_id, req.user.id, subtotal, tax, total_amount, payment_method, mpesa_transaction_id || null);

        // 2. Insert Sale Items and Update Stock
        for (const detail of itemsWithDetails) {
          db.prepare(`
            INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, tax_rate, total) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(uuidv4(), sale_id, detail.product_id, detail.quantity, detail.product.price, detail.product.tax_rate, detail.itemTotal + detail.itemTax);
          
          db.prepare('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?')
            .run(detail.quantity, detail.product_id);
        }
        
        // 3. Automatic Ledger Entry
        const ledgerId = uuidv4();
        db.prepare(`
          INSERT INTO ledger (id, account_name, type, amount, reference_id, description)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(ledgerId, 'Sales Revenue', 'credit', total_amount, sale_id, `POS Sale ${sale_id}`);

        return { sale_id, total_amount };
      })();
      
      res.json(result);
    } catch (err: any) {
      console.error('Sale transaction error:', err);
      res.status(400).json({ error: err.message });
    }
  });

  // --- ACCOUNTS ---
  app.get('/api/accounts', authenticateToken, checkRole(['admin', 'accountant', 'auditor']), (req, res) => {
    try {
      const accounts = db.prepare('SELECT * FROM accounts ORDER BY code ASC').all();
      res.json(accounts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/ledger', authenticateToken, checkRole(['admin', 'accountant']), (req, res) => {
    try {
      const entries = db.prepare('SELECT * FROM ledger ORDER BY created_at DESC LIMIT 100').all();
      res.json(entries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- REPORTS ---
  app.get('/api/reports/dashboard', authenticateToken, checkRole(['admin', 'manager', 'accountant']), (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const summary = db.prepare(`
        SELECT 
          (SELECT SUM(total_amount) FROM sales WHERE date(created_at) = ?) as today_sales,
          (SELECT COUNT(*) FROM sales WHERE date(created_at) = ?) as today_transactions,
          (SELECT COUNT(*) FROM products WHERE stock_quantity <= min_stock_level) as low_stock_count
      `).get(today, today) as any;

      const recentSales = db.prepare(`
        SELECT s.*, u.full_name as cashier_name 
        FROM sales s 
        LEFT JOIN users u ON s.cashier_id = u.id 
        ORDER BY s.created_at DESC LIMIT 5
      `).all();

      res.json({ summary, recentSales });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/reports/daily-sales', authenticateToken, checkRole(['admin', 'manager', 'accountant']), (req, res) => {
    try {
      const report = db.prepare(`
        SELECT date(created_at) as date, SUM(total_amount) as total_sales, COUNT(*) as transactions 
        FROM sales 
        GROUP BY date(created_at) 
        ORDER BY date DESC LIMIT 30
      `).all();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/reports/product-performance', authenticateToken, (req, res) => {
    try {
      const report = db.prepare(`
        SELECT p.name, SUM(si.quantity) as total_sold, SUM(si.total) as total_revenue
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        GROUP BY p.id
        ORDER BY total_sold DESC LIMIT 10
      `).all();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/reports/expenses', authenticateToken, checkRole(['admin', 'manager', 'accountant']), (req, res) => {
    try {
      const expenses = db.prepare(`
        SELECT account_name, SUM(amount) as total_amount 
        FROM ledger 
        WHERE type = 'debit' AND account_name IN (SELECT name FROM accounts WHERE category = 'expense')
        GROUP BY account_name
      `).all();
      res.json(expenses);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/reports/payment-methods', authenticateToken, (req, res) => {
    try {
      const report = db.prepare(`
        SELECT payment_method, SUM(total_amount) as total, COUNT(*) as count
        FROM sales
        GROUP BY payment_method
      `).all();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/reports/profit-loss', authenticateToken, checkRole(['admin', 'accountant']), (req, res) => {
    try {
      const revenues = db.prepare(`SELECT SUM(amount) as total FROM ledger WHERE type = 'credit' AND account_name = 'Sales Revenue'`).get() as any;
      const cogs = db.prepare(`SELECT SUM(amount) as total FROM ledger WHERE type = 'debit' AND account_name = 'Cost of Goods Sold'`).get() as any;
      const expensesTotal = db.prepare(`
        SELECT SUM(amount) as total 
        FROM ledger 
        WHERE type = 'debit' AND account_name IN (SELECT name FROM accounts WHERE category = 'expense')
      `).get() as any;

      const revenueValue = revenues?.total || 0;
      const cogsValue = cogs?.total || 0;
      const expenseValue = expensesTotal?.total || 0;
      const grossProfit = revenueValue - cogsValue;
      const netProfit = grossProfit - expenseValue;

      res.json({
        revenue: revenueValue,
        cogs: cogsValue,
        grossProfit,
        expenses: expenseValue,
        netProfit
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- VENDORS ---
  app.get('/api/vendors', authenticateToken, (req, res) => {
    try {
      const vendors = db.prepare('SELECT * FROM vendors ORDER BY name ASC').all();
      res.json(vendors);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/vendors', authenticateToken, checkRole(['admin', 'manager', 'storekeeper']), (req, res) => {
    try {
      const { name, contact_person, email, phone, address, kra_pin } = req.body;
      if (!name) return res.status(400).json({ error: 'Vendor name is required' });
      
      const id = uuidv4();
      db.prepare(`
        INSERT INTO vendors (id, name, contact_person, email, phone, address, kra_pin) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, contact_person, email, phone, address, kra_pin);
      
      res.json({ id, name });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- CUSTOMERS ---
  app.get('/api/customers', authenticateToken, (req, res) => {
    try {
      const customers = db.prepare('SELECT * FROM customers ORDER BY name ASC').all();
      res.json(customers);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/customers', authenticateToken, (req, res) => {
    try {
      const { name, email, phone, address } = req.body;
      if (!name) return res.status(400).json({ error: 'Customer name is required' });
      
      const id = uuidv4();
      db.prepare(`
        INSERT INTO customers (id, name, email, phone, address) 
        VALUES (?, ?, ?, ?, ?)
      `).run(id, name, email, phone, address);
      
      res.json({ id, name });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- SETTINGS ---
  app.get('/api/settings', authenticateToken, (req, res) => {
    try {
      const settings = db.prepare('SELECT * FROM settings').all();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings', authenticateToken, checkRole(['admin']), (req, res) => {
    try {
      const { settings } = req.body; // Array of { category, key, value }
      if (!Array.isArray(settings)) return res.status(400).json({ error: 'Invalid settings format' });

      const upsert = db.prepare(`
        INSERT INTO settings (id, category, key, value, updated_at) 
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `);

      const transaction = db.transaction((items) => {
        for (const item of items) {
          upsert.run(uuidv4(), item.category, item.key, item.value);
        }
      });

      transaction(settings);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.all('/api/*', (req, res) => {
    console.warn(`[SERVER] 404 - ${req.method} ${req.url}`);
    res.status(404).json({ error: `Not found: ${req.method} ${req.url}` });
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('[FATAL ERROR]', err);
    
    // If it's an API route, ensure we return JSON
    if (req.url.startsWith('/api')) {
      return res.status(err.status || 500).json({ 
        error: 'Global Server Error', 
        message: err.message || 'An unexpected error occurred',
        path: req.url
      });
    }
    
    next(err);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => console.log(`[SERVER] Ready at http://localhost:${PORT}`));
}

startServer().catch(err => {
  console.error('[SERVER] Critical Failure:', err);
  process.exit(1);
});
