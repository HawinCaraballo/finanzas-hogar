"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useMoneda } from "@/components/moneda-provider";
import { iconoPorNombre } from "@/lib/iconos";
import type { GastoPorCategoria } from "@/lib/tipos";

/**
 * En qué se fue la plata este mes. La dona da la proporción de un vistazo y la
 * lista de al lado da las cifras exactas, que es lo que la gente termina leyendo.
 */
export function GastosCategoria({ datos }: { datos: GastoPorCategoria[] }) {
  const moneda = useMoneda();
  const total = datos.reduce((acc, d) => acc + d.total, 0);

  // Más de ocho porciones se vuelven ilegibles: el resto se agrupa.
  const visibles = datos.slice(0, 8);
  const resto = datos.slice(8);
  const porciones = resto.length
    ? [
        ...visibles,
        {
          id: "resto",
          nombre: `Otras ${resto.length} categorías`,
          color: "#94a3b8",
          icon: "Tag",
          total: resto.reduce((acc, d) => acc + d.total, 0),
          porcentaje: resto.reduce((acc, d) => acc + d.porcentaje, 0),
        },
      ]
    : visibles;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative mx-auto size-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={porciones}
              dataKey="total"
              nameKey="nombre"
              innerRadius="62%"
              outerRadius="100%"
              // Explícitos: arranca arriba y cierra el círculo. Con los valores
              // por defecto, el paddingAngle dejaba un hueco al final.
              startAngle={90}
              endAngle={-270}
              paddingAngle={1}
              minAngle={3}
              strokeWidth={0}
            >
              {porciones.map((p) => (
                <Cell key={p.id} fill={p.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as GastoPorCategoria;
                return (
                  <div className="rounded-panel border border-borde bg-superficie px-3 py-2 text-xs shadow-flotante">
                    <p className="font-semibold text-texto">{p.nombre}</p>
                    <p className="cifra text-texto-suave">
                      {moneda.format(p.total)} · {p.porcentaje.toFixed(0)} %
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-texto-suave">Total</p>
            <p className="cifra text-sm font-semibold text-texto">{moneda.formatCompacto(total)}</p>
          </div>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-1.5">
        {porciones.map((p) => {
          const Icono = iconoPorNombre(p.icon);
          return (
            <li key={p.id} className="flex items-center gap-2.5 text-sm">
              <span
                className="grid size-7 shrink-0 place-items-center rounded-full"
                style={{ backgroundColor: `${p.color}1f`, color: p.color }}
              >
                <Icono className="size-3.5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 truncate text-texto">{p.nombre}</span>
              <span className="cifra shrink-0 font-medium text-texto">
                {moneda.format(p.total)}
              </span>
              <span className="w-10 shrink-0 text-right text-xs text-texto-suave">
                {p.porcentaje.toFixed(0)} %
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
