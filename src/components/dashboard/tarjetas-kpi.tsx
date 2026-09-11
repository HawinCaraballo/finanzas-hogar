"use client";

import { ArrowDownRight, ArrowUpRight, Minus, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { useMoneda } from "@/components/moneda-provider";
import { variacionPorcentual } from "@/lib/money";
import type { ResumenMes } from "@/lib/tipos";
import { cn } from "@/lib/utils";

/**
 * Las tres cifras que responden la pregunta del mes: cuánto entró, cuánto salió
 * y con cuánto quedamos. La comparación contra el mes anterior va al lado,
 * porque un número sin referencia no dice nada.
 */
export function TarjetasKpi({ resumen }: { resumen: ResumenMes }) {
  const moneda = useMoneda();

  const tarjetas = [
    {
      etiqueta: "Ingresos",
      valor: resumen.ingresos,
      previo: resumen.ingresosPrevios,
      icono: TrendingUp,
      clase: "text-ingreso",
      fondo: "bg-ingreso-suave",
      // En ingresos subir es bueno; en gastos es lo contrario.
      subirEsBueno: true,
    },
    {
      etiqueta: "Gastos",
      valor: resumen.egresos,
      previo: resumen.egresosPrevios,
      icono: TrendingDown,
      clase: "text-egreso",
      fondo: "bg-egreso-suave",
      subirEsBueno: false,
    },
    {
      etiqueta: "Balance",
      valor: resumen.balance,
      previo: resumen.balancePrevio,
      icono: Scale,
      clase: resumen.balance >= 0 ? "text-ingreso" : "text-egreso",
      fondo: resumen.balance >= 0 ? "bg-ingreso-suave" : "bg-egreso-suave",
      subirEsBueno: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {tarjetas.map((t) => {
        const variacion = variacionPorcentual(t.valor, t.previo);
        return (
          <div key={t.etiqueta} className="rounded-app border border-borde bg-superficie p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-texto-suave">
                {t.etiqueta}
              </p>
              <span className={cn("grid size-8 place-items-center rounded-app", t.fondo, t.clase)}>
                <t.icono className="size-4" aria-hidden />
              </span>
            </div>

            <p className={cn("cifra mt-2 text-2xl font-semibold", t.clase)}>
              {moneda.format(t.valor)}
            </p>

            <Variacion
              porcentaje={variacion}
              subirEsBueno={t.subirEsBueno}
              anterior={moneda.format(t.previo)}
            />
          </div>
        );
      })}
    </div>
  );
}

function Variacion({
  porcentaje,
  subirEsBueno,
  anterior,
}: {
  porcentaje: number | null;
  subirEsBueno: boolean;
  anterior: string;
}) {
  if (porcentaje === null) {
    return (
      <p className="mt-1.5 flex items-center gap-1 text-xs text-texto-suave">
        <Minus className="size-3" aria-hidden />
        Sin datos del mes anterior
      </p>
    );
  }

  const subio = porcentaje > 0;
  const neutro = Math.abs(porcentaje) < 0.5;
  const bueno = subio === subirEsBueno;
  const Icono = subio ? ArrowUpRight : ArrowDownRight;

  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-texto-suave">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-medium",
          neutro ? "text-texto-suave" : bueno ? "text-ingreso" : "text-egreso",
        )}
      >
        {!neutro && <Icono className="size-3" aria-hidden />}
        {Math.abs(porcentaje).toFixed(0)} %
      </span>
      <span>frente a {anterior}</span>
    </p>
  );
}
