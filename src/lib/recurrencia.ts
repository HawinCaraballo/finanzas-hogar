import { Frequency } from "@prisma/client";
import { claveDePeriodo, diaSeguro, fechaUTC, periodoDe, soloFecha } from "./periodo";

/**
 * Calculo de ocurrencias de una regla recurrente. Funciones puras: reciben
 * fechas y devuelven fechas, sin tocar la base de datos.
 */

export type ReglaBase = {
  frequency: Frequency;
  dayOfMonth: number;
  startDate: Date;
  endDate?: Date | null;
};

/**
 * Primera ocurrencia en o despues de `desde`.
 * Para MENSUAL/ANUAL el dia se ajusta al ultimo del mes cuando no existe
 * (una regla de "cada 31" cae el 28 en febrero, no se salta el mes).
 */
export function primeraOcurrenciaDesde(regla: ReglaBase, desde: Date): Date {
  const inicio = soloFecha(regla.startDate);
  const piso = desde < inicio ? inicio : soloFecha(desde);

  switch (regla.frequency) {
    case "SEMANAL":
      return avanzarPorDias(inicio, piso, 7);
    case "QUINCENAL":
      return avanzarPorDias(inicio, piso, 14);
    case "ANUAL": {
      const mes = inicio.getUTCMonth() + 1;
      let year = piso.getUTCFullYear();
      let candidata = fechaUTC(year, mes, diaSeguro(year, mes, regla.dayOfMonth));
      if (candidata < piso) {
        year += 1;
        candidata = fechaUTC(year, mes, diaSeguro(year, mes, regla.dayOfMonth));
      }
      return candidata;
    }
    case "MENSUAL":
    default: {
      let { year, month } = periodoDe(piso);
      let candidata = fechaUTC(year, month, diaSeguro(year, month, regla.dayOfMonth));
      if (candidata < piso) {
        if (month === 12) { year += 1; month = 1; } else { month += 1; }
        candidata = fechaUTC(year, month, diaSeguro(year, month, regla.dayOfMonth));
      }
      return candidata;
    }
  }
}

function avanzarPorDias(inicio: Date, piso: Date, paso: number): Date {
  if (piso <= inicio) return inicio;
  const dias = Math.floor((piso.getTime() - inicio.getTime()) / 86_400_000);
  const saltos = Math.ceil(dias / paso);
  return new Date(inicio.getTime() + saltos * paso * 86_400_000);
}

/** Siguiente ocurrencia estrictamente posterior a `actual`. */
export function siguienteOcurrencia(regla: ReglaBase, actual: Date): Date {
  const dia = soloFecha(actual);
  return primeraOcurrenciaDesde(regla, new Date(dia.getTime() + 86_400_000));
}

/**
 * Todas las ocurrencias pendientes desde nextRunDate hasta `hasta` inclusive.
 * Sirve tanto para el cron diario como para la puesta al dia perezosa.
 * El tope de 120 evita un bucle infinito si una regla quedo con datos raros.
 */
export function ocurrenciasPendientes(
  regla: ReglaBase & { nextRunDate: Date },
  hasta: Date,
  tope = 120,
): Date[] {
  const limite = soloFecha(hasta);
  const fin = regla.endDate ? soloFecha(regla.endDate) : null;
  const resultado: Date[] = [];

  let cursor = primeraOcurrenciaDesde(regla, regla.nextRunDate);
  while (cursor <= limite && resultado.length < tope) {
    if (fin && cursor > fin) break;
    resultado.push(cursor);
    cursor = siguienteOcurrencia(regla, cursor);
  }
  return resultado;
}

/**
 * Clave de idempotencia de una ocurrencia. Junto con recurringRuleId forma el
 * indice unico que impide que el cron cree el mismo movimiento dos veces.
 * En MENSUAL/ANUAL se usa el periodo (no el dia) para que cambiar el dia de
 * cobro de una regla ya ejecutada no genere un duplicado.
 */
export function clavePeriodoOcurrencia(frequency: Frequency, fecha: Date): string {
  const p = periodoDe(fecha);
  switch (frequency) {
    case "ANUAL":
      return String(p.year);
    case "MENSUAL":
      return claveDePeriodo(p);
    default:
      return fecha.toISOString().slice(0, 10);
  }
}

export const ETIQUETA_FRECUENCIA: Record<Frequency, string> = {
  SEMANAL: "Cada semana",
  QUINCENAL: "Cada 15 días",
  MENSUAL: "Cada mes",
  ANUAL: "Cada año",
};
