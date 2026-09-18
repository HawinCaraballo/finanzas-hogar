-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "esPersonal" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Transaction_householdId_esPersonal_date_idx" ON "Transaction"("householdId", "esPersonal", "date");
