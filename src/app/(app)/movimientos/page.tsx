import type { Metadata } from "next";
import Link from "next/link";
import { SelectorMes } from "@/components/selector-mes";
import { BotonRegistrar } from "@/components/movimientos/boton-registrar";
import { FiltrosMovimientos } from "@/components/movimientos/filtros";
import { ListaMovimientos } from "@/components/movimientos/lista-movimientos";
import { ResumenFiltrado } from "@/components/movimientos/resumen-filtrado";
import { Tarjeta } from "@/components/ui/card";
import { Boton } from "@/components/ui/button";
import { parseAlcance, esPersona } from "@/lib/alcance";
import { requireHogar } from "@/lib/auth/guard";
import { claveDePeriodo, parseClavePeriodo, periodoActual } from "@/lib/periodo";
import { miembrosDelHogar } from "@/server/hogares";
import { categoriasDelHogar, listarMovimientos } from "@/server/movimientos";

export const metadata: Metadata = { title: "Movimientos" };

type Busqueda = {
  mes?: string;
  tipo?: string;
  categoria?: string;
  quien?: string;
  q?: string;
  pagina?: string;
};

export default async function PaginaMovimientos({
  searchParams,
}: {
  searchParams: Promise<Busqueda>;
}) {
  const sp = await searchParams;
  const periodo = (sp.mes && parseClavePeriodo(sp.mes)) || periodoActual();
  const clave = claveDePeriodo(periodo);
  const tipo = sp.tipo === "INGRESO" || sp.tipo === "EGRESO" ? sp.tipo : "TODOS";
  const pagina = Number(sp.pagina) > 0 ? Number(sp.pagina) : 1;

  const ctx = await requireHogar();
  const miembros = await miembrosDelHogar();
  // Se valida contra los miembros del hogar: un id ajeno no debe filtrar nada.
  const alcance = parseAlcance(sp.quien, miembros);
  const quien = esPersona(alcance) ? alcance.userId : "";

  const [categorias, resultado] = await Promise.all([
    categoriasDelHogar(false),
    listarMovimientos({
      periodo: clave,
      type: tipo,
      categoryId: sp.categoria || undefined,
      paidByUserId: quien || undefined,
      texto: sp.q || undefined,
      pagina,
    }),
  ]);

  const params = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ mes: clave });
    if (tipo !== "TODOS") p.set("tipo", tipo);
    if (sp.categoria) p.set("categoria", sp.categoria);
    if (quien) p.set("quien", quien);
    if (sp.q) p.set("q", sp.q);
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
    return p.toString();
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading font-medium text-texto">Movimientos</h1>
          <p className="text-caption text-texto-suave">
            {resultado.total === 0
              ? "Ningún movimiento con estos filtros"
              : `${resultado.total} ${resultado.total === 1 ? "movimiento" : "movimientos"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SelectorMes clave={clave} />
          <BotonRegistrar className="hidden sm:inline-flex">Registrar</BotonRegistrar>
        </div>
      </header>

      <ResumenFiltrado
        ingresos={resultado.totalIngresos}
        egresos={resultado.totalEgresos}
      />

      <FiltrosMovimientos
        categorias={categorias}
        miembros={miembros}
        usuarioActualId={ctx.user.id}
        tipo={tipo}
        categoryId={sp.categoria ?? ""}
        quien={quien}
        texto={sp.q ?? ""}
      />

      <Tarjeta className="overflow-hidden">
        <ListaMovimientos
          movimientos={resultado.movimientos}
          vacio={{
            titulo:
              sp.q || sp.categoria || quien || tipo !== "TODOS"
                ? "Nada coincide con estos filtros"
                : "Este mes todavía está en blanco",
            descripcion:
              sp.q || sp.categoria || quien || tipo !== "TODOS"
                ? "Prueba con otros filtros o cambia de mes."
                : "Registra el primer ingreso o gasto del mes y aparecerá aquí.",
            accion: <BotonRegistrar />,
          }}
        />
      </Tarjeta>

      {(pagina > 1 || resultado.hayMas) && (
        <nav className="flex items-center justify-between gap-2" aria-label="Paginación">
          <Boton asChild variante="secundario" disabled={pagina === 1}>
            <Link href={`/movimientos?${params({ pagina: String(pagina - 1) })}`}>Anteriores</Link>
          </Boton>
          <span className="text-micro text-texto-suave">Página {pagina}</span>
          <Boton asChild variante="secundario" disabled={!resultado.hayMas}>
            <Link href={`/movimientos?${params({ pagina: String(pagina + 1) })}`}>Siguientes</Link>
          </Boton>
        </nav>
      )}
    </div>
  );
}
