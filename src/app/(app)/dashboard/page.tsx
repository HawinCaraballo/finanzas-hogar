import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, PieChart, Target } from "lucide-react";
import { SelectorMes } from "@/components/selector-mes";
import { SelectorAlcance } from "@/components/selector-alcance";
import { GastosCategoria } from "@/components/dashboard/gastos-categoria";
import { GraficaMensual } from "@/components/dashboard/grafica-mensual";
import { TarjetasKpi } from "@/components/dashboard/tarjetas-kpi";
import { ProximosPagos } from "@/components/dashboard/proximos-pagos";
import { ResumenPresupuestos } from "@/components/dashboard/resumen-presupuestos";
import { BotonRegistrar } from "@/components/movimientos/boton-registrar";
import { ListaMovimientos } from "@/components/movimientos/lista-movimientos";
import {
  Tarjeta,
  TarjetaContenido,
  TarjetaDescripcion,
  TarjetaEncabezado,
  TarjetaTitulo,
} from "@/components/ui/card";
import { EstadoVacio } from "@/components/ui/varios";
import { esPersona, etiquetaAlcance, parseAlcance } from "@/lib/alcance";
import { requireHogar } from "@/lib/auth/guard";
import { miembrosDelHogar } from "@/server/hogares";
import { claveDePeriodo, nombrePeriodo, parseClavePeriodo, periodoActual } from "@/lib/periodo";
import {
  gastosPorCategoria,
  presupuestosDelMes,
  proximosPagos,
  resumenDelMes,
  serieMensual,
  ultimosMovimientos,
} from "@/server/dashboard";

export const metadata: Metadata = { title: "Inicio" };

export default async function PaginaDashboard({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; quien?: string }>;
}) {
  const { mes, quien } = await searchParams;
  const ctx = await requireHogar();
  const miembros = await miembrosDelHogar();
  const alcance = parseAlcance(quien, miembros);
  const periodo = (mes && parseClavePeriodo(mes)) || periodoActual();
  const soloUnaPersona = esPersona(alcance);
  const dequien = etiquetaAlcance(alcance, miembros);

  const [resumen, serie, gastos, presupuestos, pagos, recientes] = await Promise.all([
    resumenDelMes(periodo, alcance),
    serieMensual(periodo, alcance, 12),
    gastosPorCategoria(periodo, alcance),
    // Presupuestos y próximos pagos son del hogar por definición: un tope o una
    // cuota no se parten por persona, así que no siguen el alcance.
    presupuestosDelMes(periodo),
    proximosPagos(15),
    ultimosMovimientos(alcance, 6),
  ]);

  const sinDatos = resumen.cantidadMovimientos === 0 && serie.every((p) => p.ingresos + p.egresos === 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading font-medium text-texto">
            {soloUnaPersona ? `Cuenta de ${dequien}` : ctx.hogar.nombre}
          </h1>
          <p className="text-caption text-texto-suave">
            {soloUnaPersona ? `${ctx.hogar.nombre} · ` : "Resumen de "}
            <span className="capitalize">{nombrePeriodo(periodo)}</span>
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <SelectorMes clave={claveDePeriodo(periodo)} className="justify-between sm:justify-end" />
          <SelectorAlcance
            alcance={alcance}
            miembros={miembros}
            usuarioActualId={ctx.user.id}
            className="justify-between sm:justify-end"
          />
        </div>
      </header>

      {sinDatos ? (
        <Tarjeta>
          <EstadoVacio
            icono={PieChart}
            titulo={
              soloUnaPersona
                ? `${dequien} no tiene movimientos todavía`
                : "Tu dashboard está esperando el primer movimiento"
            }
            descripcion={
              soloUnaPersona
                ? "Cuando se registre un movimiento a su nombre, aparecerá aquí su cuenta individual."
                : "Registra un ingreso o un gasto y aquí verás, mes a mes, cuánto entra y cuánto sale de tu hogar."
            }
          >
            <BotonRegistrar tamano="lg" />
          </EstadoVacio>
        </Tarjeta>
      ) : (
        <>
          <TarjetasKpi resumen={resumen} />

          <Tarjeta>
            <TarjetaEncabezado>
              <div>
                <TarjetaTitulo>Mes a mes</TarjetaTitulo>
                <TarjetaDescripcion>
                  Lo que entró y lo que salió en los últimos 12 meses
                </TarjetaDescripcion>
              </div>
              <Leyenda />
            </TarjetaEncabezado>
            <TarjetaContenido>
              <GraficaMensual datos={serie} />
            </TarjetaContenido>
          </Tarjeta>

          <div className="grid gap-4 lg:grid-cols-2">
            <Tarjeta>
              <TarjetaEncabezado>
                <div>
                  <TarjetaTitulo>En qué se fue la plata</TarjetaTitulo>
                  <TarjetaDescripcion className="capitalize">
                    {nombrePeriodo(periodo)}
                  </TarjetaDescripcion>
                </div>
              </TarjetaEncabezado>
              <TarjetaContenido>
                {gastos.length > 0 ? (
                  <GastosCategoria datos={gastos} />
                ) : (
                  <EstadoVacio
                    icono={PieChart}
                    titulo="Sin gastos este mes"
                    descripcion="Cuando registres gastos verás aquí cómo se reparten por categoría."
                  />
                )}
              </TarjetaContenido>
            </Tarjeta>

            <div className="space-y-4">
              <Tarjeta>
                <TarjetaEncabezado>
                  <div>
                    <TarjetaTitulo>Presupuestos</TarjetaTitulo>
                    <TarjetaDescripcion>
                      {soloUnaPersona ? "Topes de todo el hogar" : "Cuánto llevas de cada tope"}
                    </TarjetaDescripcion>
                  </div>
                  <EnlaceSeccion href={`/presupuestos?mes=${claveDePeriodo(periodo)}`} />
                </TarjetaEncabezado>
                <TarjetaContenido>
                  {presupuestos.length > 0 ? (
                    <ResumenPresupuestos presupuestos={presupuestos.slice(0, 4)} />
                  ) : (
                    <EstadoVacio
                      icono={Target}
                      titulo="Sin presupuestos este mes"
                      descripcion="Ponle un tope mensual a las categorías que se te suelen ir de las manos."
                    />
                  )}
                </TarjetaContenido>
              </Tarjeta>

              <Tarjeta>
                <TarjetaEncabezado>
                  <div>
                    <TarjetaTitulo>Próximos pagos</TarjetaTitulo>
                    <TarjetaDescripcion>
                      {soloUnaPersona
                        ? "Del hogar, los siguientes 15 días"
                        : "Los siguientes 15 días"}
                    </TarjetaDescripcion>
                  </div>
                </TarjetaEncabezado>
                <TarjetaContenido>
                  {pagos.length > 0 ? (
                    <ProximosPagos pagos={pagos} />
                  ) : (
                    <EstadoVacio
                      icono={CalendarClock}
                      titulo="Nada pendiente por ahora"
                      descripcion="Los pagos fijos y las cuotas de crédito aparecerán aquí antes de vencerse."
                    />
                  )}
                </TarjetaContenido>
              </Tarjeta>
            </div>
          </div>

          <Tarjeta className="overflow-hidden">
            <TarjetaEncabezado>
              <TarjetaTitulo>Últimos movimientos</TarjetaTitulo>
              <EnlaceSeccion href="/movimientos" etiqueta="Ver todos" />
            </TarjetaEncabezado>
            <div className="border-t border-borde">
              <ListaMovimientos movimientos={recientes} agrupar={false} />
            </div>
          </Tarjeta>
        </>
      )}
    </div>
  );
}

function Leyenda() {
  return (
    <div className="flex shrink-0 items-center gap-3 text-micro text-texto-suave">
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-ingreso" aria-hidden />
        Ingresos
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-egreso" aria-hidden />
        Gastos
      </span>
    </div>
  );
}

function EnlaceSeccion({ href, etiqueta = "Ver" }: { href: string; etiqueta?: string }) {
  return (
    <Link
      href={href}
      className="flex shrink-0 items-center gap-1 text-micro font-medium text-marca-fuerte transition-opacity hover:opacity-80"
    >
      {etiqueta}
      <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}
