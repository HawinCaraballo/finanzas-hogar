"use server";

import { Prisma } from "@prisma/client";
import { esPersona, filtroPagador, type Alcance } from "@/lib/alcance";
import { requireHogar } from "@/lib/auth/guard";
import { resumenCredito, fechaCuota } from "@/lib/creditos";
import { aNumero, prisma } from "@/lib/db";
import {
  aFechaISO,
  claveDePeriodo,
  mesAnterior,
  nombreMesCorto,
  rangoDelMes,
  soloFecha,
  ultimosMeses,
  type Periodo,
} from "@/lib/periodo";
import { resumenPresupuesto } from "@/lib/presupuesto";
import type {
  GastoPorCategoria,
  MovimientoVista,
  PagoProximo,
  PresupuestoVista,
  PuntoSerie,
  ResumenMes,
} from "@/lib/tipos";

/** Ingresos, egresos y balance del mes, con el mes anterior para comparar. */
export async function resumenDelMes(periodo: Periodo, alcance: Alcance): Promise<ResumenMes> {
  const ctx = await requireHogar();
  const actual = rangoDelMes(periodo);
  const previo = rangoDelMes(mesAnterior(periodo));
  const dePersona = filtroPagador(alcance);

  const [sumasActual, sumasPrevio, cantidad] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["type"],
      where: {
        householdId: ctx.hogar.id,
        ...dePersona,
        date: { gte: actual.desde, lt: actual.hasta },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: {
        householdId: ctx.hogar.id,
        ...dePersona,
        date: { gte: previo.desde, lt: previo.hasta },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: {
        householdId: ctx.hogar.id,
        ...dePersona,
        date: { gte: actual.desde, lt: actual.hasta },
      },
    }),
  ]);

  const leer = (filas: typeof sumasActual, tipo: "INGRESO" | "EGRESO") =>
    aNumero(filas.find((f) => f.type === tipo)?._sum.amount);

  const ingresos = leer(sumasActual, "INGRESO");
  const egresos = leer(sumasActual, "EGRESO");
  const ingresosPrevios = leer(sumasPrevio, "INGRESO");
  const egresosPrevios = leer(sumasPrevio, "EGRESO");

  return {
    ingresos,
    egresos,
    balance: ingresos - egresos,
    ingresosPrevios,
    egresosPrevios,
    balancePrevio: ingresosPrevios - egresosPrevios,
    cantidadMovimientos: cantidad,
  };
}

/**
 * Serie mes a mes para la gráfica de barras. Se agrupa en SQL porque Prisma no
 * sabe agrupar por mes, y traer todos los movimientos del año para sumarlos en
 * Node sería mucho más caro.
 */
export async function serieMensual(
  periodo: Periodo,
  alcance: Alcance,
  meses = 12,
): Promise<PuntoSerie[]> {
  const ctx = await requireHogar();
  const periodos = ultimosMeses(periodo, meses);
  const desde = rangoDelMes(periodos[0]).desde;
  const hasta = rangoDelMes(periodos[periodos.length - 1]).hasta;

  // Un fragmento parametrizado, no texto interpolado: el id sigue viajando
  // como parámetro y no hay forma de inyectar SQL por la URL.
  const soloPersona = esPersona(alcance)
    ? Prisma.sql`AND "paidByUserId" = ${alcance.userId}`
    : Prisma.empty;

  const filas = await prisma.$queryRaw<
    Array<{ periodo: string; type: string; total: number }>
  >`
    SELECT to_char("date", 'YYYY-MM') AS periodo,
           "type"::text AS type,
           SUM("amount")::float8 AS total
    FROM "Transaction"
    WHERE "householdId" = ${ctx.hogar.id}
      AND "date" >= ${desde}
      AND "date" < ${hasta}
      ${soloPersona}
    GROUP BY 1, 2
  `;

  const indice = new Map<string, { ingresos: number; egresos: number }>();
  for (const fila of filas) {
    const actual = indice.get(fila.periodo) ?? { ingresos: 0, egresos: 0 };
    if (fila.type === "INGRESO") actual.ingresos = Number(fila.total);
    else actual.egresos = Number(fila.total);
    indice.set(fila.periodo, actual);
  }

  return periodos.map((p) => {
    const clave = claveDePeriodo(p);
    const valores = indice.get(clave) ?? { ingresos: 0, egresos: 0 };
    return {
      clave,
      etiqueta: nombreMesCorto(p),
      ingresos: valores.ingresos,
      egresos: valores.egresos,
      balance: valores.ingresos - valores.egresos,
    };
  });
}

/** Gastos del mes agrupados por categoría, de mayor a menor. */
export async function gastosPorCategoria(
  periodo: Periodo,
  alcance: Alcance,
): Promise<GastoPorCategoria[]> {
  const ctx = await requireHogar();
  const { desde, hasta } = rangoDelMes(periodo);

  const grupos = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      householdId: ctx.hogar.id,
      ...filtroPagador(alcance),
      type: "EGRESO",
      date: { gte: desde, lt: hasta },
    },
    _sum: { amount: true },
  });
  if (grupos.length === 0) return [];

  const categorias = await prisma.category.findMany({
    where: { id: { in: grupos.map((g) => g.categoryId) } },
    select: { id: true, nombre: true, color: true, icon: true },
  });
  const porId = new Map(categorias.map((c) => [c.id, c]));
  const total = grupos.reduce((acc, g) => acc + aNumero(g._sum.amount), 0);

  return grupos
    .map((g) => {
      const cat = porId.get(g.categoryId);
      const monto = aNumero(g._sum.amount);
      return {
        id: g.categoryId,
        nombre: cat?.nombre ?? "Sin categoría",
        color: cat?.color ?? "#64748b",
        icon: cat?.icon ?? "Tag",
        total: monto,
        porcentaje: total > 0 ? (monto / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

/** Presupuestos del mes con lo gastado hasta ahora en cada categoría. */
export async function presupuestosDelMes(periodo: Periodo): Promise<PresupuestoVista[]> {
  const ctx = await requireHogar();
  const { desde, hasta } = rangoDelMes(periodo);

  const presupuestos = await prisma.budget.findMany({
    where: { householdId: ctx.hogar.id, year: periodo.year, month: periodo.month },
    include: { categoria: { select: { id: true, nombre: true, color: true, icon: true } } },
  });
  if (presupuestos.length === 0) return [];

  const gastos = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      householdId: ctx.hogar.id,
      type: "EGRESO",
      date: { gte: desde, lt: hasta },
      categoryId: { in: presupuestos.map((p) => p.categoryId) },
    },
    _sum: { amount: true },
  });
  const gastadoPor = new Map(gastos.map((g) => [g.categoryId, aNumero(g._sum.amount)]));

  return presupuestos
    .map((p) => ({
      categoryId: p.categoryId,
      nombre: p.categoria.nombre,
      color: p.categoria.color,
      icon: p.categoria.icon,
      ...resumenPresupuesto(gastadoPor.get(p.categoryId) ?? 0, aNumero(p.amount)),
    }))
    .sort((a, b) => b.porcentaje - a.porcentaje);
}

/** Lo que se viene: reglas recurrentes y cuotas de crédito de los próximos días. */
export async function proximosPagos(dias = 15): Promise<PagoProximo[]> {
  const ctx = await requireHogar();
  const hoy = soloFecha(new Date());
  const limite = new Date(hoy.getTime() + dias * 86_400_000);

  const [reglas, creditos] = await Promise.all([
    prisma.recurringRule.findMany({
      where: {
        householdId: ctx.hogar.id,
        activa: true,
        type: "EGRESO",
        nextRunDate: { lte: limite },
      },
      include: {
        categoria: { select: { nombre: true } },
        responsable: { select: { nombre: true } },
      },
      orderBy: { nextRunDate: "asc" },
    }),
    prisma.loan.findMany({
      where: { householdId: ctx.hogar.id, status: "ACTIVO" },
      include: { pagos: { select: { amount: true } } },
    }),
  ]);

  const pagos: PagoProximo[] = reglas.map((r) => ({
    id: `regla-${r.id}`,
    descripcion: r.descripcion,
    detalle: `${r.categoria.nombre} · paga ${r.responsable.nombre}`,
    monto: aNumero(r.amount),
    fecha: aFechaISO(r.nextRunDate),
    origen: "recurrente" as const,
  }));

  for (const credito of creditos) {
    const resumen = resumenCredito(
      {
        principal: aNumero(credito.principal),
        totalInstallments: credito.totalInstallments,
        installmentAmount: aNumero(credito.installmentAmount),
        startDate: credito.startDate,
      },
      credito.pagos.map((p) => aNumero(p.amount)),
    );
    if (resumen.cuotasRestantes <= 0) continue;

    const proxima = fechaCuota(credito.startDate, resumen.cuotasPagadas + 1);
    if (proxima > limite) continue;

    pagos.push({
      id: `credito-${credito.id}`,
      descripcion: credito.nombre,
      detalle: `Cuota ${resumen.cuotasPagadas + 1} de ${credito.totalInstallments}`,
      monto: aNumero(credito.installmentAmount),
      fecha: aFechaISO(proxima),
      origen: "credito",
    });
  }

  return pagos.sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 6);
}

/** Los movimientos más recientes, para el bloque del final del dashboard. */
export async function ultimosMovimientos(
  alcance: Alcance,
  cantidad = 6,
): Promise<MovimientoVista[]> {
  const ctx = await requireHogar();
  const filas = await prisma.transaction.findMany({
    where: { householdId: ctx.hogar.id, ...filtroPagador(alcance) },
    include: {
      categoria: { select: { id: true, nombre: true, icon: true, color: true } },
      autor: { select: { id: true, nombre: true } },
      responsable: { select: { id: true, nombre: true } },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: cantidad,
  });

  return filas.map((t) => ({
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
  }));
}
