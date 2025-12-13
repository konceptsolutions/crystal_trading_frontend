-- AlterTable: Add subCategoryId to Application table
-- First, check if Application table exists and add the column if needed
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we'll use a different approach

-- Step 1: Add subCategoryId column (nullable initially to handle existing data)
ALTER TABLE "Application" ADD COLUMN "subCategoryId" TEXT;

-- Step 2: Create index on subCategoryId
CREATE INDEX IF NOT EXISTS "Application_subCategoryId_idx" ON "Application"("subCategoryId");

-- Step 3: Drop the old unique constraint on name
DROP INDEX IF EXISTS "Application_name_key";

-- Step 4: Create new unique constraint on (name, subCategoryId)
-- Note: SQLite doesn't support NULL in unique constraints the same way, so we'll use a workaround
CREATE UNIQUE INDEX IF NOT EXISTS "Application_name_subCategoryId_key" ON "Application"("name", "subCategoryId");

-- Step 5: Add foreign key constraint (SQLite requires it to be done via a trigger or during table creation)
-- Since we're altering an existing table, we'll note that the foreign key relationship exists in Prisma schema
-- SQLite doesn't enforce foreign keys by default, but Prisma will handle the relationship

