"use client";

import { Copy, Check, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useMoneda } from "@/components/moneda-provider";
import { Boton } from "@/components/ui/button";
import { Entrada } from "@/components/ui/campos";
import { Tarjeta } from "@/components/ui/card";
import { Barra, Insignia } from "@/components/ui/varios";
import { iconoPorNombre } from "@/lib/iconos";
import type { Periodo } from "@/lib/periodo";
import { COLOR_ESTADO, TEXTO_ESTADO } from "@/lib/presupuesto";
import type { PresupuestoVista } from "@/lib/tipos";
import { cn } from "@/lib/utils";
import { copiarDelMesAnterior, guardarPresupuesto } from "@/server/presupuestos";

/**
 * Edición en la misma lista: se toca el lápiz, se escribe el tope y se guarda.
 * Evita abrir un diálogo por categoría cuando se están fijando diez topes seguidos.
 */
export function EditorPresupuestos({
  presupuestos,
  periodo,
}: {
  presupuestos: PresupuestoVista[];
  periodo: Periodo;
}) {
  const router = useRouter();
  const moneda = useMoneda();
  const [copiando, iniciarCopia] = useTransition();

  const conTope = presupuestos.filter((p) => p.tope > 0);
  const sinTope = presupuestos.filter((p) => p.tope === 0);

  const totalTope = conTope.reduce((acc, p) => acc + p.tope, 0);
  const totalGastado = conTope.reduce((acc, p) => acc + p.gastado, 0);

  function copiar() {
    iniciarCopia(async () => {
      const res = await copiarDelMesAnterior(periodo);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.data.copiados === 0
          ? "Los topes del mes anterior ya estaban puestos."
          : `Se copiaron ${res.data.copiados} topes.`,
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-app border border-borde bg-superficie p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-texto-suave">
            Presupuestado este mes
          </p>
          <p className="cifra mt-0.5 text-lg font-semibold text-texto">
            {moneda.format(totalGastado)}{" "}
            <span className="text-sm font-normal text-texto-suave">
              de {moneda.format(totalTope)}
            </span>
          </p>
        </div>
        <Boton variante="secundario" onClick={copiar} cargando={copiando}>
          <Copy aria-hidden />
          Copiar del mes anterior
        </Boton>
      </div>

      {conTope.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-texto">Con tope</h2>
          <Tarjeta className="overflow-hidden">
            <ul className="divide-y divide-borde">
              {conTope.map((p) => (
                <FilaPresupuesto key={p.categoryId} presupuesto={p} periodo={periodo} />
              ))}
            </ul>
          </Tarjeta>
        </section>
      )}

      {sinTope.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-texto">Sin tope</h2>
          <p className="mb-2 text-xs text-texto-suave">
            Ponle un tope a las categorías que quieras vigilar de cerca.
          </p>
          <Tarjeta className="overflow-hidden">
            <ul className="divide-y divide-borde">
              {sinTope.map((p) => (
                <FilaPresupuesto key={p.categoryId} presupuesto={p} periodo={periodo} />
              ))}
            </ul>
          </Tarjeta>
        </section>
      )}
    </div>
  );
}

function FilaPresupuesto({
  presupuesto: p,
  periodo,
}: {
  presupuesto: PresupuestoVista;
  periodo: Periodo;
}) {
  const router = useRouter();
  const moneda = useMoneda();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(p.tope > 0 ? moneda.formatNumero(p.tope) : "");
  const [guardando, setGuardando] = useState(false);
  const Icono = iconoPorNombre(p.icon);

  async function guardar() {
    const monto = texto.trim() === "" ? 0 : moneda.parse(texto);
    if (Number.isNaN(monto) || monto < 0) {
      toast.error("Escribe un monto válido.");
      return;
    }
    setGuardando(true);
    const res = await guardarPresupuesto({
      categoryId: p.categoryId,
      year: periodo.year,
      month: periodo.month,
      amount: monto,
    });
    setGuardando(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(monto === 0 ? "Tope quitado." : "Tope guardado.");
    setEditando(false);
    router.refresh();
  }

  return (
    <li className="px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-full"
          style={{ backgroundColor: `${p.color}1f`, color: p.color }}
        >
          <Icono className="size-4" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-texto">{p.nombre}</span>
            {p.estado === "excedido" && p.tope > 0 && <Insignia tono="egreso">Excedido</Insignia>}
          </div>
          <p className="cifra text-xs text-texto-suave">
            Gastado {moneda.format(p.gastado)}
            {p.tope > 0 && ` de ${moneda.format(p.tope)}`}
          </p>
        </div>

        {editando ? (
          <div className="flex shrink-0 items-center gap-1">
            <Entrada
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") guardar();
                if (e.key === "Escape") setEditando(false);
              }}
              inputMode="decimal"
              autoFocus
              aria-label={`Tope de ${p.nombre}`}
              placeholder="Sin tope"
              className="h-9 w-28 text-right text-sm"
            />
            <Boton
              variante="fantasma"
              tamano="iconoSm"
              onClick={guardar}
              cargando={guardando}
              aria-label="Guardar tope"
            >
              <Check className="text-ingreso" aria-hidden />
            </Boton>
            <Boton
              variante="fantasma"
              tamano="iconoSm"
              onClick={() => setEditando(false)}
              aria-label="Cancelar"
            >
              <X aria-hidden />
            </Boton>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                "cifra text-sm font-semibold",
                p.tope > 0 ? TEXTO_ESTADO[p.estado] : "text-texto-suave",
              )}
            >
              {p.tope > 0 ? `${p.porcentaje.toFixed(0)} %` : "—"}
            </span>
            <Boton
              variante="fantasma"
              tamano="iconoSm"
              onClick={() => setEditando(true)}
              aria-label={`Fijar tope de ${p.nombre}`}
            >
              <Pencil aria-hidden />
            </Boton>
          </div>
        )}
      </div>

      {p.tope > 0 && (
        <Barra
          porcentaje={p.porcentaje}
          color={COLOR_ESTADO[p.estado]}
          etiqueta={`Presupuesto de ${p.nombre}`}
          className="mt-2"
        />
      )}
    </li>
  );
}
