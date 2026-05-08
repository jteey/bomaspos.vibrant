export type UserRole = 'admin' | 'manager' | 'cashier' | 'accountant' | 'storekeeper' | 'auditor';

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
}

export interface Product {
  id: string;
  category_id: string;
  category_name?: string;
  name: string;
  sku: string;
  barcode: string;
  description: string;
  price: number;
  cost_price: number;
  tax_rate: number;
  stock_quantity: number;
  min_stock_level: number;
  expiry_date?: string;
  unit: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface SaleItem {
  product_id: string;
  name: string;
  product_name?: string;
  quantity: number;
  price: number;
  tax_rate: number;
  total?: number;
}

export interface Sale {
  id: string;
  cashier_id: string;
  cashier_name?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_method: 'cash' | 'mpesa' | 'card' | 'split';
  mpesa_transaction_id?: string;
  status: string;
  created_at: string;
}

export interface DetailedSale extends Sale {
  items: SaleItem[];
}

export interface Account {
  id: string;
  code: string;
  name: string;
  category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  normal_balance: 'debit' | 'credit';
  description: string;
  created_at: string;
}

export interface SaleResult {
  sale_id: string;
  cuin: string;
  qrCodeData: string;
  total_amount: number;
}
