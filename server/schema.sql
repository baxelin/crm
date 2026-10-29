CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'cliente', 'inativo')),
  origin TEXT,
  first_contact_date TEXT,
  last_contact_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('site', 'manutencao_site', 'marketing', 'social_media', 'outro')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'encerrado')),
  started_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('unico', 'parcela', 'mensalidade')),
  amount REAL NOT NULL,
  due_date TEXT,
  paid_date TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado')),
  proof_file_path TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  period TEXT NOT NULL DEFAULT 'dia_inteiro' CHECK (period IN ('manha', 'tarde', 'dia_inteiro')),
  start_time TEXT,
  end_time TEXT,
  title TEXT NOT NULL,
  notes TEXT,
  done INTEGER NOT NULL DEFAULT 0,
  recurrence_group_id TEXT,
  recurrence_unit TEXT CHECK (recurrence_unit IN ('diario', 'semanal', 'quinzenal', 'mensal')),
  recurrence_interval INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_interactions_contact ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_services_contact ON services(contact_id);
CREATE INDEX IF NOT EXISTS idx_payments_contact ON payments(contact_id);
CREATE INDEX IF NOT EXISTS idx_payments_service ON payments(service_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contact ON tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_group ON tasks(recurrence_group_id);
