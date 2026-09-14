"use client";

import { Repeat, Wallet } from "lucide-react";
import { useMoneda } from "@/components/moneda-provider";
import { EstadoVacio } from "@/components/ui/varios";
import { iconoPorNombre } from "@/lib/iconos";
import { fechaLegible } from "@/lib/periodo";
import type { MovimientoVista } from "@/lib/tipos";
import { cn } from "@/lib/utils";
import { useMovimiento } from "./proveedor-movimiento";

/**
 * Lista de movimientos agrupada por día, con el total de cada día a la derecha.
 * Tocar una fila abre el formulario de edición.
 */
export function ListaMovimientos({
  movimientos,
  agrupar = true,
  vacio,
}: {
  movimientos: MovimientoVista[];
  agrupar?: boolean;
  vacio?: { titulo: string; descripcion: string; accion?: React.ReactNode };
}) {
  const { editar } = useMovimiento();
  const moneda = useMoneda();

  if (movimientos.length === 0) {
    return (
      <EstadoVacio
        icono={Wallet}
        titulo={vacio?.titulo ?? "Todavía no hay movimientos"}
        descripcion={
          vacio?.descripcion ??
          "Registra el primer ingreso o gasto y aquí verás el historial."
        }
      >
        {vacio?.accion}
      </EstadoVacio>
    );
  }

  if (!agrupar) {
    return (
      <ul className="divide-y divide-borde">
        {movimientos.map((m) => (
          <Fila key={m.id} movimiento={m} onEditar={editar} />
        ))}
      </ul>
    );
  }

  const grupos = agruparPorFecha(movimientos);

  return (
    <div className="divide-y divide-borde">
      {grupos.map((grupo) => (
        <section key={grupo.fecha}>
          <header className="flex items-baseline justify-between gap-3 bg-superficie-2/60 px-4 py-1.5">
            <h3 className="text-xs font-semibold first-letter:uppercase text-texto-suave">
              {fechaLegible(grupo.fecha)}
            </h3>
            <span
              className={cn(
                "cifra text-xs font-medium",
                grupo.neto >= 0 ? "text-ingreso" : "text-egreso",
              )}
            >
              {grupo.neto >= 0 ? "+" : ""}
              {moneda.format(grupo.neto)}
            </span>
          </header>
          <ul className="divide-y divide-borde">
            {grupo.movimientos.map((m) => (
              <Fila key={m.id} movimiento={m} onEditar={editar} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Fila({
  movimiento,
  onEditar,
}: {
  movimiento: MovimientoVista;
  onEditar: (m: MovimientoVista) => void;
}) {
  const moneda = useMoneda();
  const Icono = iconoPorNombre(movimiento.categoria.icon);
  const esIngreso = movimiento.type === "INGRESO";

  return (
    <li>
      <button
        type="button"
        onClick={() => onEditar(movimiento)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-superficie-2"
      >
        <span
          className="grid size-9 shrink-0 place-items-center rounded-full"
          style={{
            backgroundColor: `${movimiento.categoria.color}1f`,
            color: movimiento.categoria.color,
          }}
        >
          <Icono className="size-4" aria-hidden />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-texto">
              {movimiento.descripcion}
            </span>
            {movimiento.esRecurrente && (
              <Repeat className="size-3 shrink-0 text-texto-suave" aria-label="Movimiento recurrente" />
            )}
          </span>
          <span className="block truncate text-xs text-texto-suave">
            {movimiento.categoria.nombre} ·{" "}
            {esIngreso ? "recibió" : "pagó"} {movimiento.responsable.nombre}
            {/*
              Solo se menciona a quien registró cuando NO es quien puso la
              plata. Repetir el mismo nombre dos veces sería ruido.
            */}
            {movimiento.autor.id !== movimiento.responsable.id &&
              ` · registró ${movimiento.autor.nombre}`}
          </span>
        </span>

        <span
          className={cn(
            "cifra shrink-0 text-sm font-semibold",
            esIngreso ? "text-ingreso" : "text-egreso",
          )}
        >
          {esIngreso ? "+" : "-"}
          {moneda.format(movimiento.amount)}
        </span>
      </button>
    </li>
  );
}

function agruparPorFecha(movimientos: MovimientoVista[]) {
  const mapa = new Map<string, MovimientoVista[]>();
  for (const m of movimientos) {
    const grupo = mapa.get(m.fecha);
    if (grupo) grupo.push(m);
    else mapa.set(m.fecha, [m]);
  }
  return [...mapa.entries()].map(([fecha, lista]) => ({
    fecha,
    movimientos: lista,
    neto: lista.reduce((acc, m) => acc + (m.type === "INGRESO" ? m.amount : -m.amount), 0),
  }));
}
