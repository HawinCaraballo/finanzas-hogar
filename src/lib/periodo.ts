/**
 * Manejo de periodos mensuales y fechas.
 *
 * Las fechas de los movimientos se guardan como DATE en Postgres, asi que aqui
 * se trabaja SIEMPRE en UTC. Mezclar la zona horaria local haria que un gasto
 * del 1 de septiembre cayera en agosto para quien este en UTC-5.
 */

export type Periodo = { year: number; month: number }; // month: 1..12

export function fechaUTC(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/** Normaliza cualquier Date a medianoche UTC del mismo dia calendario UTC. */
export function soloFecha(fecha: Date): Date {
  return fechaUTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, fecha.getUTCDate());
}

/** "2026-09-11" -> Date UTC. Lanza si el formato no es ISO corto. */
export function parseFechaISO(texto: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!m) throw new Error(`Fecha invalida: ${texto}`);
  return fechaUTC(Number(m[1]), Number(m[2]), Number(m[3]));
}

/** Date UTC -> "2026-09-11" (el formato que espera <input type="date">). */
export function aFechaISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export function periodoDe(fecha: Date): Periodo {
  return { year: fecha.getUTCFullYear(), month: fecha.getUTCMonth() + 1 };
}

export function periodoActual(hoy: Date = new Date()): Periodo {
  return periodoDe(hoy);
}

/** Clave estable de un mes: "2026-09". */
export function claveDePeriodo(p: Periodo): string {
  return `${p.year}-${String(p.month).padStart(2, "0")}`;
}

export function parseClavePeriodo(clave: string): Periodo | null {
  const m = /^(\d{4})-(\d{2})$/.exec(clave);
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year: Number(m[1]), month };
}

/** Rango del mes: desde inclusive, hasta exclusivo (primer dia del mes siguiente). */
export function rangoDelMes(p: Periodo): { desde: Date; hasta: Date } {
  return {
    desde: fechaUTC(p.year, p.month, 1),
    hasta: fechaUTC(p.year + (p.month === 12 ? 1 : 0), p.month === 12 ? 1 : p.month + 1, 1),
  };
}

export function sumarMeses(p: Periodo, cantidad: number): Periodo {
  const total = p.year * 12 + (p.month - 1) + cantidad;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

export const mesAnterior = (p: Periodo) => sumarMeses(p, -1);
export const mesSiguiente = (p: Periodo) => sumarMeses(p, 1);

/** Los ultimos `cantidad` meses terminando en `p`, del mas viejo al mas nuevo. */
export function ultimosMeses(p: Periodo, cantidad: number): Periodo[] {
  return Array.from({ length: cantidad }, (_, i) => sumarMeses(p, i - (cantidad - 1)));
}

export function diasEnMes(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Ajusta el dia al ultimo del mes cuando no existe (31 de febrero -> 28/29). */
export function diaSeguro(year: number, month: number, dia: number): number {
  return Math.min(Math.max(dia, 1), diasEnMes(year, month));
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "septiembre 2026" */
export function nombrePeriodo(p: Periodo): string {
  return `${MESES[p.month - 1]} ${p.year}`;
}

/** "sep" — para ejes de graficas. */
export function nombreMesCorto(p: Periodo): string {
  return MESES[p.month - 1].slice(0, 3);
}

export function mismoPeriodo(a: Periodo, b: Periodo): boolean {
  return a.year === b.year && a.month === b.month;
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/**
 * Encabezado de un grupo de movimientos: "Hoy", "Ayer" o "jueves, 11 de septiembre".
 * Recibe la fecha en ISO corto para no depender de la zona horaria del navegador.
 */
export function fechaLegible(iso: string, hoy: Date = new Date()): string {
  const fecha = parseFechaISO(iso);
  const referencia = soloFecha(hoy);
  const dias = Math.round((referencia.getTime() - fecha.getTime()) / 86_400_000);

  if (dias === 0) return "Hoy";
  if (dias === 1) return "Ayer";

  const nombreDia = DIAS[fecha.getUTCDay()];
  const dia = fecha.getUTCDate();
  const mes = MESES[fecha.getUTCMonth()];
  const anio = fecha.getUTCFullYear();
  const mismoAnio = anio === referencia.getUTCFullYear();

  return mismoAnio
    ? `${nombreDia}, ${dia} de ${mes}`
    : `${dia} de ${mes} de ${anio}`;
}

/** "11 sep" — para listas compactas. */
export function fechaCorta(iso: string): string {
  const fecha = parseFechaISO(iso);
  return `${fecha.getUTCDate()} ${MESES[fecha.getUTCMonth()].slice(0, 3)}`;
}
