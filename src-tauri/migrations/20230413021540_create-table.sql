CREATE TABLE IF NOT EXISTS plan (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  deleted_at TIMESTAMP DEFAULT 0,
  UNIQUE (name, deleted_at),
  UNIQUE (color, deleted_at)
);

CREATE TABLE IF NOT EXISTS label (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  plan_id INTEGER NOT NULL,
  deleted_at TIMESTAMP DEFAULT 0,
  FOREIGN KEY (plan_id) REFERENCES plan (id),
  UNIQUE (name, deleted_at),
  UNIQUE (color, deleted_at)
);

CREATE TABLE IF NOT EXISTS note (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  description TEXT DEFAULT (''),
  plan_id INTEGER NOT NULL,
  label_id INTEGER NOT NULL,
  deleted_at TIMESTAMP DEFAULT 0,
  FOREIGN KEY (plan_id) REFERENCES plan (id),
  FOREIGN KEY (label_id) REFERENCES label (id)
);

CREATE TABLE IF NOT EXISTS program (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  path TEXT NOT NULL,
  description TEXT NOT NULL,
  icon BLOB NOT NULL,
  color TEXT NOT NULL,
  deleted_at TIMESTAMP DEFAULT 0,
  UNIQUE (path, deleted_at),
  UNIQUE (description, deleted_at)
);

CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  program_id INTEGER NOT NULL,
  deleted_at TIMESTAMP DEFAULT 0,
  FOREIGN KEY (program_id) REFERENCES program (id)
);
