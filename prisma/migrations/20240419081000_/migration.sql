-- CreateTable
CREATE TABLE "domain" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000))
);

-- CreateTable
CREATE TABLE "history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "last_visited" INTEGER NOT NULL,
    "domain_id" INTEGER NOT NULL,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    "created_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    "updated_at" INTEGER NOT NULL DEFAULT (ROUND((julianday('now') - 2440587.5) * 86400000)),
    CONSTRAINT "history_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domain" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
