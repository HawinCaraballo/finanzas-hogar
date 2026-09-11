"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  claveDePeriodo,
  mesAnterior,
  mesSiguiente,
  mismoPeriodo,
  nombrePeriodo,
  parseClavePeriodo,
  periodoActual,
} from "@/lib/periodo";
import { cn } from "@/lib/utils";

/**
 * Navegación de mes. El periodo vive en la URL (?mes=2026-09) para que al
 * compartir o recargar la página se vea exactamente lo mismo.
 */
export function SelectorMes({ clave, className }: { clave: string; className?: string }) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();

  const periodo = parseClavePeriodo(clave) ?? periodoActual();
  const hoy = periodoActual();
  const esMesActual = mismoPeriodo(periodo, hoy);

  function ir(nuevo: typeof periodo) {
    const siguientes = new URLSearchParams(params);
    siguientes.set("mes", claveDePeriodo(nuevo));
    router.push(`${ruta}?${siguientes.toString()}`, { scroll: false });
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        onClick={() => ir(mesAnterior(periodo))}
        aria-label="Mes anterior"
        className="grid size-9 place-items-center rounded-app text-texto-suave transition-colors hover:bg-superficie-2 hover:text-texto"
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>

      <p
        aria-live="polite"
        className="min-w-[10.5rem] text-center text-sm font-semibold capitalize text-texto"
      >
        {nombrePeriodo(periodo)}
      </p>

      <button
        type="button"
        onClick={() => ir(mesSiguiente(periodo))}
        aria-label="Mes siguiente"
        className="grid size-9 place-items-center rounded-app text-texto-suave transition-colors hover:bg-superficie-2 hover:text-texto"
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>

      {!esMesActual && (
        <button
          type="button"
          onClick={() => ir(hoy)}
          className="ml-1 rounded-app px-2 py-1.5 text-xs font-medium text-marca transition-colors hover:bg-marca-suave"
        >
          Hoy
        </button>
      )}
    </div>
  );
}
