import "server-only";
import { prisma } from "@/lib/db";
import { soloFecha } from "@/lib/periodo";
import {
  clavePeriodoOcurrencia,
  ocurrenciasPendientes,
  siguienteOcurrencia,
} from "@/lib/recurrencia";

/**
 * Motor de movimientos recurrentes.
 *
 * Lo llaman dos cosas: el cron diario de Vercel (para todos los hogares) y una
 * puesta al día perezosa cuando alguien abre la app (por si el cron falló).
 * Ejecutarlo dos veces es inofensivo: el índice único
 * (recurringRuleId, periodKey) impide que un mismo periodo se cree dos veces.
 *
 * No usa el guardián de sesión a propósito: el cron corre sin usuario.
 * Por eso nunca recibe datos del cliente, solo un householdId ya verificado.
 */
export async function ejecutarRecurrentes(opciones?: {
  householdId?: string;
  hasta?: Date;
}): Promise<{ creados: number; reglas: number }> {
  const hasta = soloFecha(opciones?.hasta ?? new Date());

  const reglas = await prisma.recurringRule.findMany({
    where: {
      activa: true,
      autoPost: true,
      nextRunDate: { lte: hasta },
      ...(opciones?.householdId ? { householdId: opciones.householdId } : {}),
    },
  });

  let creados = 0;

  for (const regla of reglas) {
    const fechas = ocurrenciasPendientes(
      {
        frequency: regla.frequency,
        dayOfMonth: regla.dayOfMonth,
        startDate: regla.startDate,
        endDate: regla.endDate,
        nextRunDate: regla.nextRunDate,
      },
      hasta,
    );
    if (fechas.length === 0) {
      // La regla venció: se desactiva para que deje de consultarse cada día.
      if (regla.endDate && regla.endDate < hasta) {
        await prisma.recurringRule.update({
          where: { id: regla.id },
          data: { activa: false },
        });
      }
      continue;
    }

    const autorId = await primerAdministrador(regla.householdId);
    if (!autorId) continue;

    const resultado = await prisma.transaction.createMany({
      data: fechas.map((fecha) => ({
        householdId: regla.householdId,
        categoryId: regla.categoryId,
        createdByUserId: autorId,
        // El autor es un administrador porque la columna no admite nulos, pero
        // la cuenta individual se guía por el responsable de la regla.
        paidByUserId: regla.paidByUserId,
        type: regla.type,
        amount: regla.amount,
        date: fecha,
        descripcion: regla.descripcion,
        recurringRuleId: regla.id,
        periodKey: clavePeriodoOcurrencia(regla.frequency, fecha),
      })),
      skipDuplicates: true,
    });
    creados += resultado.count;

    const ultima = fechas[fechas.length - 1];
    await prisma.recurringRule.update({
      where: { id: regla.id },
      data: {
        nextRunDate: siguienteOcurrencia(
          {
            frequency: regla.frequency,
            dayOfMonth: regla.dayOfMonth,
            startDate: regla.startDate,
          },
          ultima,
        ),
      },
    });
  }

  return { creados, reglas: reglas.length };
}

/**
 * Los movimientos generados por el sistema se atribuyen a un administrador del
 * hogar, porque la columna de autor no admite nulos y así queda claro quién
 * puede corregirlos.
 */
async function primerAdministrador(householdId: string): Promise<string | null> {
  const miembro = await prisma.householdMember.findFirst({
    where: { householdId },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    select: { userId: true },
  });
  return miembro?.userId ?? null;
}
