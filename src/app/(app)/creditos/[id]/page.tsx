import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Receipt } from "lucide-react";
import { AccionesCredito } from "@/components/creditos/detalle-credito";
import { ListaMovimientos } from "@/components/movimientos/lista-movimientos";
import { MontoServidor } from "@/components/monto-servidor";
import {
  Tarjeta,
  TarjetaContenido,
  TarjetaEncabezado,
  TarjetaTitulo,
} from "@/components/ui/card";
import { Barra, EstadoVacio, Insignia } from "@/components/ui/varios";
import { fechaLegible } from "@/lib/periodo";
import { ETIQUETA_CREDITO } from "@/lib/tipos";
import { creditoConPagos } from "@/server/creditos";

export const metadata: Metadata = { title: "Detalle del crédito" };

export default async function PaginaCredito({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const datos = await creditoConPagos(id);
  if (!datos) notFound();

  const { credito, pagos } = datos;
  const r = credito.resumen;

  const cifras = [
    { etiqueta: "Total a pagar", valor: r.totalAPagar },
    { etiqueta: "Pagado", valor: r.totalPagado, clase: "text-ingreso" },
    { etiqueta: "Falta", valor: r.saldoPendiente, clase: "text-egreso" },
    { etiqueta: "Costo del crédito", valor: r.interesesTotales },
  ];

  return (
    <div className="space-y-5">
      <Link
        href="/creditos"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-texto-suave transition-colors hover:text-texto"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Créditos
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-texto">{credito.nombre}</h1>
          <Insignia tono={credito.activo ? "marca" : "ingreso"}>
            {credito.activo ? ETIQUETA_CREDITO[credito.kind] : "Pagado"}
          </Insignia>
        </div>
        <p className="text-sm text-texto-suave">
          {r.cuotasPagadas} de {credito.totalInstallments} cuotas ·{" "}
          <MontoServidor valor={credito.installmentAmount} /> cada una
        </p>
      </header>

      <AccionesCredito credito={credito} />

      <Tarjeta>
        <TarjetaContenido className="pt-4 sm:pt-5">
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-texto">{r.progreso.toFixed(0)} % pagado</span>
            <span className="cifra text-sm text-texto-suave">
              Faltan {r.cuotasRestantes} {r.cuotasRestantes === 1 ? "cuota" : "cuotas"}
            </span>
          </div>
          <Barra
            porcentaje={r.progreso}
            color={credito.activo ? "bg-marca" : "bg-ingreso"}
            etiqueta="Avance del crédito"
            className="h-3"
          />

          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {cifras.map((c) => (
              <div key={c.etiqueta}>
                <dt className="text-[11px] uppercase tracking-wide text-texto-suave">
                  {c.etiqueta}
                </dt>
                <dd className={`cifra mt-0.5 text-sm font-semibold ${c.clase ?? "text-texto"}`}>
                  <MontoServidor valor={c.valor} />
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-borde pt-3 text-xs text-texto-suave">
            {r.proximaCuota && (
              <span className="flex items-center gap-1.5">
                <CalendarClock className="size-3.5" aria-hidden />
                Próxima cuota: <span className="first-letter:uppercase">{fechaLegible(r.proximaCuota)}</span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Receipt className="size-3.5" aria-hidden />
              Última cuota prevista:{" "}
              <span className="first-letter:uppercase">{fechaLegible(r.fechaEstimadaFin)}</span>
            </span>
          </div>
        </TarjetaContenido>
      </Tarjeta>

      <Tarjeta className="overflow-hidden">
        <TarjetaEncabezado>
          <TarjetaTitulo>Pagos registrados</TarjetaTitulo>
        </TarjetaEncabezado>
        <div className="border-t border-borde">
          {pagos.length > 0 ? (
            <ListaMovimientos movimientos={pagos} agrupar={false} />
          ) : (
            <EstadoVacio
              icono={Receipt}
              titulo="Todavía no hay pagos"
              descripcion="Registra la primera cuota y aparecerá aquí y en el dashboard."
            />
          )}
        </div>
      </Tarjeta>
    </div>
  );
}
