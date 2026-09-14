"use server";

import { requireHogar } from "@/lib/auth/guard";
import { aNumero, prisma } from "@/lib/db";
import {
  claveDePeriodo,
  nombreMesCorto,
  rangoDelMes,
  ultimosMeses,
  type Periodo,
} from "@/lib/periodo";
import { ordenarPorAporte, participacion, totalesDeHogar } from "@/lib/reparto";
import type {
  FilaComparativa,
  MiembroVista,
  PuntoSerieMiembros,
  TotalesHogarVista,
} from "@/lib/tipos";

/**
 * Comparativa del mes: qué puso y qué pagó cada miembro, y cuánto pesa dentro
 * del hogar. Incluye a quien no registró nada, en ceros — que alguien no
 * aparezca en la tabla sería más confuso que verlo en cero.
 */
export async function comparativaMiembros(periodo: Periodo): Promise<{
  filas: FilaComparativa[];
  totales: TotalesHogarVista;
  miembros: MiembroVista[];
}> {
  const ctx = await requireHogar();
  const { desde, hasta } = rangoDelMes(periodo);

  const [membresias, grupos] = await Promise.all([
    prisma.householdMember.findMany({
      where: { householdId: ctx.hogar.id },
      select: { user: { select: { id: true, nombre: true } } },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    }),
    prisma.transaction.groupBy({
      by: ["paidByUserId", "type"],
      where: { householdId: ctx.hogar.id, date: { gte: desde, lt: hasta } },
      _sum: { amount: true },
    }),
  ]);

  const miembros = membresias.map((m) => m.user);

  const montoDe = (userId: string, tipo: "INGRESO" | "EGRESO") =>
    aNumero(
      grupos.find((g) => g.paidByUserId === userId && g.type === tipo)?._sum.amount,
    );

  const base = miembros.map((m) => {
    const ingresos = montoDe(m.id, "INGRESO");
    const egresos = montoDe(m.id, "EGRESO");
    return { userId: m.id, nombre: m.nombre, ingresos, egresos, balance: ingresos - egresos };
  });

  const totales = totalesDeHogar(base);

  const filas: FilaComparativa[] = ordenarPorAporte(base).map((f) => ({
    ...f,
    participacionIngresos: participacion(f.ingresos, totales.ingresos),
    participacionEgresos: participacion(f.egresos, totales.egresos),
  }));

  return { filas, totales, miembros };
}

/**
 * Serie de los últimos meses desglosada por miembro, para la gráfica apilada.
 * Se agrupa en SQL por la misma razón que `serieMensual`: Prisma no sabe
 * agrupar por mes y traerse el año entero para sumarlo en Node sería más caro.
 */
export async function serieMensualPorMiembro(
  periodo: Periodo,
  meses = 12,
): Promise<PuntoSerieMiembros[]> {
  const ctx = await requireHogar();
  const periodos = ultimosMeses(periodo, meses);
  const desde = rangoDelMes(periodos[0]).desde;
  const hasta = rangoDelMes(periodos[periodos.length - 1]).hasta;

  const filas = await prisma.$queryRaw<
    Array<{ periodo: string; usuario: string; type: string; total: number }>
  >`
    SELECT to_char("date", 'YYYY-MM') AS periodo,
           "paidByUserId" AS usuario,
           "type"::text AS type,
           SUM("amount")::float8 AS total
    FROM "Transaction"
    WHERE "householdId" = ${ctx.hogar.id}
      AND "date" >= ${desde}
      AND "date" < ${hasta}
    GROUP BY 1, 2, 3
  `;

  const indice = new Map<string, { ingresos: Record<string, number>; egresos: Record<string, number> }>();
  for (const fila of filas) {
    const punto = indice.get(fila.periodo) ?? { ingresos: {}, egresos: {} };
    const destino = fila.type === "INGRESO" ? punto.ingresos : punto.egresos;
    destino[fila.usuario] = Number(fila.total);
    indice.set(fila.periodo, punto);
  }

  return periodos.map((p) => {
    const clave = claveDePeriodo(p);
    const punto = indice.get(clave) ?? { ingresos: {}, egresos: {} };
    return {
      clave,
      etiqueta: nombreMesCorto(p),
      ingresos: punto.ingresos,
      egresos: punto.egresos,
    };
  });
}
