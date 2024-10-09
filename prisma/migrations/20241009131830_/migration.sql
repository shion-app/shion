-- CreateTable
CREATE TABLE "dimension" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "code" TEXT NOT NULL DEFAULT '',
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000))
);

-- CreateTable
CREATE TABLE "dimension_label" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dimension_id" INTEGER NOT NULL,
    "label_id" INTEGER NOT NULL,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    CONSTRAINT "dimension_label_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "label" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "dimension_label_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "dimension" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dimension_program" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dimension_id" INTEGER NOT NULL,
    "program_id" INTEGER NOT NULL,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    CONSTRAINT "dimension_program_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "dimension_program_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "dimension" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "dimension_code_deleted_at_key" ON "dimension"("code", "deleted_at");
