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
INSERT INTO "new_program" ("color", "deleted_at", "icon", "id", "name", "path", "sort") SELECT "color", "deleted_at", "icon", "id", "name", "path", "sort" FROM "program";
DROP TABLE "program";
ALTER TABLE "new_program" RENAME TO "program";
CREATE UNIQUE INDEX "program_name_deleted_at_key" ON "program"("name", "deleted_at");
CREATE UNIQUE INDEX "program_color_deleted_at_key" ON "program"("color", "deleted_at");
CREATE UNIQUE INDEX "program_path_deleted_at_key" ON "program"("path", "deleted_at");
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
INSERT INTO "new_activity" ("deleted_at", "end", "id", "program_id", "start") SELECT "deleted_at", "end", "id", "program_id", "start" FROM "activity";
DROP TABLE "activity";
ALTER TABLE "new_activity" RENAME TO "activity";
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
INSERT INTO "new_label" ("color", "deleted_at", "id", "name", "plan_id", "sort") SELECT "color", "deleted_at", "id", "name", "plan_id", "sort" FROM "label";
DROP TABLE "label";
ALTER TABLE "new_label" RENAME TO "label";
CREATE UNIQUE INDEX "label_name_deleted_at_key" ON "label"("name", "deleted_at");
CREATE UNIQUE INDEX "label_color_deleted_at_key" ON "label"("color", "deleted_at");
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
INSERT INTO "new_note" ("deleted_at", "end", "id", "label_id", "plan_id", "start") SELECT "deleted_at", "end", "id", "label_id", "plan_id", "start" FROM "note";
DROP TABLE "note";
ALTER TABLE "new_note" RENAME TO "note";
CREATE TABLE "new_moment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "time" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000))
);
INSERT INTO "new_moment" ("content", "deleted_at", "id", "time", "title") SELECT "content", "deleted_at", "id", "time", "title" FROM "moment";
DROP TABLE "moment";
ALTER TABLE "new_moment" RENAME TO "moment";
CREATE UNIQUE INDEX "moment_title_deleted_at_key" ON "moment"("title", "deleted_at");
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
INSERT INTO "new_overview" ("data", "deleted_at", "h", "id", "type", "w", "x", "y") SELECT "data", "deleted_at", "h", "id", "type", "w", "x", "y" FROM "overview";
DROP TABLE "overview";
ALTER TABLE "new_overview" RENAME TO "overview";
CREATE TABLE "new_plan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000))
);
INSERT INTO "new_plan" ("color", "deleted_at", "id", "name", "sort") SELECT "color", "deleted_at", "id", "name", "sort" FROM "plan";
DROP TABLE "plan";
ALTER TABLE "new_plan" RENAME TO "plan";
CREATE UNIQUE INDEX "plan_name_deleted_at_key" ON "plan"("name", "deleted_at");
CREATE UNIQUE INDEX "plan_color_deleted_at_key" ON "plan"("color", "deleted_at");
PRAGMA foreign_key_check;
COMMIT TRANSACTION;
PRAGMA foreign_keys=ON;
BEGIN TRANSACTION;
