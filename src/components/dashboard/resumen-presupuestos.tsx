"use client";

import { useMoneda } from "@/components/moneda-provider";
import { Barra } from "@/components/ui/varios";
import { iconoPorNombre } from "@/lib/iconos";
import { COLOR_ESTADO, TEXTO_ESTADO } from "@/lib/presupuesto";
import type { PresupuestoVista } from "@/lib/tipos";
import { cn } from "@/lib/utils";

/** Barras de avance de cada tope, ordenadas por lo que más apremia. */
export function ResumenPresupuestos({ presupuestos }: { presupuestos: PresupuestoVista[] }) {
  const moneda = useMoneda();

  return (
    <ul className="space-y-3.5">
      {presupuestos.map((p) => {
        const Icono = iconoPorNombre(p.icon);
        return (
          <li key={p.categoryId}>
            <div className="mb-1.5 flex items-center gap-2">
              <span
                className="grid size-6 shrink-0 place-items-center rounded-full"
                style={{ backgroundColor: `${p.color}1f`, color: p.color }}
              >
                <Icono className="size-3" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 truncate text-caption text-texto">{p.nombre}</span>
              <span className={cn("cifra shrink-0 text-micro font-semibold", TEXTO_ESTADO[p.estado])}>
                {p.porcentaje.toFixed(0)} %
              </span>
            </div>

            <Barra
              porcentaje={p.porcentaje}
              color={COLOR_ESTADO[p.estado]}
              etiqueta={`Presupuesto de ${p.nombre}`}
            />

            <p className="cifra mt-1 text-micro text-texto-suave">
              {moneda.format(p.gastado)} de {moneda.format(p.tope)}
              {p.restante < 0 && (
                <span className="font-medium text-egreso">
                  {" "}
                  · {moneda.format(Math.abs(p.restante))} de más
                </span>
              )}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
