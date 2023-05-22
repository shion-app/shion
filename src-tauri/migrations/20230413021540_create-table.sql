CREATE TABLE IF NOT EXISTS plan (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  deleted_at TIMESTAMP DEFAULT 0,
  UNIQUE (name, deleted_at),
  UNIQUE (color, deleted_at)
);

CREATE TABLE IF NOT EXISTS note (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  description TEXT DEFAULT (''),
  deleted_at TIMESTAMP DEFAULT 0,
  plan_id INTEGER NOT NULL,
  label_id INTEGER NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES plan (id),
  FOREIGN KEY (label_id) REFERENCES label (id)
);

CREATE TABLE IF NOT EXISTS label (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  name TEXT NOT NULL UNIQUE,
  deleted_at TIMESTAMP DEFAULT 0,
  plan_id INTEGER NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES plan (id),
  UNIQUE (name, deleted_at)
);

CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  table_name TEXT NOT NULL,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  sync BOOLEAN DEFAULT 0
);

CREATE TRIGGER auto_insert_label
  AFTER INSERT
  ON plan
BEGIN
  INSERT INTO label
    (name, plan_id)
  VALUES (new.name, new.id);
END;

CREATE TRIGGER log_plan_insert
  AFTER INSERT
  ON plan
BEGIN
  INSERT INTO sync_log
    (table_name, type, data)
  VALUES ("plan", "insert", '{"id":' || new.id || ',"name":"' || new.name || '","color":"' || new.color || '","deleted_at":"' || new.deleted_at || '"}');
END;

CREATE TRIGGER log_plan_update
  AFTER UPDATE
  ON plan
BEGIN
  INSERT INTO sync_log
    (table_name, type, data)
  VALUES ("plan", "update", '{"id":' || new.id || ',"name":"' || new.name || '","color":"' || new.color || '","deleted_at":"' || new.deleted_at || '"}');
END;

CREATE TRIGGER log_label_insert
  AFTER INSERT
  ON label
BEGIN
  INSERT INTO sync_log
    (table_name, type, data)
  VALUES ("label", "insert", '{"id":' || new.id || ',"name":"' || new.name || '","plan_id":' || new.plan_id || ',"deleted_at":"' || new.deleted_at || '"}');
END;

CREATE TRIGGER log_label_update
  AFTER UPDATE
  ON label
BEGIN
  INSERT INTO sync_log
    (table_name, type, data)
  VALUES ("label", "update", '{"id":' || new.id || ',"name":"' || new.name || '","plan_id":' || new.plan_id || ',"deleted_at":"' || new.deleted_at || '"}');
END;

CREATE TRIGGER log_note_insert
  AFTER INSERT
  ON note
BEGIN
  INSERT INTO sync_log
    (table_name, type, data)
  VALUES ("note", "insert", '{"id":' || new.id || ',"start_time":"' || new.start_time || '","end_time":"' || new.end_time || '","description":"' || new.description || '","plan_id":' || new.plan_id || '","label_id":' || new.label_id || ',"deleted_at":"' || new.deleted_at || '"}');
END;

CREATE TRIGGER log_note_update
  AFTER UPDATE
  ON note
BEGIN
  INSERT INTO sync_log
    (table_name, type, data)
  VALUES ("note", "update", '{"id":' || new.id || ',"start_time":"' || new.start_time || '","end_time":"' || new.end_time || '","description":"' || new.description || '","plan_id":' || new.plan_id || '","label_id":' || new.label_id || ',"deleted_at":"' || new.deleted_at || '"}');
END;
