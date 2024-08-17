-- CreateTable
CREATE TABLE "remark" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "arg" TEXT NOT NULL,
    "time" INTEGER NOT NULL,
    "program_id" INTEGER NOT NULL,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    CONSTRAINT "remark_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
