"use client";

import { useMoneda } from "./moneda-provider";

/**
 * Imprime un monto con la moneda del hogar. Existe para que las páginas que son
 * Server Components no tengan que recibir currency y locale por props solo para
 * escribir una cifra.
 */
export function MontoServidor({ valor }: { valor: number }) {
  const moneda = useMoneda();
  return <span className="cifra">{moneda.format(valor)}</span>;
}
