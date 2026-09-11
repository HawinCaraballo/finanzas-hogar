import { ZodError } from "zod";

/**
 * Toda Server Action devuelve esto en vez de lanzar. Así el formulario puede
 * mostrar el mensaje sin que Next convierta el error en una pantalla de fallo.
 */
export type Resultado<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function exito(): Resultado<undefined>;
export function exito<T>(data: T): Resultado<T>;
export function exito<T>(data?: T): Resultado<T | undefined> {
  return { ok: true, data };
}

export function fallo(error: string): Resultado<never> {
  return { ok: false, error };
}

/** Convierte cualquier excepción en un mensaje que se le puede mostrar a una persona. */
export function comoFallo(e: unknown, porDefecto = "No pudimos completar la operación."): Resultado<never> {
  if (e instanceof ZodError) {
    return fallo(e.issues[0]?.message ?? porDefecto);
  }
  if (e instanceof Error) {
    // Errores de unicidad de Prisma.
    if (e.message.includes("Unique constraint")) {
      return fallo("Ya existe un registro con esos datos.");
    }
    return fallo(e.message || porDefecto);
  }
  return fallo(porDefecto);
}
