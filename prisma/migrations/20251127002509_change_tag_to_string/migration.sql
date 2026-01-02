-- AlterTable: Change tag column from enum to text
ALTER TABLE "Product" ALTER COLUMN "tag" DROP DEFAULT;
ALTER TABLE "Product" ALTER COLUMN "tag" TYPE TEXT USING "tag"::TEXT;

-- DropEnum: Remove the ProductTag enum
DROP TYPE IF EXISTS "ProductTag";
