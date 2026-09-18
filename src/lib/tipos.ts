import type { Frequency, LoanKind, MovementType } from "@prisma/client";

/** Formas que viajan del servidor a la interfaz. Decimal ya viene como number. */

export type CategoriaVista = {
  id: string;
  nombre: string;
  type: MovementType;
  icon: string;
  color: string;
  isSystem: boolean;
  archivada: boolean;
};

export type MovimientoVista = {
  id: string;
  type: MovementType;
  amount: number;
  fecha: string; // ISO corto: "2026-09-11"
  descripcion: string;
  notas: string | null;
  categoria: { id: string; nombre: string; icon: string; color: string };
  /** Quién lo registró en la app. */
  autor: { id: string; nombre: string };
  /** Quién puso o recibió la plata. Define la cuenta individual. */
  responsable: { id: string; nombre: string };
  loanId: string | null;
  esRecurrente: boolean;
  /** Suma en la cuenta de su responsable, pero no en la del hogar. */
  esPersonal: boolean;
};

export type CreditoVista = {
  id: string;
  nombre: string;
  kind: LoanKind;
  principal: number;
  interestRate: number;
  totalInstallments: number;
  installmentAmount: number;
  fechaInicio: string;
  categoryId: string;
  activo: boolean;
  /** Quién paga las cuotas. Cada pago se le atribuye por defecto. */
  responsable: { id: string; nombre: string };
};

export type FiltrosMovimientos = {
  periodo?: string; // "2026-09"; ausente = todos los meses
  type?: MovementType | "TODOS";
  categoryId?: string;
  /** Filtra por quién pagó o recibió, no por quién registró. */
  paidByUserId?: string;
  /** "hogar" = solo lo compartido; "personal" = solo lo personal. */
  ambito?: "TODOS" | "HOGAR" | "PERSONAL";
  texto?: string;
  pagina?: number;
};

export const ETIQUETA_CREDITO: Record<LoanKind, string> = {
  CREDITO: "Crédito",
  TARJETA: "Tarjeta de crédito",
  HIPOTECA: "Hipoteca",
  VEHICULO: "Vehículo",
  OTRO: "Otro",
};

// --- Formas derivadas que usan el dashboard y la sección de créditos ---
// Viven aquí (y no en los módulos con "use server") porque un archivo de
// Server Actions solo debe exportar funciones asíncronas.

import type { ResumenCredito } from "./creditos";
import type { ResumenPresupuesto } from "./presupuesto";

export type ResumenCreditoVista = Omit<ResumenCredito, "fechaEstimadaFin"> & {
  fechaEstimadaFin: string;
  proximaCuota: string | null;
};

export type CreditoConResumen = CreditoVista & { resumen: ResumenCreditoVista };

export type ResumenMes = {
  ingresos: number;
  egresos: number;
  balance: number;
  /**
   * Cuántos movimientos personales quedaron fuera. Solo se cuenta al mirar el
   * hogar completo, para avisar de que las cifras no los incluyen. Es un
   * conteo y no un monto porque sumar ingresos y gastos personales en una
   * sola cifra no significaría nada.
   */
  personalesExcluidos: number;
  ingresosPrevios: number;
  egresosPrevios: number;
  balancePrevio: number;
  cantidadMovimientos: number;
};

export type PuntoSerie = {
  clave: string;
  etiqueta: string;
  ingresos: number;
  egresos: number;
  balance: number;
};

export type GastoPorCategoria = {
  id: string;
  nombre: string;
  color: string;
  icon: string;
  total: number;
  porcentaje: number;
};

export type PresupuestoVista = ResumenPresupuesto & {
  categoryId: string;
  nombre: string;
  color: string;
  icon: string;
};

export type PagoProximo = {
  id: string;
  descripcion: string;
  detalle: string;
  monto: number;
  fecha: string;
  origen: "recurrente" | "credito";
};

export type RecurrenteVista = {
  id: string;
  type: MovementType;
  amount: number;
  descripcion: string;
  frequency: Frequency;
  dayOfMonth: number;
  fechaInicio: string;
  fechaFin: string | null;
  proximaFecha: string;
  autoPost: boolean;
  activa: boolean;
  /** Los movimientos que genere no contarán en el hogar. */
  esPersonal: boolean;
  categoria: { id: string; nombre: string; icon: string; color: string };
  responsable: { id: string; nombre: string };
};

// --- Reportes por miembro ---

export type MiembroVista = { id: string; nombre: string };

export type TotalesHogarVista = { ingresos: number; egresos: number; balance: number };

/** Una fila de la tabla comparativa, con su peso dentro del hogar. */
export type FilaComparativa = {
  userId: string;
  nombre: string;
  ingresos: number;
  egresos: number;
  balance: number;
  /** Qué parte de los ingresos del hogar aportó, en 0..100. */
  participacionIngresos: number;
  /** Qué parte de los gastos del hogar pagó, en 0..100. */
  participacionEgresos: number;
  /**
   * Lo personal de quien mira el reporte. Queda fuera de las columnas del
   * hogar para que los porcentajes sigan sumando 100 entre los miembros.
   */
  personalIngresos: number;
  personalEgresos: number;
};

/** Un mes de la serie apilada, con el total de cada miembro en ese mes. */
export type PuntoSerieMiembros = {
  clave: string;
  etiqueta: string;
  /** userId -> monto del mes. */
  ingresos: Record<string, number>;
  egresos: Record<string, number>;
};
