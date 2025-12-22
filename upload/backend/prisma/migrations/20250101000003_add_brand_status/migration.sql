-- AlterTable
ALTER TABLE "Brand" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'A';

-- CreateIndex
CREATE INDEX "Brand_status_idx" ON "Brand"("status");
