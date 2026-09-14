"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMoneda } from "@/components/moneda-provider";
import type { PuntoSerie } from "@/lib/tipos";

/**
 * Ingresos contra gastos, mes a mes. Es la vista que responde directamente
 * "cuánto entra y cuánto sale": dos barras por mes, mismo par de colores que
 * el resto de la app.
 */
export function GraficaMensual({ datos }: { datos: PuntoSerie[] }) {
  const moneda = useMoneda();

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 4, right: 4, bottom: 0, left: 4 }} barGap={2}>
          <CartesianGrid
            vertical={false}
            stroke="var(--borde)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="etiqueta"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--texto-suave)", fontSize: 11 }}
            // En móvil no caben 12 etiquetas: se muestran una sí y una no.
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
              const punto = payload[0].payload as PuntoSerie;
              return (
                <div className="rounded-panel border border-borde bg-superficie p-3 text-xs shadow-flotante">
                  <p className="mb-1.5 font-semibold capitalize text-texto">{label}</p>
                  <Fila etiqueta="Ingresos" valor={moneda.format(punto.ingresos)} color="var(--ingreso)" />
                  <Fila etiqueta="Gastos" valor={moneda.format(punto.egresos)} color="var(--egreso)" />
                  <div className="mt-1.5 border-t border-borde pt-1.5">
                    <Fila
                      etiqueta="Balance"
                      valor={moneda.format(punto.balance)}
                      color={punto.balance >= 0 ? "var(--ingreso)" : "var(--egreso)"}
                    />
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="ingresos" name="Ingresos" fill="var(--ingreso)" radius={[3, 3, 0, 0]} maxBarSize={22} />
          <Bar dataKey="egresos" name="Gastos" fill="var(--egreso)" radius={[3, 3, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Fila({ etiqueta, valor, color }: { etiqueta: string; valor: string; color: string }) {
  return (
    <p className="flex items-center gap-2">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <span className="text-texto-suave">{etiqueta}</span>
      <span className="cifra ml-auto font-medium text-texto">{valor}</span>
    </p>
  );
}
