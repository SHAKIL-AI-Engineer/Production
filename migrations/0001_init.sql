-- Migration 0001: Initial schema
-- Compatible with SQLite and PostgreSQL

CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role       TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_productions (
    id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id          TEXT NOT NULL,
    production_date  DATE NOT NULL,
    items_produced   INTEGER NOT NULL DEFAULT 0,
    units            TEXT NOT NULL DEFAULT 'pcs',
    notes            TEXT,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS daily_expenses (
    id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id        TEXT NOT NULL,
    expense_date   DATE NOT NULL,
    category       TEXT NOT NULL,
    amount         REAL NOT NULL DEFAULT 0,
    description    TEXT,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for common report queries
CREATE INDEX IF NOT EXISTS idx_daily_productions_user_date ON daily_productions(user_id, production_date);
CREATE INDEX IF NOT EXISTS idx_daily_expenses_user_date ON daily_expenses(user_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
