-- Atribuye cada movimiento a quien puso o recibió la plata.
--
-- La columna no puede nacer NOT NULL sobre tablas con datos, así que se añade
-- nullable, se rellena y solo entonces se marca obligatoria.

-- ---------------------------------------------------------------------------
-- Transaction
-- ---------------------------------------------------------------------------
ALTER TABLE "Transaction" ADD COLUMN "paidByUserId" TEXT;

-- Lo ya registrado se atribuye a quien lo registró: es la única suposición
-- honesta disponible sobre datos históricos.
UPDATE "Transaction" SET "paidByUserId" = "createdByUserId";

ALTER TABLE "Transaction" ALTER COLUMN "paidByUserId" SET NOT NULL;

-- ---------------------------------------------------------------------------
-- RecurringRule
-- ---------------------------------------------------------------------------
ALTER TABLE "RecurringRule" ADD COLUMN "paidByUserId" TEXT;

-- Una regla no tiene autor, así que se atribuye al primer administrador del
-- hogar, que es justo el criterio que el cron usaba hasta ahora.
UPDATE "RecurringRule" r SET "paidByUserId" = (
  SELECT m."userId"
  FROM "HouseholdMember" m
  WHERE m."householdId" = r."householdId"
  ORDER BY m."role" ASC, m."joinedAt" ASC
  LIMIT 1
);

-- Una regla en un hogar sin miembros no debería existir; si la hubiera, se
-- borra en vez de bloquear la migración.
DELETE FROM "RecurringRule" WHERE "paidByUserId" IS NULL;

ALTER TABLE "RecurringRule" ALTER COLUMN "paidByUserId" SET NOT NULL;

-- ---------------------------------------------------------------------------
-- Índices y claves foráneas
-- ---------------------------------------------------------------------------
CREATE INDEX "Transaction_householdId_paidByUserId_date_idx" ON "Transaction"("householdId", "paidByUserId", "date");

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_paidByUserId_fkey" FOREIGN KEY ("paidByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RecurringRule" ADD CONSTRAINT "RecurringRule_paidByUserId_fkey" FOREIGN KEY ("paidByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
