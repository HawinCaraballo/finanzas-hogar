/** Estado de una categoría frente a su tope mensual. */

export type EstadoPresupuesto = "ok" | "alerta" | "excedido";

export type ResumenPresupuesto = {
  tope: number;
  gastado: number;
  restante: number;
  /** Puede pasar de 100 cuando se excedió el tope. */
  porcentaje: number;
  estado: EstadoPresupuesto;
};

const UMBRAL_ALERTA = 80;

export function resumenPresupuesto(gastado: number, tope: number): ResumenPresupuesto {
  const porcentaje = tope > 0 ? (gastado / tope) * 100 : gastado > 0 ? 100 : 0;
  return {
    tope,
    gastado,
    restante: tope - gastado,
    porcentaje,
    estado: porcentaje > 100 ? "excedido" : porcentaje >= UMBRAL_ALERTA ? "alerta" : "ok",
  };
}

export const COLOR_ESTADO: Record<EstadoPresupuesto, string> = {
  ok: "bg-emerald-500",
  alerta: "bg-amber-500",
  excedido: "bg-rose-500",
};

export const TEXTO_ESTADO: Record<EstadoPresupuesto, string> = {
  ok: "text-emerald-600 dark:text-emerald-400",
  alerta: "text-amber-600 dark:text-amber-400",
  excedido: "text-rose-600 dark:text-rose-400",
};
