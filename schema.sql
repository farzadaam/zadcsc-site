-- Zad CSC — database schema (Cloudflare D1: zadcsc-db)
-- The existing "tires" table is kept as is.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  pass_hash TEXT,
  pass_salt TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  vin TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  plate TEXT,
  mileage INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_vehicles_user ON vehicles(user_id);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  vehicle_id INTEGER,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  mileage INTEGER,
  details TEXT,
  price REAL,
  next_due_date TEXT,
  next_due_km INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_services_user ON services(user_id);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT,
  phone TEXT,
  items TEXT NOT NULL,
  total REAL,
  status TEXT NOT NULL DEFAULT 'new',
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle TEXT,
  service TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);

CREATE TABLE IF NOT EXISTS fitments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year_from INTEGER NOT NULL,
  year_to INTEGER NOT NULL,
  engine TEXT,
  oil_grade TEXT,
  oil_capacity_l REAL,
  tire_sizes TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_fitments_mm ON fitments(make, model);

-- 2026-11-20: SKU column on the existing tires table, and a small key/value table
-- ALTER TABLE tires ADD COLUMN sku TEXT;   (already applied)
CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT, at TEXT DEFAULT (datetime('now')));

CREATE TABLE IF NOT EXISTS insta (id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));
