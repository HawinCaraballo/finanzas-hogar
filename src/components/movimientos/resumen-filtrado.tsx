"use client";

import { useMoneda } from "@/components/moneda-provider";
import { cn } from "@/lib/utils";

/** Totales de lo que hay en pantalla ahora mismo, con los filtros aplicados. */
export function ResumenFiltrado({
  ingresos,
  egresos,
}: {
  ingresos: number;
  egresos: number;
}) {
  const moneda = useMoneda();
  const balance = ingresos - egresos;

  const items = [
    { etiqueta: "Ingresos", valor: ingresos, clase: "text-ingreso" },
    { etiqueta: "Gastos", valor: egresos, clase: "text-egreso" },
    {
      etiqueta: "Balance",
      valor: balance,
      clase: balance >= 0 ? "text-ingreso" : "text-egreso",
    },
  ];

  return (
    <dl className="grid grid-cols-3 divide-x divide-borde rounded-app bg-superficie hairline">
      {items.map((i) => (
        <div key={i.etiqueta} className="px-3 py-2.5 text-center sm:px-4">
          <dt className="text-micro font-medium uppercase tracking-wide text-texto-suave">
            {i.etiqueta}
          </dt>
          <dd className={cn("cifra mt-0.5 truncate text-caption font-semibold sm:text-body", i.clase)}>
            {moneda.format(i.valor)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
