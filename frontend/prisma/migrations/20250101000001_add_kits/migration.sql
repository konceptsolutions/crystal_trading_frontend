-- CreateTable
CREATE TABLE "Kit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kitNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalCost" REAL NOT NULL DEFAULT 0,
    "price" REAL,
    "status" TEXT NOT NULL DEFAULT 'A',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "KitItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kitId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KitItem_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KitItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Kit_kitNo_key" ON "Kit"("kitNo");

-- CreateIndex
CREATE INDEX "Kit_kitNo_idx" ON "Kit"("kitNo");

-- CreateIndex
CREATE INDEX "KitItem_kitId_idx" ON "KitItem"("kitId");

-- CreateIndex
CREATE INDEX "KitItem_partId_idx" ON "KitItem"("partId");

