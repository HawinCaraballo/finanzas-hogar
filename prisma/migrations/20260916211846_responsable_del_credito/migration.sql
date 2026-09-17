-- Cada crédito pasa a tener un responsable: la persona que paga sus cuotas.
--
-- Igual que en RecurringRule, la columna no puede nacer NOT NULL sobre una
-- tabla con datos, así que se añade nullable, se rellena y solo entonces se
-- marca obligatoria.

ALTER TABLE "Loan" ADD COLUMN "paidByUserId" TEXT;

-- Un crédito no tiene autor, así que se atribuye al primer administrador del
-- hogar. Es el mismo criterio que se usó para las reglas recurrentes.
UPDATE "Loan" l SET "paidByUserId" = (
  SELECT m."userId"
  FROM "HouseholdMember" m
  WHERE m."householdId" = l."householdId"
  ORDER BY m."role" ASC, m."joinedAt" ASC
  LIMIT 1
);

-- Un crédito en un hogar sin miembros no debería existir; si lo hubiera, se
-- borra en vez de bloquear la migración.
DELETE FROM "Loan" WHERE "paidByUserId" IS NULL;

ALTER TABLE "Loan" ALTER COLUMN "paidByUserId" SET NOT NULL;

CREATE INDEX "Loan_householdId_paidByUserId_idx" ON "Loan"("householdId", "paidByUserId");

ALTER TABLE "Loan" ADD CONSTRAINT "Loan_paidByUserId_fkey" FOREIGN KEY ("paidByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
