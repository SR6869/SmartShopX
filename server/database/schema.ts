export const SCHEMA_SQL = `
-- SmartShopX Authoritative PostgreSQL Schema
-- Enforces multi-tenancy, atomic financial integrity, Bangla UTF-8, and strict decimal precision

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  mobile VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'owner',
  account_type VARCHAR(50) DEFAULT 'business',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS businesses (
  id VARCHAR(64) PRIMARY KEY,
  account_id VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  store_slug VARCHAR(100) UNIQUE,
  category VARCHAR(100) NOT NULL,
  business_type VARCHAR(100),
  business_model VARCHAR(100),
  template VARCHAR(100),
  subscription_plan VARCHAR(50) DEFAULT 'Standard',
  subscription_status VARCHAR(50) DEFAULT 'Active',
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  feature_overrides JSONB DEFAULT '{}'::jsonb,
  modules JSONB DEFAULT '{}'::jsonb,
  address TEXT,
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_memberships (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE RESTRICT,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  role VARCHAR(50) NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  brand VARCHAR(100),
  sku VARCHAR(100),
  barcode VARCHAR(100),
  purchase_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  selling_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  wholesale_price NUMERIC(15,2) DEFAULT 0.00,
  stock NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  min_stock_alert NUMERIC(15,2) DEFAULT 5.00,
  unit VARCHAR(50) DEFAULT 'pcs',
  vat_percent NUMERIC(5,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  online_store_visible BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE RESTRICT,
  movement_type VARCHAR(50) NOT NULL,
  quantity NUMERIC(15,2) NOT NULL,
  stock_before NUMERIC(15,2) NOT NULL,
  stock_after NUMERIC(15,2) NOT NULL,
  reason TEXT,
  reference_id VARCHAR(100),
  created_by VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(50),
  address TEXT,
  email VARCHAR(255),
  total_spent NUMERIC(15,2) DEFAULT 0.00,
  total_orders INTEGER DEFAULT 0,
  total_due NUMERIC(15,2) DEFAULT 0.00,
  credit_limit NUMERIC(15,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  mobile VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  total_payable NUMERIC(15,2) DEFAULT 0.00,
  total_paid NUMERIC(15,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  order_number VARCHAR(100) NOT NULL,
  customer_id VARCHAR(64) REFERENCES customers(id) ON DELETE RESTRICT,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  delivery_charge NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  vat NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  due_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
  order_status VARCHAR(50) NOT NULL DEFAULT 'completed',
  channel VARCHAR(50) DEFAULT 'pos',
  notes TEXT,
  created_by VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  quantity NUMERIC(15,2) NOT NULL,
  purchase_price NUMERIC(15,2) NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  total_price NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  transaction_number VARCHAR(100),
  payment_type VARCHAR(50) NOT NULL,
  method VARCHAR(50) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  customer_id VARCHAR(64),
  supplier_id VARCHAR(64),
  order_id VARCHAR(64),
  status VARCHAR(50) DEFAULT 'Completed',
  reference_note TEXT,
  created_by VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) REFERENCES businesses(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'cash',
  date DATE NOT NULL,
  note TEXT,
  created_by VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personal_transactions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE RESTRICT,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'cash',
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personal_dues (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE RESTRICT,
  person_name VARCHAR(255) NOT NULL,
  mobile VARCHAR(50),
  type VARCHAR(50) NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  due_date DATE,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  business_id VARCHAR(64),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(100),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Product Studio tables
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  store_id VARCHAR(64) NOT NULL,
  subscription_plan VARCHAR(50) DEFAULT 'FREE',
  operation VARCHAR(50) NOT NULL,
  credits_consumed INT DEFAULT 1,
  request_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'success',
  provider VARCHAR(100) DEFAULT 'gemini',
  model VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_video_jobs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  store_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64),
  product_name VARCHAR(255),
  source_image_url TEXT,
  provider VARCHAR(100) DEFAULT 'demo-showcase',
  model VARCHAR(100),
  status VARCHAR(50) DEFAULT 'queued',
  progress INT DEFAULT 0,
  result_url TEXT,
  preview_poster TEXT,
  error_code VARCHAR(100),
  error_message TEXT,
  credits_reserved INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for performance and multi-tenant scoping
CREATE INDEX IF NOT EXISTS idx_businesses_store_slug ON businesses(store_slug);
CREATE INDEX IF NOT EXISTS idx_business_memberships_user_business ON business_memberships(user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_stock_movements_business_product ON stock_movements(business_id, product_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
CREATE INDEX IF NOT EXISTS idx_suppliers_business_id ON suppliers(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_business_id ON orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_personal_transactions_user_id ON personal_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_dues_user_id ON personal_dues(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_id ON audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_store_created ON ai_usage_logs(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_video_jobs_store_status ON ai_video_jobs(store_id, status);
`;
