"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMoneda } from "@/components/moneda-provider";
import { colorDeMiembro } from "@/lib/reparto";
import type { FilaComparativa, MiembroVista, PuntoSerieMiembros } from "@/lib/tipos";
import { cn } from "@/lib/utils";

type Metrica = "ingresos" | "egresos";

/**
 * Barras apiladas: cada mes es una columna y cada tramo, una persona. Así se ve
 * de un golpe si el reparto cambió con el tiempo, que es la pregunta que una
 * tabla de un solo mes no puede responder.
 */
export function BarrasMiembros({
  serie,
  miembros,
}: {
  serie: PuntoSerieMiembros[];
  miembros: MiembroVista[];
}) {
  const moneda = useMoneda();
  const [metrica, setMetrica] = useState<Metrica>("ingresos");

  // Recharts necesita una fila plana por mes: una columna por persona.
  const datos = serie.map((punto) => {
    const fila: Record<string, string | number> = { etiqueta: punto.etiqueta };
    for (const m of miembros) fila[m.id] = punto[metrica][m.id] ?? 0;
    return fila;
  });

  return (
    <div className="space-y-3">
      <div
        role="radiogroup"
        aria-label="Qué comparar"
        className="flex w-fit gap-1 rounded-app bg-superficie-2 p-1"
      >
        {(
          [
            { valor: "ingresos", etiqueta: "Aportes" },
            { valor: "egresos", etiqueta: "Gastos" },
          ] as const
        ).map((op) => (
          <button
            key={op.valor}
            type="button"
            role="radio"
            aria-checked={metrica === op.valor}
            onClick={() => setMetrica(op.valor)}
            className={cn(
              "h-8 rounded-[0.4rem] px-3 text-xs font-medium transition-colors",
              metrica === op.valor
                ? "bg-superficie text-texto shadow-sm"
                : "text-texto-suave hover:text-texto",
            )}
          >
            {op.etiqueta}
          </button>
        ))}
      </div>

      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--borde)" strokeDasharray="3 3" />
            <XAxis
              dataKey="etiqueta"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--texto-suave)", fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={54}
              tick={{ fill: "var(--texto-suave)", fontSize: 11 }}
              tickFormatter={(v: number) => moneda.formatCompacto(v)}
            />
            <Tooltip
              cursor={{ fill: "var(--superficie-2)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const total = payload.reduce((acc, p) => acc + Number(p.value ?? 0), 0);
                return (
                  <div className="rounded-app border border-borde bg-superficie p-3 text-xs shadow-lg">
                    <p className="mb-1.5 font-semibold capitalize text-texto">{label}</p>
                    {payload.map((p) => {
                      const miembro = miembros.find((m) => m.id === p.dataKey);
                      return (
                        <p key={String(p.dataKey)} className="flex items-center gap-2">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: p.color }}
                            aria-hidden
                          />
                          <span className="text-texto-suave">{miembro?.nombre ?? "—"}</span>
                          <span className="cifra ml-auto font-medium text-texto">
                            {moneda.format(Number(p.value ?? 0))}
                          </span>
                        </p>
                      );
                    })}
                    <p className="mt-1.5 flex items-center gap-2 border-t border-borde pt-1.5">
                      <span className="text-texto-suave">Total</span>
                      <span className="cifra ml-auto font-semibold text-texto">
                        {moneda.format(total)}
                      </span>
                    </p>
                  </div>
                );
              }}
            />
            {miembros.map((m, i) => (
              <Bar
                key={m.id}
                dataKey={m.id}
                name={m.nombre}
                stackId="total"
                fill={colorDeMiembro(i)}
                maxBarSize={28}
                // Solo el tramo de arriba lleva las esquinas redondeadas.
                radius={i === miembros.length - 1 ? [3, 3, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Leyenda miembros={miembros} />
    </div>
  );
}

/** Cómo se repartieron los gastos del mes entre las personas de la casa. */
export function DonaMiembros({
  filas,
  miembros,
}: {
  filas: FilaComparativa[];
  miembros: MiembroVista[];
}) {
  const moneda = useMoneda();
  const conGasto = filas.filter((f) => f.egresos > 0);
  const total = conGasto.reduce((acc, f) => acc + f.egresos, 0);
  const indiceDe = (userId: string) => miembros.findIndex((m) => m.id === userId);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative size-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={conGasto}
              dataKey="egresos"
              nameKey="nombre"
              innerRadius="62%"
              outerRadius="100%"
              // Explícitos: arranca arriba y da la vuelta completa en el
              // sentido del reloj. Con los valores por defecto de Recharts, el
              // paddingAngle dejaba un hueco al cerrar el círculo.
              startAngle={90}
              endAngle={-270}
              paddingAngle={1}
              minAngle={3}
              strokeWidth={0}
            >
              {conGasto.map((f) => (
                <Cell key={f.userId} fill={colorDeMiembro(indiceDe(f.userId))} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const f = payload[0].payload as FilaComparativa;
                return (
                  <div className="rounded-app border border-borde bg-superficie px-3 py-2 text-xs shadow-lg">
                    <p className="font-semibold text-texto">{f.nombre}</p>
                    <p className="cifra text-texto-suave">
                      {moneda.format(f.egresos)} · {f.participacionEgresos.toFixed(0)} %
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-texto-suave">Gastos</p>
            <p className="cifra text-sm font-semibold text-texto">
              {moneda.formatCompacto(total)}
            </p>
          </div>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2">
        {conGasto.map((f) => (
          <li key={f.userId} className="flex items-center gap-2.5 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: colorDeMiembro(indiceDe(f.userId)) }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-texto">{f.nombre}</span>
            <span className="cifra shrink-0 font-medium text-texto">
              {moneda.format(f.egresos)}
            </span>
            <span className="w-10 shrink-0 text-right text-xs text-texto-suave">
              {f.participacionEgresos.toFixed(0)} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Leyenda({ miembros }: { miembros: MiembroVista[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-texto-suave">
      {miembros.map((m, i) => (
        <li key={m.id} className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: colorDeMiembro(i) }}
            aria-hidden
          />
          {m.nombre}
        </li>
      ))}
    </ul>
  );
}
