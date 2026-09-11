import { PrismaClient } from "@prisma/client";

// En desarrollo Next.js recarga los módulos en caliente; sin este singleton se
// abrirían conexiones nuevas en cada recarga hasta agotar el pool.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Prisma devuelve Decimal; la interfaz trabaja con number.
 * Toda conversión de dinero pasa por aquí.
 */
export function aNumero(valor: { toString(): string } | null | undefined): number {
  if (valor === null || valor === undefined) return 0;
  return Number(valor.toString());
}
