/**
 * Matemática de los reportes por miembro. Funciones puras para poder probar el
 * reparto sin base de datos.
 */

export type FilaMiembro = {
  userId: string;
  nombre: string;
  ingresos: number;
  egresos: number;
  balance: number;
};

export type TotalesHogar = {
  ingresos: number;
  egresos: number;
  balance: number;
};

/** Qué parte del total del hogar representa un monto, en 0..100. */
export function participacion(monto: number, total: number): number {
  if (total === 0) return 0;
  return (monto / total) * 100;
}

/**
 * El hogar es la suma de sus miembros. Como no existen los gastos personales,
 * esta suma es exacta y no una aproximación.
 */
export function totalesDeHogar(filas: FilaMiembro[]): TotalesHogar {
  const ingresos = filas.reduce((acc, f) => acc + f.ingresos, 0);
  const egresos = filas.reduce((acc, f) => acc + f.egresos, 0);
  return { ingresos, egresos, balance: ingresos - egresos };
}

/**
 * Ordena para la tabla del reporte: primero quien más ingresos aportó. Los
 * desempates están fijados a propósito para que la tabla no baile entre cargas.
 */
export function ordenarPorAporte(filas: FilaMiembro[]): FilaMiembro[] {
  return [...filas].sort(
    (a, b) =>
      b.ingresos - a.ingresos ||
      b.egresos - a.egresos ||
      a.nombre.localeCompare(b.nombre, "es"),
  );
}

/**
 * Colores de los miembros en las gráficas. Se asignan por posición en la lista
 * del hogar, que es estable, para que una persona conserve su color entre la
 * tabla, las barras y la dona.
 */
const PALETA_MIEMBROS = [
  "#0ea5e9", "#f59e0b", "#a855f7", "#22c55e",
  "#ef4444", "#14b8a6", "#ec4899", "#6366f1",
];

export function colorDeMiembro(indice: number): string {
  return PALETA_MIEMBROS[indice % PALETA_MIEMBROS.length];
}
