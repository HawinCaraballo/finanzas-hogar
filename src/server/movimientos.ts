"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { requireHogar } from "@/lib/auth/guard";
import { aNumero, prisma } from "@/lib/db";
import { aFechaISO, parseClavePeriodo, parseFechaISO, rangoDelMes } from "@/lib/periodo";
import type { CategoriaVista, FiltrosMovimientos, MovimientoVista } from "@/lib/tipos";
import { movimientoSchema } from "@/lib/validaciones";
import { comoFallo, exito, fallo, type Resultado } from "./resultado";

const POR_PAGINA = 50;

/** Refresca todo lo que puede cambiar al tocar un movimiento. */
function revalidarTodo() {
  for (const ruta of ["/dashboard", "/movimientos", "/presupuestos", "/creditos"]) {
    revalidatePath(ruta);
  }
}

export async function categoriasDelHogar(soloActivas = true): Promise<CategoriaVista[]> {
  const ctx = await requireHogar();
  const filas = await prisma.category.findMany({
    where: { householdId: ctx.hogar.id, ...(soloActivas ? { archivedAt: null } : {}) },
    orderBy: [{ type: "asc" }, { nombre: "asc" }],
  });
  return filas.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    type: c.type,
    icon: c.icon,
    color: c.color,
    isSystem: c.isSystem,
    archivada: c.archivedAt !== null,
  }));
}

export async function listarMovimientos(filtros: FiltrosMovimientos): Promise<{
  movimientos: MovimientoVista[];
  total: number;
  totalIngresos: number;
  totalEgresos: number;
  hayMas: boolean;
}> {
  const ctx = await requireHogar();
  const pagina = Math.max(1, filtros.pagina ?? 1);
  const where = construirWhere(ctx.hogar.id, filtros);

  const [filas, total, sumas] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        categoria: { select: { id: true, nombre: true, icon: true, color: true } },
        autor: { select: { id: true, nombre: true } },
        responsable: { select: { id: true, nombre: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({ by: ["type"], where, _sum: { amount: true } }),
  ]);

  const suma = (tipo: "INGRESO" | "EGRESO") =>
    aNumero(sumas.find((s) => s.type === tipo)?._sum.amount);

  return {
    movimientos: filas.map(aVista),
    total,
    totalIngresos: suma("INGRESO"),
    totalEgresos: suma("EGRESO"),
    hayMas: pagina * POR_PAGINA < total,
  };
}

function construirWhere(householdId: string, f: FiltrosMovimientos): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = { householdId };

  const periodo = f.periodo ? parseClavePeriodo(f.periodo) : null;
  if (periodo) {
    const { desde, hasta } = rangoDelMes(periodo);
    where.date = { gte: desde, lt: hasta };
  }
  if (f.type && f.type !== "TODOS") where.type = f.type;
  if (f.categoryId) where.categoryId = f.categoryId;
  if (f.paidByUserId) where.paidByUserId = f.paidByUserId;
  if (f.texto?.trim()) {
    const texto = f.texto.trim();
    where.OR = [
      { descripcion: { contains: texto, mode: "insensitive" } },
      { notas: { contains: texto, mode: "insensitive" } },
    ];
  }
  return where;
}

type FilaConRelaciones = Prisma.TransactionGetPayload<{
  include: {
    categoria: { select: { id: true; nombre: true; icon: true; color: true } };
    autor: { select: { id: true; nombre: true } };
    responsable: { select: { id: true; nombre: true } };
  };
}>;

function aVista(t: FilaConRelaciones): MovimientoVista {
  return {
    id: t.id,
    type: t.type,
    amount: aNumero(t.amount),
    fecha: aFechaISO(t.date),
    descripcion: t.descripcion,
    notas: t.notas,
    categoria: t.categoria,
    autor: t.autor,
    responsable: t.responsable,
    loanId: t.loanId,
    esRecurrente: t.recurringRuleId !== null,
  };
}

export async function crearMovimiento(entrada: unknown): Promise<Resultado> {
  try {
    const ctx = await requireHogar();
    const datos = movimientoSchema.parse(entrada);

    if (!(await categoriaValida(ctx.hogar.id, datos.categoryId, datos.type))) {
      return fallo("Esa categoría no existe o no corresponde al tipo elegido.");
    }

    const paidByUserId = await pagadorValido(ctx.hogar.id, datos.paidByUserId, ctx.user.id);
    if (!paidByUserId) return fallo("Esa persona no es miembro de este hogar.");

    await prisma.transaction.create({
      data: {
        householdId: ctx.hogar.id,
        categoryId: datos.categoryId,
        createdByUserId: ctx.user.id,
        paidByUserId,
        type: datos.type,
        amount: datos.amount,
        date: parseFechaISO(datos.date),
        descripcion: datos.descripcion ?? "",
        notas: datos.notas || null,
        loanId: await creditoValido(ctx.hogar.id, datos.loanId),
      },
    });

    revalidarTodo();
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

export async function actualizarMovimiento(entrada: unknown): Promise<Resultado> {
  try {
    const ctx = await requireHogar();
    const datos = movimientoSchema.parse(entrada);
    if (!datos.id) return fallo("Falta el movimiento que se quiere editar.");

    const actual = await prisma.transaction.findFirst({
      where: { id: datos.id, householdId: ctx.hogar.id },
    });
    if (!actual) return fallo("Ese movimiento no existe en este hogar.");
    // Un miembro corrige lo suyo; el administrador corrige cualquier cosa.
    if (!ctx.esAdmin && actual.createdByUserId !== ctx.user.id) {
      return fallo("Solo puedes editar los movimientos que tú registraste.");
    }
    if (!(await categoriaValida(ctx.hogar.id, datos.categoryId, datos.type))) {
      return fallo("Esa categoría no existe o no corresponde al tipo elegido.");
    }

    const paidByUserId = await pagadorValido(ctx.hogar.id, datos.paidByUserId, actual.paidByUserId);
    if (!paidByUserId) return fallo("Esa persona no es miembro de este hogar.");

    await prisma.transaction.update({
      where: { id: datos.id },
      data: {
        categoryId: datos.categoryId,
        paidByUserId,
        type: datos.type,
        amount: datos.amount,
        date: parseFechaISO(datos.date),
        descripcion: datos.descripcion ?? "",
        notas: datos.notas || null,
        loanId: await creditoValido(ctx.hogar.id, datos.loanId),
      },
    });

    revalidarTodo();
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

export async function eliminarMovimiento(id: string): Promise<Resultado> {
  try {
    const ctx = await requireHogar();
    const actual = await prisma.transaction.findFirst({
      where: { id, householdId: ctx.hogar.id },
    });
    if (!actual) return fallo("Ese movimiento no existe en este hogar.");
    if (!ctx.esAdmin && actual.createdByUserId !== ctx.user.id) {
      return fallo("Solo puedes borrar los movimientos que tú registraste.");
    }

    await prisma.transaction.delete({ where: { id } });
    revalidarTodo();
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

async function categoriaValida(householdId: string, categoryId: string, type: string) {
  const categoria = await prisma.category.findFirst({
    where: { id: categoryId, householdId, type: type as "INGRESO" | "EGRESO" },
  });
  return categoria !== null;
}

/**
 * Un movimiento solo puede atribuirse a alguien que viva en el hogar. Sin esta
 * comprobación, un id enviado a mano metería a un extraño en las cuentas.
 * Devuelve null si el id no pertenece al hogar.
 */
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

async function creditoValido(householdId: string, loanId?: string): Promise<string | null> {
  if (!loanId) return null;
  const credito = await prisma.loan.findFirst({ where: { id: loanId, householdId } });
  return credito?.id ?? null;
}
