/**
 * El "alcance" es de quién son las cifras que se están mirando: del hogar
 * entero o de una sola persona. Vive en la URL (?quien=) para que el botón
 * "atrás" funcione y una vista se pueda compartir tal cual.
 */

export type Alcance = { tipo: "hogar" } | { tipo: "persona"; userId: string };

export type MiembroBasico = { id: string; nombre: string };

export const ALCANCE_HOGAR: Alcance = { tipo: "hogar" };

export const CLAVE_HOGAR = "hogar";

/**
 * Lee el valor de la URL. Se valida SIEMPRE contra los miembros del hogar
 * activo: sin esto, un ?quien= con el id de alguien de otra casa filtraría por
 * esa persona en vez de caer en el hogar propio.
 */
export function parseAlcance(
  valor: string | null | undefined,
  miembros: MiembroBasico[],
): Alcance {
  if (!valor || valor === CLAVE_HOGAR) return ALCANCE_HOGAR;
  const miembro = miembros.find((m) => m.id === valor);
  return miembro ? { tipo: "persona", userId: miembro.id } : ALCANCE_HOGAR;
}

export function claveAlcance(alcance: Alcance): string {
  return alcance.tipo === "hogar" ? CLAVE_HOGAR : alcance.userId;
}

export function etiquetaAlcance(alcance: Alcance, miembros: MiembroBasico[]): string {
  if (alcance.tipo === "hogar") return "Todo el hogar";
  return miembros.find((m) => m.id === alcance.userId)?.nombre ?? "Todo el hogar";
}

export function esPersona(
  alcance: Alcance,
): alcance is { tipo: "persona"; userId: string } {
  return alcance.tipo === "persona";
}

/** Fragmento de `where` de Prisma que aplica el alcance a una consulta. */
export function filtroPagador(alcance: Alcance): { paidByUserId?: string } {
  return esPersona(alcance) ? { paidByUserId: alcance.userId } : {};
}
