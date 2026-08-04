ALTER TABLE "User"
  ADD COLUMN "addressLine1" TEXT,
  ADD COLUMN "addressLine2" TEXT,
  ADD COLUMN "landmark" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "state" TEXT,
  ADD COLUMN "country" TEXT,
  ADD COLUMN "pincode" TEXT,
  ADD COLUMN "alternatePhone" TEXT,
  ADD COLUMN "profileCompleted" BOOLEAN NOT NULL DEFAULT false;
