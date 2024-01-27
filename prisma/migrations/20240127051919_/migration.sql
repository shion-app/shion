-- RedefineTables
COMMIT TRANSACTION;
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE "new_program" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000))
);
INSERT INTO "new_program" ("color", "created_at", "deleted_at", "icon", "id", "name", "path", "sort", "updated_at") SELECT "color", "created_at", "deleted_at", "icon", "id", "name", "path", "sort", "updated_at" FROM "program";
DROP TABLE "program";
ALTER TABLE "new_program" RENAME TO "program";
CREATE UNIQUE INDEX "program_name_deleted_at_key" ON "program"("name", "deleted_at");
CREATE UNIQUE INDEX "program_path_deleted_at_key" ON "program"("path", "deleted_at");
CREATE TABLE "new_note" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "start" INTEGER NOT NULL,
    "end" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "label_id" INTEGER NOT NULL,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    CONSTRAINT "note_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "note_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "label" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_note" ("created_at", "deleted_at", "end", "id", "label_id", "plan_id", "start", "updated_at") SELECT "created_at", "deleted_at", "end", "id", "label_id", "plan_id", "start", "updated_at" FROM "note";
DROP TABLE "note";
ALTER TABLE "new_note" RENAME TO "note";
CREATE TABLE "new_overview" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" INTEGER NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "w" INTEGER NOT NULL,
    "h" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000))
);
INSERT INTO "new_overview" ("created_at", "data", "deleted_at", "h", "id", "type", "updated_at", "w", "x", "y") SELECT "created_at", "data", "deleted_at", "h", "id", "type", "updated_at", "w", "x", "y" FROM "overview";
DROP TABLE "overview";
ALTER TABLE "new_overview" RENAME TO "overview";
CREATE TABLE "new_box" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000))
);
INSERT INTO "new_box" ("color", "created_at", "deleted_at", "id", "name", "sort", "updated_at") SELECT "color", "created_at", "deleted_at", "id", "name", "sort", "updated_at" FROM "box";
DROP TABLE "box";
ALTER TABLE "new_box" RENAME TO "box";
CREATE UNIQUE INDEX "box_name_deleted_at_key" ON "box"("name", "deleted_at");
CREATE TABLE "new_label" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "plan_id" INTEGER NOT NULL,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    CONSTRAINT "label_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_label" ("color", "created_at", "deleted_at", "id", "name", "plan_id", "sort", "updated_at") SELECT "color", "created_at", "deleted_at", "id", "name", "plan_id", "sort", "updated_at" FROM "label";
DROP TABLE "label";
ALTER TABLE "new_label" RENAME TO "label";
CREATE UNIQUE INDEX "label_name_deleted_at_key" ON "label"("name", "deleted_at");
CREATE TABLE "new_link" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000))
);
INSERT INTO "new_link" ("created_at", "deleted_at", "id", "updated_at") SELECT "created_at", "deleted_at", "id", "updated_at" FROM "link";
DROP TABLE "link";
ALTER TABLE "new_link" RENAME TO "link";
CREATE TABLE "new_moment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "box_id" INTEGER NOT NULL,
    "link_id" INTEGER,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    CONSTRAINT "moment_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "box" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "moment_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "link" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_moment" ("box_id", "content", "created_at", "deleted_at", "id", "link_id", "title", "updated_at") SELECT "box_id", "content", "created_at", "deleted_at", "id", "link_id", "title", "updated_at" FROM "moment";
DROP TABLE "moment";
ALTER TABLE "new_moment" RENAME TO "moment";
CREATE UNIQUE INDEX "moment_title_deleted_at_key" ON "moment"("title", "deleted_at");
CREATE TABLE "new_plan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000))
);
INSERT INTO "new_plan" ("color", "created_at", "deleted_at", "id", "name", "sort", "updated_at") SELECT "color", "created_at", "deleted_at", "id", "name", "sort", "updated_at" FROM "plan";
DROP TABLE "plan";
ALTER TABLE "new_plan" RENAME TO "plan";
CREATE UNIQUE INDEX "plan_name_deleted_at_key" ON "plan"("name", "deleted_at");
CREATE TABLE "new_activity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "start" INTEGER NOT NULL,
    "end" INTEGER NOT NULL,
    "program_id" INTEGER NOT NULL,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    CONSTRAINT "activity_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_activity" ("created_at", "deleted_at", "end", "id", "program_id", "start", "updated_at") SELECT "created_at", "deleted_at", "end", "id", "program_id", "start", "updated_at" FROM "activity";
DROP TABLE "activity";
ALTER TABLE "new_activity" RENAME TO "activity";
PRAGMA foreign_key_check;
COMMIT TRANSACTION;
PRAGMA foreign_keys=ON;
BEGIN TRANSACTION;
