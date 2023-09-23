-- CreateTable
CREATE TABLE "plan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    "deleted_at" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "label" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "label_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "record" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "start" INTEGER NOT NULL,
    "end" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "label_id" INTEGER NOT NULL,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "record_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "record_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "label" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "program" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    "deleted_at" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "activity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "start" INTEGER NOT NULL,
    "end" INTEGER NOT NULL,
    "program_id" INTEGER NOT NULL,
    "deleted_at" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "activity_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_name_deleted_at_key" ON "plan"("name", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "plan_color_deleted_at_key" ON "plan"("color", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "label_name_deleted_at_key" ON "label"("name", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "label_color_deleted_at_key" ON "label"("color", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "program_name_deleted_at_key" ON "program"("name", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "program_color_deleted_at_key" ON "program"("color", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "program_path_deleted_at_key" ON "program"("path", "deleted_at");
