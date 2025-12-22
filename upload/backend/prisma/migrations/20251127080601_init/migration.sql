-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partNo" TEXT NOT NULL,
    "masterPartNo" TEXT,
    "brand" TEXT,
    "description" TEXT,
    "mainCategory" TEXT,
    "subCategory" TEXT,
    "application" TEXT,
    "hsCode" TEXT,
    "uom" TEXT,
    "weight" REAL,
    "reOrderLevel" INTEGER NOT NULL DEFAULT 0,
    "cost" REAL,
    "priceA" REAL,
    "priceB" REAL,
    "priceM" REAL,
    "rackNo" TEXT,
    "origin" TEXT,
    "grade" TEXT,
    "status" TEXT NOT NULL DEFAULT 'A',
    "smc" TEXT,
    "size" TEXT,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PartModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partId" TEXT NOT NULL,
    "modelNo" TEXT NOT NULL,
    "qtyUsed" INTEGER NOT NULL,
    "tab" TEXT NOT NULL DEFAULT 'P1',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PartModel_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Stock_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Part_partNo_key" ON "Part"("partNo");

-- CreateIndex
CREATE INDEX "PartModel_partId_idx" ON "PartModel"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_partId_key" ON "Stock"("partId");
