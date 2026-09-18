import type { Metadata } from "next";
import { Users } from "lucide-react";
import { SelectorMes } from "@/components/selector-mes";
import { Comparativa } from "@/components/reportes/comparativa";
import { BarrasMiembros, DonaMiembros } from "@/components/reportes/graficas-miembros";
import {
  Tarjeta,
  TarjetaContenido,
  TarjetaDescripcion,
  TarjetaEncabezado,
  TarjetaTitulo,
} from "@/components/ui/card";
import { EstadoVacio } from "@/components/ui/varios";
import { requireHogar } from "@/lib/auth/guard";
import { claveDePeriodo, nombrePeriodo, parseClavePeriodo, periodoActual } from "@/lib/periodo";
import { comparativaMiembros, serieMensualPorMiembro } from "@/server/reportes";

export const metadata: Metadata = { title: "Reportes" };

export default async function PaginaReportes({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const ctx = await requireHogar();
  const periodo = (mes && parseClavePeriodo(mes)) || periodoActual();

  const [{ filas, totales, miembros }, serie] = await Promise.all([
    comparativaMiembros(periodo),
    serieMensualPorMiembro(periodo, 12),
  ]);

  const hayMovimientos = totales.ingresos > 0 || totales.egresos > 0;
  const hayGastos = filas.some((f) => f.egresos > 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-texto">Reportes</h1>
          <p className="text-sm text-texto-suave">
            Quién puso qué en <span className="capitalize">{nombrePeriodo(periodo)}</span>
          </p>
        </div>
        <SelectorMes clave={claveDePeriodo(periodo)} className="justify-between sm:justify-end" />
      </header>

      {miembros.length < 2 ? (
        <Tarjeta>
          <EstadoVacio
            icono={Users}
            titulo="Todavía vives solo en este hogar"
            descripcion="Los reportes comparan a las personas de la casa entre sí. Invita a alguien desde la sección Hogar y aquí verás el reparto."
          />
        </Tarjeta>
      ) : !hayMovimientos ? (
        <Tarjeta>
          <EstadoVacio
            icono={Users}
            titulo="Sin movimientos este mes"
            descripcion="Cuando se registren ingresos o gastos verás aquí cuánto puso cada quien."
          />
        </Tarjeta>
      ) : (
        <>
          <Tarjeta>
            <TarjetaEncabezado>
              <div>
                <TarjetaTitulo>Cuenta de cada quien</TarjetaTitulo>
                <TarjetaDescripcion>
                  Solo lo compartido: los movimientos personales van aparte
                </TarjetaDescripcion>
              </div>
            </TarjetaEncabezado>
            <TarjetaContenido>
              <Comparativa
                filas={filas}
                totales={totales}
                miembros={miembros}
                usuarioActualId={ctx.user.id}
              />
            </TarjetaContenido>
          </Tarjeta>

          <Tarjeta>
            <TarjetaEncabezado>
              <div>
                <TarjetaTitulo>Mes a mes, por persona</TarjetaTitulo>
                <TarjetaDescripcion>
                  Cómo se repartió el esfuerzo en los últimos 12 meses
                </TarjetaDescripcion>
              </div>
            </TarjetaEncabezado>
            <TarjetaContenido>
              <BarrasMiembros serie={serie} miembros={miembros} />
            </TarjetaContenido>
          </Tarjeta>

          {hayGastos && (
            <Tarjeta>
              <TarjetaEncabezado>
                <div>
                  <TarjetaTitulo>Quién pagó los gastos</TarjetaTitulo>
                  <TarjetaDescripcion className="capitalize">
                    {nombrePeriodo(periodo)}
                  </TarjetaDescripcion>
                </div>
              </TarjetaEncabezado>
              <TarjetaContenido>
                <DonaMiembros filas={filas} miembros={miembros} />
              </TarjetaContenido>
            </Tarjeta>
          )}
        </>
      )}
    </div>
  );
}
