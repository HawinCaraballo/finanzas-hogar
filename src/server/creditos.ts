"use server";

import { revalidatePath } from "next/cache";
import { requireHogar } from "@/lib/auth/guard";
import { fechaCuota, resumenCredito } from "@/lib/creditos";
import { aNumero, prisma } from "@/lib/db";
import { aFechaISO, parseFechaISO } from "@/lib/periodo";
import type { CreditoConResumen, CreditoVista, MovimientoVista } from "@/lib/tipos";
import { creditoSchema, pagoCuotaSchema } from "@/lib/validaciones";
import { comoFallo, exito, fallo, type Resultado } from "./resultado";

function revalidar() {
  for (const ruta of ["/creditos", "/dashboard", "/movimientos"]) revalidatePath(ruta);
}

function aVista(c: {
  id: string;
  nombre: string;
  kind: CreditoVista["kind"];
  principal: unknown;
  interestRate: unknown;
  totalInstallments: number;
  installmentAmount: unknown;
  startDate: Date;
  categoryId: string;
  status: string;
  responsable: { id: string; nombre: string };
}): CreditoVista {
  return {
    id: c.id,
    nombre: c.nombre,
    kind: c.kind,
    principal: aNumero(c.principal as never),
    interestRate: aNumero(c.interestRate as never),
    totalInstallments: c.totalInstallments,
    installmentAmount: aNumero(c.installmentAmount as never),
    fechaInicio: aFechaISO(c.startDate),
    categoryId: c.categoryId,
    activo: c.status === "ACTIVO",
    responsable: c.responsable,
  };
}

/** Solo los activos: es lo que ofrece el formulario de movimientos. */
export async function creditosActivos(): Promise<CreditoVista[]> {
  const ctx = await requireHogar();
  const filas = await prisma.loan.findMany({
    where: { householdId: ctx.hogar.id, status: "ACTIVO" },
    include: { responsable: { select: { id: true, nombre: true } } },
    orderBy: { nombre: "asc" },
  });
  return filas.map(aVista);
}

export async function listarCreditos(): Promise<CreditoConResumen[]> {
  const ctx = await requireHogar();
  const filas = await prisma.loan.findMany({
    where: { householdId: ctx.hogar.id },
    include: {
      pagos: { select: { amount: true } },
      responsable: { select: { id: true, nombre: true } },
    },
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
  });

  return filas.map((c) => {
    const vista = aVista(c);
    const resumen = resumenCredito(
      {
        principal: vista.principal,
        totalInstallments: vista.totalInstallments,
        installmentAmount: vista.installmentAmount,
        startDate: c.startDate,
      },
      c.pagos.map((p) => aNumero(p.amount)),
    );
    return {
      ...vista,
      resumen: {
        ...resumen,
        fechaEstimadaFin: aFechaISO(resumen.fechaEstimadaFin),
        proximaCuota:
          resumen.cuotasRestantes > 0
            ? aFechaISO(fechaCuota(c.startDate, resumen.cuotasPagadas + 1))
            : null,
      },
    };
  });
}

export async function creditoConPagos(id: string): Promise<{
  credito: CreditoConResumen;
  pagos: MovimientoVista[];
} | null> {
  const ctx = await requireHogar();
  const fila = await prisma.loan.findFirst({
    where: { id, householdId: ctx.hogar.id },
    include: {
      responsable: { select: { id: true, nombre: true } },
      pagos: {
        include: {
          categoria: { select: { id: true, nombre: true, icon: true, color: true } },
          autor: { select: { id: true, nombre: true } },
          responsable: { select: { id: true, nombre: true } },
        },
        orderBy: { date: "desc" },
      },
    },
  });
  if (!fila) return null;

  const vista = aVista(fila);
  const resumen = resumenCredito(
    {
      principal: vista.principal,
      totalInstallments: vista.totalInstallments,
      installmentAmount: vista.installmentAmount,
      startDate: fila.startDate,
    },
    fila.pagos.map((p) => aNumero(p.amount)),
  );

  return {
    credito: {
      ...vista,
      resumen: {
        ...resumen,
        fechaEstimadaFin: aFechaISO(resumen.fechaEstimadaFin),
        proximaCuota:
          resumen.cuotasRestantes > 0
            ? aFechaISO(fechaCuota(fila.startDate, resumen.cuotasPagadas + 1))
            : null,
      },
    },
    pagos: fila.pagos.map((p) => ({
      id: p.id,
      type: p.type,
      amount: aNumero(p.amount),
      fecha: aFechaISO(p.date),
      descripcion: p.descripcion,
      notas: p.notas,
      categoria: p.categoria,
      autor: p.autor,
      responsable: p.responsable,
      loanId: p.loanId,
      esRecurrente: p.recurringRuleId !== null,
      esPersonal: p.esPersonal,
    })),
  };
}

export async function guardarCredito(entrada: unknown): Promise<Resultado> {
  try {
    const ctx = await requireHogar();
    const datos = creditoSchema.parse(entrada);

    const categoria = await prisma.category.findFirst({
      where: { id: datos.categoryId, householdId: ctx.hogar.id, type: "EGRESO" },
    });
    if (!categoria) return fallo("Elige una categoría de gasto para las cuotas.");

    const paidByUserId = await miembroValido(ctx.hogar.id, datos.paidByUserId, ctx.user.id);
    if (!paidByUserId) return fallo("Esa persona no es miembro de este hogar.");

    const comunes = {
      paidByUserId,
      nombre: datos.nombre,
      kind: datos.kind,
      categoryId: datos.categoryId,
      principal: datos.principal,
      interestRate: datos.interestRate,
      totalInstallments: datos.totalInstallments,
      installmentAmount: datos.installmentAmount,
      startDate: parseFechaISO(datos.startDate),
    };

    if (datos.id) {
      const existe = await prisma.loan.findFirst({
        where: { id: datos.id, householdId: ctx.hogar.id },
      });
      if (!existe) return fallo("Ese crédito no existe en este hogar.");
      await prisma.loan.update({ where: { id: datos.id }, data: comunes });
    } else {
      await prisma.loan.create({ data: { ...comunes, householdId: ctx.hogar.id } });
    }

    revalidar();
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

/**
 * Registra el pago de una cuota. Crea un movimiento normal ligado al crédito,
 * para que el gasto aparezca en el dashboard como cualquier otro.
 */
export async function pagarCuota(entrada: unknown): Promise<Resultado> {
  try {
    const ctx = await requireHogar();
    const datos = pagoCuotaSchema.parse(entrada);

    const credito = await prisma.loan.findFirst({
      where: { id: datos.loanId, householdId: ctx.hogar.id },
      include: { pagos: { select: { amount: true } } },
    });
    if (!credito) return fallo("Ese crédito no existe en este hogar.");

    const pagosPrevios = credito.pagos.map((p) => aNumero(p.amount));
    const resumen = resumenCredito(
      {
        principal: aNumero(credito.principal),
        totalInstallments: credito.totalInstallments,
        installmentAmount: aNumero(credito.installmentAmount),
        startDate: credito.startDate,
      },
      pagosPrevios,
    );
    const numeroCuota = Math.min(resumen.cuotasPagadas + 1, credito.totalInstallments);

    // La cuota la puede estar registrando alguien distinto de quien la pagó.
    // Por defecto se atribuye a quien responde por el crédito, no a quien la
    // registra: en la práctica siempre la paga la misma persona.
    const paidByUserId = await miembroValido(
      ctx.hogar.id,
      datos.paidByUserId,
      credito.paidByUserId,
    );
    if (!paidByUserId) return fallo("Esa persona no es miembro de este hogar.");

    await prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          householdId: ctx.hogar.id,
          categoryId: credito.categoryId,
          createdByUserId: ctx.user.id,
          paidByUserId,
          type: "EGRESO",
          amount: datos.amount,
          date: parseFechaISO(datos.date),
          descripcion: `${credito.nombre} - cuota ${numeroCuota} de ${credito.totalInstallments}`,
          notas: datos.notas || null,
          loanId: credito.id,
        },
      });

      // Al cubrir el total el crédito se marca pagado y deja de pedir cuotas.
      const total = resumen.totalPagado + datos.amount;
      if (total >= resumen.totalAPagar && credito.status === "ACTIVO") {
        await tx.loan.update({ where: { id: credito.id }, data: { status: "PAGADO" } });
      }
    });

    revalidar();
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

/** Un crédito o una cuota solo pueden atribuirse a alguien que viva en el hogar. */
async function miembroValido(
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

export async function eliminarCredito(id: string): Promise<Resultado> {
  try {
    const ctx = await requireHogar();
    const credito = await prisma.loan.findFirst({
      where: { id, householdId: ctx.hogar.id },
    });
    if (!credito) return fallo("Ese crédito no existe en este hogar.");

    // Los pagos ya registrados no se borran: siguen siendo gastos reales del
    // hogar. Solo pierden el vínculo con el crédito (onDelete: SetNull).
    await prisma.loan.delete({ where: { id } });
    revalidar();
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

export async function reabrirCredito(id: string, activo: boolean): Promise<Resultado> {
  try {
    const ctx = await requireHogar();
    const { count } = await prisma.loan.updateMany({
      where: { id, householdId: ctx.hogar.id },
      data: { status: activo ? "ACTIVO" : "PAGADO" },
    });
    if (count === 0) return fallo("Ese crédito no existe en este hogar.");
    revalidar();
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}
