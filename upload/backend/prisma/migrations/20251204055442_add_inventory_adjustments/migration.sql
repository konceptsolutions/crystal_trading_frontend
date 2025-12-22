-- CreateTable
CREATE TABLE "InventoryAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adjustmentNo" TEXT,
    "total" REAL NOT NULL DEFAULT 0,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InventoryAdjustmentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adjustmentId" TEXT NOT NULL,
    "partId" TEXT,
    "partNo" TEXT NOT NULL,
    "description" TEXT,
    "previousQuantity" INTEGER NOT NULL DEFAULT 0,
    "adjustedQuantity" INTEGER NOT NULL,
    "newQuantity" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryAdjustmentItem_adjustmentId_fkey" FOREIGN KEY ("adjustmentId") REFERENCES "InventoryAdjustment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryAdjustmentItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SalesInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNo" TEXT NOT NULL,
    "quotationId" TEXT,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "customerAddress" TEXT,
    "invoiceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subTotal" REAL NOT NULL DEFAULT 0,
    "tax" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "balanceAmount" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SalesInvoice" ("balanceAmount", "createdAt", "createdBy", "customerAddress", "customerEmail", "customerName", "customerPhone", "discount", "dueDate", "id", "invoiceDate", "invoiceNo", "notes", "paidAmount", "quotationId", "status", "subTotal", "tax", "totalAmount", "updatedAt") SELECT "balanceAmount", "createdAt", "createdBy", "customerAddress", "customerEmail", "customerName", "customerPhone", "discount", "dueDate", "id", "invoiceDate", "invoiceNo", "notes", "paidAmount", "quotationId", "status", "subTotal", "tax", "totalAmount", "updatedAt" FROM "SalesInvoice";
DROP TABLE "SalesInvoice";
ALTER TABLE "new_SalesInvoice" RENAME TO "SalesInvoice";
CREATE UNIQUE INDEX "SalesInvoice_invoiceNo_key" ON "SalesInvoice"("invoiceNo");
CREATE INDEX "SalesInvoice_invoiceNo_idx" ON "SalesInvoice"("invoiceNo");
CREATE INDEX "SalesInvoice_status_idx" ON "SalesInvoice"("status");
CREATE INDEX "SalesInvoice_invoiceDate_idx" ON "SalesInvoice"("invoiceDate");
CREATE INDEX "SalesInvoice_customerName_idx" ON "SalesInvoice"("customerName");
CREATE INDEX "SalesInvoice_customerId_idx" ON "SalesInvoice"("customerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "InventoryAdjustment_date_idx" ON "InventoryAdjustment"("date");

-- CreateIndex
CREATE INDEX "InventoryAdjustment_adjustmentNo_idx" ON "InventoryAdjustment"("adjustmentNo");

-- CreateIndex
CREATE INDEX "InventoryAdjustmentItem_adjustmentId_idx" ON "InventoryAdjustmentItem"("adjustmentId");

-- CreateIndex
CREATE INDEX "InventoryAdjustmentItem_partId_idx" ON "InventoryAdjustmentItem"("partId");
