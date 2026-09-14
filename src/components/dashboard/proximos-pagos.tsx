"use client";

import { CalendarClock, Landmark, Repeat } from "lucide-react";
import { useMoneda } from "@/components/moneda-provider";
import { Insignia } from "@/components/ui/varios";
import { fechaLegible, parseFechaISO, soloFecha } from "@/lib/periodo";
import type { PagoProximo } from "@/lib/tipos";

/** Lo que hay que pagar pronto: reglas recurrentes y cuotas de crédito. */
export function ProximosPagos({ pagos }: { pagos: PagoProximo[] }) {
  const moneda = useMoneda();
  const hoy = soloFecha(new Date());

  return (
    <ul className="space-y-2.5">
      {pagos.map((p) => {
        const vencido = parseFechaISO(p.fecha) < hoy;
        const Icono = p.origen === "credito" ? Landmark : Repeat;
        return (
          <li key={p.id} className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-suave">
              <Icono className="size-4" aria-hidden />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-caption font-medium text-texto">
                {p.descripcion}
              </span>
              <span className="flex items-center gap-1.5 text-micro text-texto-suave">
                <CalendarClock className="size-3" aria-hidden />
                <span className="first-letter:uppercase">{fechaLegible(p.fecha)}</span>
                <span className="truncate">· {p.detalle}</span>
              </span>
            </span>

            <span className="shrink-0 text-right">
              <span className="cifra block text-caption font-semibold text-texto">
                {moneda.format(p.monto)}
              </span>
              {vencido && (
                <Insignia tono="egreso" className="mt-0.5">
                  Vencido
                </Insignia>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
