-- RedefineTables
COMMIT TRANSACTION;
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE "new_label" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "plan_id" INTEGER NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    CONSTRAINT "label_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_label" ("color", "created_at", "deleted_at", "id", "name", "plan_id", "sort", "updated_at") SELECT "color", "created_at", "deleted_at", "id", "name", "plan_id", "sort", "updated_at" FROM "label";
DROP TABLE "label";
ALTER TABLE "new_label" RENAME TO "label";
CREATE UNIQUE INDEX "label_name_deleted_at_key" ON "label"("name", "deleted_at");
CREATE TABLE "new_plan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000))
);
INSERT INTO "new_plan" ("color", "created_at", "deleted_at", "id", "name", "sort", "updated_at") SELECT "color", "created_at", "deleted_at", "id", "name", "sort", "updated_at" FROM "plan";
DROP TABLE "plan";
ALTER TABLE "new_plan" RENAME TO "plan";
CREATE UNIQUE INDEX "plan_name_deleted_at_key" ON "plan"("name", "deleted_at");
CREATE TABLE "new_program" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000))
);
INSERT INTO "new_program" ("color", "created_at", "deleted_at", "icon", "id", "name", "path", "platform", "sort", "updated_at") SELECT "color", "created_at", "deleted_at", "icon", "id", "name", "path", "platform", "sort", "updated_at" FROM "program";
DROP TABLE "program";
ALTER TABLE "new_program" RENAME TO "program";
CREATE UNIQUE INDEX "program_path_deleted_at_key" ON "program"("path", "deleted_at");
PRAGMA foreign_key_check;
COMMIT TRANSACTION;
PRAGMA foreign_keys=ON;
BEGIN TRANSACTION;
