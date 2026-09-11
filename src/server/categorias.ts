"use server";

import { revalidatePath } from "next/cache";
import { requireHogar } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { categoriaSchema } from "@/lib/validaciones";
import { comoFallo, exito, fallo, type Resultado } from "./resultado";

function revalidar() {
  for (const ruta of ["/categorias", "/movimientos", "/dashboard", "/presupuestos"]) {
    revalidatePath(ruta);
  }
}

export async function guardarCategoria(entrada: unknown): Promise<Resultado> {
  try {
    const ctx = await requireHogar();
    const datos = categoriaSchema.parse(entrada);

    if (datos.id) {
      const existe = await prisma.category.findFirst({
        where: { id: datos.id, householdId: ctx.hogar.id },
      });
      if (!existe) return fallo("Esa categoría no existe en este hogar.");
      // Cambiar el tipo dejaría movimientos clasificados al revés.
      if (existe.type !== datos.type) {
        const usos = await prisma.transaction.count({ where: { categoryId: datos.id } });
        if (usos > 0) {
          return fallo(
            "Esta categoría ya tiene movimientos, así que no se puede cambiar de ingreso a gasto. Crea una nueva.",
          );
        }
      }
      await prisma.category.update({
        where: { id: datos.id },
        data: {
          nombre: datos.nombre,
          type: datos.type,
          icon: datos.icon,
          color: datos.color,
        },
      });
    } else {
      await prisma.category.create({
        data: {
          householdId: ctx.hogar.id,
          nombre: datos.nombre,
          type: datos.type,
          icon: datos.icon,
          color: datos.color,
        },
      });
    }

    revalidar();
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

/**
 * Archivar en vez de borrar: la categoría desaparece de los formularios pero
 * los movimientos históricos conservan su clasificación.
 */
export async function archivarCategoria(id: string, archivar: boolean): Promise<Resultado> {
  try {
    const ctx = await requireHogar();
    const { count } = await prisma.category.updateMany({
      where: { id, householdId: ctx.hogar.id },
      data: { archivedAt: archivar ? new Date() : null },
    });
    if (count === 0) return fallo("Esa categoría no existe en este hogar.");
    revalidar();
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

/** Solo se puede borrar de verdad una categoría que nunca se usó. */
export async function eliminarCategoria(id: string): Promise<Resultado> {
  try {
    const ctx = await requireHogar();
    const categoria = await prisma.category.findFirst({
      where: { id, householdId: ctx.hogar.id },
    });
    if (!categoria) return fallo("Esa categoría no existe en este hogar.");

    const [movimientos, presupuestos, recurrentes, creditos] = await Promise.all([
      prisma.transaction.count({ where: { categoryId: id } }),
      prisma.budget.count({ where: { categoryId: id } }),
      prisma.recurringRule.count({ where: { categoryId: id } }),
      prisma.loan.count({ where: { categoryId: id } }),
    ]);

    if (movimientos + presupuestos + recurrentes + creditos > 0) {
      return fallo(
        "Esta categoría está en uso. Archívala para que deje de aparecer sin perder el historial.",
      );
    }

    await prisma.category.delete({ where: { id } });
    revalidar();
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

/** Cuántos movimientos tiene cada categoría, para mostrarlo en la lista. */
export async function usoDeCategorias(): Promise<Record<string, number>> {
  const ctx = await requireHogar();
  const grupos = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { householdId: ctx.hogar.id },
    _count: { _all: true },
  });
  return Object.fromEntries(grupos.map((g) => [g.categoryId, g._count._all]));
}
