"use server";

import { revalidatePath } from "next/cache";
import { requireHogar } from "@/lib/auth/guard";
import { aNumero, prisma } from "@/lib/db";
import { ejecutarRecurrentes } from "@/lib/motor-recurrentes";
import { aFechaISO, parseFechaISO, soloFecha } from "@/lib/periodo";
import {
  clavePeriodoOcurrencia,
  primeraOcurrenciaDesde,
  siguienteOcurrencia,
} from "@/lib/recurrencia";
import type { RecurrenteVista } from "@/lib/tipos";
import { recurrenteSchema } from "@/lib/validaciones";
import { comoFallo, exito, fallo, type Resultado } from "./resultado";

function revalidar() {
  for (const ruta of ["/recurrentes", "/dashboard", "/movimientos"]) revalidatePath(ruta);
}

export async function listarRecurrentes(): Promise<RecurrenteVista[]> {
  const ctx = await requireHogar();

  // Puesta al día perezosa: si el cron no corrió, al abrir la pantalla se
  // generan los movimientos atrasados de este hogar.
  await ejecutarRecurrentes({ householdId: ctx.hogar.id });

  const filas = await prisma.recurringRule.findMany({
    where: { householdId: ctx.hogar.id },
    include: {
      categoria: { select: { id: true, nombre: true, icon: true, color: true } },
      responsable: { select: { id: true, nombre: true } },
    },
    orderBy: [{ activa: "desc" }, { nextRunDate: "asc" }],
  });

  return filas.map((r) => ({
    id: r.id,
    type: r.type,
    amount: aNumero(r.amount),
    descripcion: r.descripcion,
    frequency: r.frequency,
    dayOfMonth: r.dayOfMonth,
    fechaInicio: aFechaISO(r.startDate),
    fechaFin: r.endDate ? aFechaISO(r.endDate) : null,
    proximaFecha: aFechaISO(r.nextRunDate),
    autoPost: r.autoPost,
    activa: r.activa,
    categoria: r.categoria,
    responsable: r.responsable,
  }));
}

export async function guardarRecurrente(entrada: unknown): Promise<Resultado> {
  try {
    const ctx = await requireHogar();
    const datos = recurrenteSchema.parse(entrada);

    const categoria = await prisma.category.findFirst({
      where: { id: datos.categoryId, householdId: ctx.hogar.id, type: datos.type },
    });
    if (!categoria) return fallo("Esa categoría no existe o no corresponde al tipo elegido.");

    const startDate = parseFechaISO(datos.startDate);
    const endDate = datos.endDate ? parseFechaISO(datos.endDate) : null;
    if (endDate && endDate < startDate) {
      return fallo("La fecha de fin no puede ser anterior a la de inicio.");
    }

    const paidByUserId = await pagadorValido(ctx.hogar.id, datos.paidByUserId, ctx.user.id);
    if (!paidByUserId) return fallo("Esa persona no es miembro de este hogar.");

    const comunes = {
      categoryId: datos.categoryId,
      paidByUserId,
      type: datos.type,
      amount: datos.amount,
      descripcion: datos.descripcion,
      frequency: datos.frequency,
      dayOfMonth: datos.dayOfMonth,
      startDate,
      endDate,
      autoPost: datos.autoPost,
    };

    if (datos.id) {
      const existe = await prisma.recurringRule.findFirst({
        where: { id: datos.id, householdId: ctx.hogar.id },
      });
      if (!existe) return fallo("Esa regla no existe en este hogar.");
      await prisma.recurringRule.update({ where: { id: datos.id }, data: comunes });
    } else {
      await prisma.recurringRule.create({
        data: {
          ...comunes,
          householdId: ctx.hogar.id,
          // La primera ejecución nunca es anterior al inicio de la regla.
          nextRunDate: primeraOcurrenciaDesde(
            { frequency: datos.frequency, dayOfMonth: datos.dayOfMonth, startDate },
            startDate,
          ),
        },
      });
    }

    revalidar();
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

/** El pagador de una regla tiene que vivir en el hogar. Devuelve null si no. */
async function pagadorValido(
  householdId: string,
  candidato: string | undefined,
  porDefecto: string,
): Promise<string | null> {
  if (!candidato || candidato === porDefecto) return porDefecto;
  const membresia = await prisma.householdMember.findUnique({
    where: { userId_householdId: { userId: candidato, householdId } },
    select: { userId: true },
  });
  return membresia?.userId ?? null;
}

export async function alternarRecurrente(id: string, activa: boolean): Promise<Resultado> {
  try {
    const ctx = await requireHogar();
    const { count } = await prisma.recurringRule.updateMany({
      where: { id, householdId: ctx.hogar.id },
      data: { activa },
    });
    if (count === 0) return fallo("Esa regla no existe en este hogar.");
    revalidar();
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

export async function eliminarRecurrente(id: string): Promise<Resultado> {
  try {
    const ctx = await requireHogar();
    const { count } = await prisma.recurringRule.deleteMany({
      where: { id, householdId: ctx.hogar.id },
    });
    if (count === 0) return fallo("Esa regla no existe en este hogar.");
    // Los movimientos ya generados se quedan: fueron gastos reales.
    revalidar();
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

/**
 * Para las reglas que solo recuerdan (autoPost desactivado): crea el movimiento
 * de la ocurrencia pendiente y adelanta la regla a la siguiente.
 */
export async function registrarAhora(id: string): Promise<Resultado> {
  try {
    const ctx = await requireHogar();
    const regla = await prisma.recurringRule.findFirst({
      where: { id, householdId: ctx.hogar.id },
    });
    if (!regla) return fallo("Esa regla no existe en este hogar.");

    const fecha = soloFecha(regla.nextRunDate);

    await prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          householdId: ctx.hogar.id,
          categoryId: regla.categoryId,
          createdByUserId: ctx.user.id,
          // Lo registra quien pulsa el botón, pero la plata la pone quien diga
          // la regla.
          paidByUserId: regla.paidByUserId,
          type: regla.type,
          amount: regla.amount,
          date: fecha,
          descripcion: regla.descripcion,
          recurringRuleId: regla.id,
          periodKey: clavePeriodoOcurrencia(regla.frequency, fecha),
        },
      });
      await tx.recurringRule.update({
        where: { id: regla.id },
        data: {
          nextRunDate: siguienteOcurrencia(
            {
              frequency: regla.frequency,
              dayOfMonth: regla.dayOfMonth,
              startDate: regla.startDate,
            },
            fecha,
          ),
        },
      });
    });

    revalidar();
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}
