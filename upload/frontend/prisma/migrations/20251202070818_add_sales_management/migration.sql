-- CreateTable
CREATE TABLE "SalesInquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inquiryNo" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "customerAddress" TEXT,
    "inquiryDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'new',
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "followUpDate" DATETIME,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SalesQuotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotationNo" TEXT NOT NULL,
    "inquiryId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "customerAddress" TEXT,
    "quotationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subTotal" REAL NOT NULL DEFAULT 0,
    "tax" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SalesQuotationItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salesQuotationId" TEXT NOT NULL,
    "partId" TEXT,
    "partNo" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "uom" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesQuotationItem_salesQuotationId_fkey" FOREIGN KEY ("salesQuotationId") REFERENCES "SalesQuotation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalesQuotationItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryChallan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challanNo" TEXT NOT NULL,
    "invoiceId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "customerAddress" TEXT,
    "deliveryDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryAddress" TEXT,
    "vehicleNo" TEXT,
    "driverName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeliveryChallan_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SalesInvoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeliveryChallanItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deliveryChallanId" TEXT NOT NULL,
    "partId" TEXT,
    "partNo" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "uom" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeliveryChallanItem_deliveryChallanId_fkey" FOREIGN KEY ("deliveryChallanId") REFERENCES "DeliveryChallan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeliveryChallanItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesReturn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "returnNo" TEXT NOT NULL,
    "invoiceId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "returnDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "refundAmount" REAL NOT NULL DEFAULT 0,
    "reason" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesReturn_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SalesInvoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesReturnItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salesReturnId" TEXT NOT NULL,
    "partId" TEXT,
    "partNo" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "returnReason" TEXT NOT NULL,
    "uom" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesReturnItem_salesReturnId_fkey" FOREIGN KEY ("salesReturnId") REFERENCES "SalesReturn" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalesReturnItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SalesInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNo" TEXT NOT NULL,
    "quotationId" TEXT,
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
    CONSTRAINT "SalesInvoice_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "SalesQuotation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SalesInvoice" ("balanceAmount", "createdAt", "createdBy", "customerAddress", "customerEmail", "customerName", "customerPhone", "discount", "dueDate", "id", "invoiceDate", "invoiceNo", "notes", "paidAmount", "quotationId", "status", "subTotal", "tax", "totalAmount", "updatedAt") SELECT "balanceAmount", "createdAt", "createdBy", "customerAddress", "customerEmail", "customerName", "customerPhone", "discount", "dueDate", "id", "invoiceDate", "invoiceNo", "notes", "paidAmount", "quotationId", "status", "subTotal", "tax", "totalAmount", "updatedAt" FROM "SalesInvoice";
DROP TABLE "SalesInvoice";
ALTER TABLE "new_SalesInvoice" RENAME TO "SalesInvoice";
CREATE UNIQUE INDEX "SalesInvoice_invoiceNo_key" ON "SalesInvoice"("invoiceNo");
CREATE INDEX "SalesInvoice_invoiceNo_idx" ON "SalesInvoice"("invoiceNo");
CREATE INDEX "SalesInvoice_status_idx" ON "SalesInvoice"("status");
CREATE INDEX "SalesInvoice_invoiceDate_idx" ON "SalesInvoice"("invoiceDate");
CREATE INDEX "SalesInvoice_customerName_idx" ON "SalesInvoice"("customerName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SalesInquiry_inquiryNo_key" ON "SalesInquiry"("inquiryNo");

-- CreateIndex
CREATE INDEX "SalesInquiry_inquiryNo_idx" ON "SalesInquiry"("inquiryNo");

-- CreateIndex
CREATE INDEX "SalesInquiry_status_idx" ON "SalesInquiry"("status");

-- CreateIndex
CREATE INDEX "SalesInquiry_inquiryDate_idx" ON "SalesInquiry"("inquiryDate");

-- CreateIndex
CREATE INDEX "SalesInquiry_customerName_idx" ON "SalesInquiry"("customerName");

-- CreateIndex
CREATE UNIQUE INDEX "SalesQuotation_quotationNo_key" ON "SalesQuotation"("quotationNo");

-- CreateIndex
CREATE INDEX "SalesQuotation_quotationNo_idx" ON "SalesQuotation"("quotationNo");

-- CreateIndex
CREATE INDEX "SalesQuotation_status_idx" ON "SalesQuotation"("status");

-- CreateIndex
CREATE INDEX "SalesQuotation_quotationDate_idx" ON "SalesQuotation"("quotationDate");

-- CreateIndex
CREATE INDEX "SalesQuotation_customerName_idx" ON "SalesQuotation"("customerName");

-- CreateIndex
CREATE INDEX "SalesQuotationItem_salesQuotationId_idx" ON "SalesQuotationItem"("salesQuotationId");

-- CreateIndex
CREATE INDEX "SalesQuotationItem_partId_idx" ON "SalesQuotationItem"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryChallan_challanNo_key" ON "DeliveryChallan"("challanNo");

-- CreateIndex
CREATE INDEX "DeliveryChallan_challanNo_idx" ON "DeliveryChallan"("challanNo");

-- CreateIndex
CREATE INDEX "DeliveryChallan_status_idx" ON "DeliveryChallan"("status");

-- CreateIndex
CREATE INDEX "DeliveryChallan_deliveryDate_idx" ON "DeliveryChallan"("deliveryDate");

-- CreateIndex
CREATE INDEX "DeliveryChallan_customerName_idx" ON "DeliveryChallan"("customerName");

-- CreateIndex
CREATE INDEX "DeliveryChallanItem_deliveryChallanId_idx" ON "DeliveryChallanItem"("deliveryChallanId");

-- CreateIndex
CREATE INDEX "DeliveryChallanItem_partId_idx" ON "DeliveryChallanItem"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesReturn_returnNo_key" ON "SalesReturn"("returnNo");

-- CreateIndex
CREATE INDEX "SalesReturn_returnNo_idx" ON "SalesReturn"("returnNo");

-- CreateIndex
CREATE INDEX "SalesReturn_status_idx" ON "SalesReturn"("status");

-- CreateIndex
CREATE INDEX "SalesReturn_returnDate_idx" ON "SalesReturn"("returnDate");

-- CreateIndex
CREATE INDEX "SalesReturn_customerName_idx" ON "SalesReturn"("customerName");

-- CreateIndex
CREATE INDEX "SalesReturnItem_salesReturnId_idx" ON "SalesReturnItem"("salesReturnId");

-- CreateIndex
CREATE INDEX "SalesReturnItem_partId_idx" ON "SalesReturnItem"("partId");
