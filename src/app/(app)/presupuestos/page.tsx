import type { Metadata } from "next";
import { SelectorMes } from "@/components/selector-mes";
import { EditorPresupuestos } from "@/components/presupuestos/editor-presupuestos";
import { Tarjeta } from "@/components/ui/card";
import { EstadoVacio } from "@/components/ui/varios";
import { Target } from "lucide-react";
import { claveDePeriodo, nombrePeriodo, parseClavePeriodo, periodoActual } from "@/lib/periodo";
import { presupuestosEditables } from "@/server/presupuestos";

export const metadata: Metadata = { title: "Presupuestos" };

export default async function PaginaPresupuestos({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const periodo = (mes && parseClavePeriodo(mes)) || periodoActual();
  const presupuestos = await presupuestosEditables(periodo);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading-sm font-medium text-texto">Presupuestos</h1>
          <p className="text-sm text-texto-suave">
            Topes de <span className="capitalize">{nombrePeriodo(periodo)}</span>
          </p>
        </div>
        <SelectorMes clave={claveDePeriodo(periodo)} className="justify-between sm:justify-end" />
      </header>

      {presupuestos.length === 0 ? (
        <Tarjeta>
          <EstadoVacio
            icono={Target}
            titulo="No hay categorías de gasto"
            descripcion="Crea al menos una categoría de gasto para poder ponerle un tope mensual."
          />
        </Tarjeta>
      ) : (
        <EditorPresupuestos presupuestos={presupuestos} periodo={periodo} />
      )}
    </div>
  );
}
