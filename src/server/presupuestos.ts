"use server";

import { revalidatePath } from "next/cache";
import { SOLO_DEL_HOGAR } from "@/lib/alcance";
import { requireHogar } from "@/lib/auth/guard";
import { aNumero, prisma } from "@/lib/db";
import { mesAnterior, rangoDelMes, type Periodo } from "@/lib/periodo";
import { resumenPresupuesto } from "@/lib/presupuesto";
import type { PresupuestoVista } from "@/lib/tipos";
import { presupuestoSchema } from "@/lib/validaciones";
import { comoFallo, exito, fallo, type Resultado } from "./resultado";

function revalidar() {
  revalidatePath("/presupuestos");
  revalidatePath("/dashboard");
}

/**
 * Todas las categorías de gasto del mes, tengan tope o no. La pantalla de
 * presupuestos las muestra juntas para poder fijar un tope sin buscar nada.
 */
export async function presupuestosEditables(periodo: Periodo): Promise<PresupuestoVista[]> {
  const ctx = await requireHogar();
  const { desde, hasta } = rangoDelMes(periodo);

  const [categorias, topes, gastos] = await Promise.all([
    prisma.category.findMany({
      where: { householdId: ctx.hogar.id, type: "EGRESO", archivedAt: null },
      orderBy: { nombre: "asc" },
    }),
    prisma.budget.findMany({
      where: { householdId: ctx.hogar.id, year: periodo.year, month: periodo.month },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        householdId: ctx.hogar.id,
        // Un tope es del hogar: un gasto personal no lo consume.
        ...SOLO_DEL_HOGAR,
        type: "EGRESO",
        date: { gte: desde, lt: hasta },
      },
      _sum: { amount: true },
    }),
  ]);

  const topePor = new Map(topes.map((t) => [t.categoryId, aNumero(t.amount)]));
  const gastadoPor = new Map(gastos.map((g) => [g.categoryId, aNumero(g._sum.amount)]));

  return categorias.map((c) => ({
    categoryId: c.id,
    nombre: c.nombre,
    color: c.color,
    icon: c.icon,
    ...resumenPresupuesto(gastadoPor.get(c.id) ?? 0, topePor.get(c.id) ?? 0),
  }));
}

/** Un tope en cero equivale a "sin presupuesto": se borra la fila. */
export async function guardarPresupuesto(entrada: unknown): Promise<Resultado> {
  try {
    const ctx = await requireHogar();
    const datos = presupuestoSchema.parse(entrada);

    const categoria = await prisma.category.findFirst({
      where: { id: datos.categoryId, householdId: ctx.hogar.id, type: "EGRESO" },
    });
    if (!categoria) return fallo("Esa categoría de gasto no existe en este hogar.");

    if (datos.amount <= 0) {
      await prisma.budget.deleteMany({
        where: {
          householdId: ctx.hogar.id,
          categoryId: datos.categoryId,
          year: datos.year,
          month: datos.month,
        },
      });
    } else {
      await prisma.budget.upsert({
        where: {
          householdId_categoryId_year_month: {
            householdId: ctx.hogar.id,
            categoryId: datos.categoryId,
            year: datos.year,
            month: datos.month,
          },
        },
        update: { amount: datos.amount },
        create: {
          householdId: ctx.hogar.id,
          categoryId: datos.categoryId,
          year: datos.year,
          month: datos.month,
          amount: datos.amount,
        },
      });
    }

    revalidar();
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

/** Atajo para no volver a teclear los mismos topes cada mes. */
export async function copiarDelMesAnterior(periodo: Periodo): Promise<Resultado<{ copiados: number }>> {
  try {
    const ctx = await requireHogar();
    const previo = mesAnterior(periodo);

    const anteriores = await prisma.budget.findMany({
      where: { householdId: ctx.hogar.id, year: previo.year, month: previo.month },
    });
    if (anteriores.length === 0) {
      return fallo("El mes anterior no tiene presupuestos que copiar.");
    }

    // createMany con skipDuplicates respeta los topes que ya se fijaron a mano.
    const { count } = await prisma.budget.createMany({
      data: anteriores.map((b) => ({
        householdId: ctx.hogar.id,
        categoryId: b.categoryId,
        year: periodo.year,
        month: periodo.month,
        amount: b.amount,
      })),
      skipDuplicates: true,
    });

    revalidar();
    return exito({ copiados: count });
  } catch (e) {
    return comoFallo(e);
  }
}

/**
 * Quita el tope de una categoría. Guardar un monto de cero produce el mismo
 * efecto, pero eso es un detalle de implementación: borrar merece una acción
 * con nombre propio, y así la interfaz puede ofrecer un botón claro.
 */
export async function eliminarPresupuesto(
  categoryId: string,
  periodo: Periodo,
): Promise<Resultado> {
  try {
    const ctx = await requireHogar();
    const { count } = await prisma.budget.deleteMany({
      where: {
        householdId: ctx.hogar.id,
        categoryId,
        year: periodo.year,
        month: periodo.month,
      },
    });
    if (count === 0) return fallo("Ese presupuesto ya no existe.");
    revalidar();
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

export async function borrarPresupuestosDelMes(periodo: Periodo): Promise<Resultado> {
  try {
    const ctx = await requireHogar();
    await prisma.budget.deleteMany({
      where: { householdId: ctx.hogar.id, year: periodo.year, month: periodo.month },
    });
    revalidar();
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}
