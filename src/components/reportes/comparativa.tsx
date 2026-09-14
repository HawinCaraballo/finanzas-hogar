"use client";

import { useMoneda } from "@/components/moneda-provider";
import { Barra } from "@/components/ui/varios";
import { colorDeMiembro } from "@/lib/reparto";
import type { FilaComparativa, MiembroVista, TotalesHogarVista } from "@/lib/tipos";
import { cn } from "@/lib/utils";

/**
 * Quién puso qué este mes. La fila del hogar va al final y en negrita: es la
 * suma exacta de las de arriba, porque un movimiento siempre pertenece a una
 * sola persona y a la casa al mismo tiempo.
 */
export function Comparativa({
  filas,
  totales,
  miembros,
  usuarioActualId,
}: {
  filas: FilaComparativa[];
  totales: TotalesHogarVista;
  miembros: MiembroVista[];
  usuarioActualId: string;
}) {
  const moneda = useMoneda();
  const indiceDe = (userId: string) => miembros.findIndex((m) => m.id === userId);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-caption">
        <thead>
          <tr className="border-b border-borde">
            <th className="py-2 pr-3 text-left text-micro font-semibold uppercase tracking-wide text-texto-suave">
              Persona
            </th>
            <th className="px-3 py-2 text-right text-micro font-semibold uppercase tracking-wide text-texto-suave">
              Ingresos
            </th>
            <th className="px-3 py-2 text-right text-micro font-semibold uppercase tracking-wide text-texto-suave">
              Gastos
            </th>
            <th className="py-2 pl-3 text-right text-micro font-semibold uppercase tracking-wide text-texto-suave">
              Balance
            </th>
          </tr>
        </thead>

        <tbody>
          {filas.map((f) => (
            <tr key={f.userId} className="border-b border-borde last:border-b-0">
              <td className="py-3 pr-3">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: colorDeMiembro(indiceDe(f.userId)) }}
                    aria-hidden
                  />
                  <span className="truncate font-medium text-texto">
                    {f.nombre}
                    {f.userId === usuarioActualId && (
                      <span className="ml-1 text-micro font-normal text-texto-suave">(tú)</span>
                    )}
                  </span>
                </div>
              </td>

              <Celda
                monto={moneda.format(f.ingresos)}
                porcentaje={f.participacionIngresos}
                tono="bg-ingreso"
                clase="text-ingreso"
              />
              <Celda
                monto={moneda.format(f.egresos)}
                porcentaje={f.participacionEgresos}
                tono="bg-egreso"
                clase="text-egreso"
              />

              <td className="py-3 pl-3 text-right">
                <span
                  className={cn(
                    "cifra font-semibold",
                    f.balance >= 0 ? "text-ingreso" : "text-egreso",
                  )}
                >
                  {moneda.format(f.balance)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr className="border-t-2 border-borde">
            <td className="py-3 pr-3 font-semibold text-texto">Todo el hogar</td>
            <td className="cifra px-3 py-3 text-right font-semibold text-ingreso">
              {moneda.format(totales.ingresos)}
            </td>
            <td className="cifra px-3 py-3 text-right font-semibold text-egreso">
              {moneda.format(totales.egresos)}
            </td>
            <td
              className={cn(
                "cifra py-3 pl-3 text-right font-semibold",
                totales.balance >= 0 ? "text-ingreso" : "text-egreso",
              )}
            >
              {moneda.format(totales.balance)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** Monto y, debajo, qué parte del total del hogar representa. */
function Celda({
  monto,
  porcentaje,
  tono,
  clase,
}: {
  monto: string;
  porcentaje: number;
  tono: string;
  clase: string;
}) {
  return (
    <td className="px-3 py-3 text-right align-middle">
      <span className={cn("cifra block font-medium", clase)}>{monto}</span>
      <span className="mt-1 flex items-center justify-end gap-1.5">
        <Barra porcentaje={porcentaje} color={tono} className="h-1 w-12" />
        <span className="cifra w-9 text-right text-micro text-texto-suave">
          {porcentaje.toFixed(0)} %
        </span>
      </span>
    </td>
  );
}
