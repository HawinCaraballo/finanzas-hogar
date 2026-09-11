import { fechaUTC, diaSeguro, periodoDe, sumarMeses } from "./periodo";

/**
 * Cálculos de un crédito. El saldo nunca se guarda: se deriva de los pagos
 * registrados, así no hay forma de que quede desincronizado con los movimientos.
 */

export type DatosCredito = {
  principal: number;
  totalInstallments: number;
  installmentAmount: number;
  startDate: Date;
};

export type ResumenCredito = {
  totalAPagar: number;
  totalPagado: number;
  saldoPendiente: number;
  cuotasPagadas: number;
  cuotasRestantes: number;
  /** 0..100 */
  progreso: number;
  fechaEstimadaFin: Date;
  /** Costo del crédito: lo que se paga de más sobre el capital. */
  interesesTotales: number;
};

export function resumenCredito(credito: DatosCredito, pagos: number[]): ResumenCredito {
  const totalAPagar = redondear2(credito.installmentAmount * credito.totalInstallments);
  const totalPagado = redondear2(pagos.reduce((acc, p) => acc + p, 0));
  const saldoPendiente = Math.max(0, redondear2(totalAPagar - totalPagado));

  const cuotasPagadas =
    credito.installmentAmount > 0
      ? Math.min(credito.totalInstallments, Math.floor(totalPagado / credito.installmentAmount))
      : 0;

  return {
    totalAPagar,
    totalPagado,
    saldoPendiente,
    cuotasPagadas,
    cuotasRestantes: credito.totalInstallments - cuotasPagadas,
    progreso: totalAPagar > 0 ? Math.min(100, (totalPagado / totalAPagar) * 100) : 0,
    fechaEstimadaFin: fechaFinCredito(credito.startDate, credito.totalInstallments),
    interesesTotales: Math.max(0, redondear2(totalAPagar - credito.principal)),
  };
}

/** La cuota N se paga N-1 meses después del inicio. */
export function fechaCuota(startDate: Date, numeroCuota: number): Date {
  const p = sumarMeses(periodoDe(startDate), numeroCuota - 1);
  return fechaUTC(p.year, p.month, diaSeguro(p.year, p.month, startDate.getUTCDate()));
}

export function fechaFinCredito(startDate: Date, totalInstallments: number): Date {
  return fechaCuota(startDate, Math.max(1, totalInstallments));
}

/** Cuota fija de un crédito francés. tasaMensual va en porcentaje (1.5 = 1,5 %). */
export function cuotaFrancesa(principal: number, tasaMensual: number, cuotas: number): number {
  if (cuotas <= 0) return 0;
  const i = tasaMensual / 100;
  if (i === 0) return redondear2(principal / cuotas);
  const factor = (1 + i) ** cuotas;
  return redondear2((principal * i * factor) / (factor - 1));
}

function redondear2(v: number): number {
  return Math.round(v * 100) / 100;
}
