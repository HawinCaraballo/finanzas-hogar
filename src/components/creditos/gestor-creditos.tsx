"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Landmark, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMoneda } from "@/components/moneda-provider";
import { CampoMonto } from "@/components/movimientos/campo-monto";
import { Boton } from "@/components/ui/button";
import { Campo, Entrada, Seleccion } from "@/components/ui/campos";
import { Tarjeta } from "@/components/ui/card";
import { Dialogo, DialogoContenido } from "@/components/ui/dialog";
import { Barra, EstadoVacio, Insignia } from "@/components/ui/varios";
import { cuotaFrancesa } from "@/lib/creditos";
import { aFechaISO, fechaLegible } from "@/lib/periodo";
import {
  ETIQUETA_CREDITO,
  type CategoriaVista,
  type CreditoConResumen,
  type MiembroVista,
} from "@/lib/tipos";
import { creditoSchema, type CreditoInput } from "@/lib/validaciones";
import { guardarCredito } from "@/server/creditos";

export function GestorCreditos({
  creditos,
  categorias,
  miembros,
  usuarioActualId,
}: {
  creditos: CreditoConResumen[];
  categorias: CategoriaVista[];
  miembros: MiembroVista[];
  usuarioActualId: string;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<CreditoConResumen | "nuevo" | null>(null);

  const activos = creditos.filter((c) => c.activo);
  const pagados = creditos.filter((c) => !c.activo);

  return (
    <div className="space-y-5">
      <Boton onClick={() => setEditando("nuevo")}>
        <Plus aria-hidden />
        Nuevo crédito
      </Boton>

      {creditos.length === 0 ? (
        <Tarjeta>
          <EstadoVacio
            icono={Landmark}
            titulo="Sin créditos registrados"
            descripcion="Registra un préstamo o una tarjeta y lleva el control de cuánto llevas pagado y cuánto falta."
          />
        </Tarjeta>
      ) : (
        <>
          {activos.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-texto">Activos</h2>
              {activos.map((c) => (
                <TarjetaCredito key={c.id} credito={c} mostrarResponsable={miembros.length > 1} />
              ))}
            </section>
          )}

          {pagados.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-texto">Pagados</h2>
              {pagados.map((c) => (
                <TarjetaCredito key={c.id} credito={c} mostrarResponsable={miembros.length > 1} />
              ))}
            </section>
          )}
        </>
      )}

      <Dialogo open={editando !== null} onOpenChange={(a) => !a && setEditando(null)}>
        {editando && (
          <DialogoContenido
            titulo={editando === "nuevo" ? "Nuevo crédito" : "Editar crédito"}
            descripcion="Con el monto, la cuota y el número de cuotas se calcula todo lo demás."
          >
            <FormularioCredito
              categorias={categorias}
              miembros={miembros}
              usuarioActualId={usuarioActualId}
              credito={editando === "nuevo" ? undefined : editando}
              onListo={() => {
                setEditando(null);
                router.refresh();
              }}
            />
          </DialogoContenido>
        )}
      </Dialogo>
    </div>
  );
}

function TarjetaCredito({
  credito: c,
  mostrarResponsable,
}: {
  credito: CreditoConResumen;
  mostrarResponsable: boolean;
}) {
  const moneda = useMoneda();

  return (
    <Tarjeta className="transition-colors hover:border-marca/40">
      <Link href={`/creditos/${c.id}`} className="block p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-texto">{c.nombre}</h3>
              <Insignia tono={c.activo ? "marca" : "ingreso"}>
                {c.activo ? ETIQUETA_CREDITO[c.kind] : "Pagado"}
              </Insignia>
            </div>
            <p className="mt-0.5 text-xs text-texto-suave">
              Cuota {moneda.format(c.installmentAmount)} · {c.resumen.cuotasPagadas} de{" "}
              {c.totalInstallments} pagadas
              {mostrarResponsable && ` · paga ${c.responsable.nombre}`}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[11px] uppercase tracking-wide text-texto-suave">Falta</p>
            <p className="cifra text-base font-semibold text-texto">
              {moneda.format(c.resumen.saldoPendiente)}
            </p>
          </div>
        </div>

        <Barra
          porcentaje={c.resumen.progreso}
          color={c.activo ? "bg-marca" : "bg-ingreso"}
          etiqueta={`Avance de ${c.nombre}`}
          className="mt-3"
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-texto-suave">
          <span>{c.resumen.progreso.toFixed(0)} % pagado</span>
          {c.resumen.proximaCuota && (
            <span className="flex items-center gap-1">
              <CalendarClock className="size-3" aria-hidden />
              Próxima cuota <span className="first-letter:uppercase">{fechaLegible(c.resumen.proximaCuota)}</span>
            </span>
          )}
        </div>
      </Link>
    </Tarjeta>
  );
}

function FormularioCredito({
  categorias,
  miembros,
  usuarioActualId,
  credito,
  onListo,
}: {
  categorias: CategoriaVista[];
  miembros: MiembroVista[];
  usuarioActualId: string;
  credito?: CreditoConResumen;
  onListo: () => void;
}) {
  const moneda = useMoneda();
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreditoInput>({
    resolver: zodResolver(creditoSchema),
    defaultValues: credito
      ? {
          id: credito.id,
          nombre: credito.nombre,
          kind: credito.kind,
          categoryId: credito.categoryId,
          principal: credito.principal,
          interestRate: credito.interestRate,
          totalInstallments: credito.totalInstallments,
          installmentAmount: credito.installmentAmount,
          startDate: credito.fechaInicio,
          paidByUserId: credito.responsable.id,
        }
      : {
          nombre: "",
          kind: "CREDITO",
          categoryId: "",
          principal: 0,
          interestRate: 0,
          totalInstallments: 12,
          installmentAmount: 0,
          startDate: aFechaISO(new Date()),
          paidByUserId: usuarioActualId,
        },
  });

  const gastos = categorias.filter((c) => c.type === "EGRESO" && !c.archivada);
  const principal = watch("principal");
  const tasa = watch("interestRate");
  const cuotas = watch("totalInstallments");

  // Atajo: calcula la cuota con la fórmula francesa para no sacarla a mano.
  const sugerida =
    principal > 0 && cuotas > 0 ? cuotaFrancesa(principal, tasa || 0, cuotas) : 0;

  const enviar = handleSubmit(async (valores) => {
    const res = await guardarCredito(valores);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(credito ? "Crédito actualizado." : "Crédito registrado.");
    onListo();
  });

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <Campo etiqueta="Nombre" htmlFor="nombre-cred" error={errors.nombre?.message}>
        <Entrada
          id="nombre-cred"
          placeholder="Crédito de libre inversión"
          {...register("nombre")}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Tipo" htmlFor="tipo-cred">
          <Seleccion id="tipo-cred" {...register("kind")}>
            {Object.entries(ETIQUETA_CREDITO).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </Seleccion>
        </Campo>

        <Campo
          etiqueta="Categoría de la cuota"
          htmlFor="cat-cred"
          error={errors.categoryId?.message}
        >
          <Seleccion id="cat-cred" {...register("categoryId")}>
            <option value="">Elige una categoría</option>
            {gastos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Seleccion>
        </Campo>
      </div>

      {/*
        El responsable del crédito. Cada cuota se le atribuye por defecto, que
        es lo que pasa en la vida real: siempre la paga la misma persona.
      */}
      {miembros.length > 1 && (
        <Campo
          etiqueta="¿Quién lo paga?"
          htmlFor="responsable-cred"
          ayuda="En cuya cuenta individual entrarán las cuotas."
          error={errors.paidByUserId?.message}
        >
          <Seleccion id="responsable-cred" {...register("paidByUserId")}>
            {miembros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id === usuarioActualId ? `${m.nombre} (yo)` : m.nombre}
              </option>
            ))}
          </Seleccion>
        </Campo>
      )}

      <Campo
        etiqueta="Monto prestado"
        htmlFor="principal"
        ayuda="El capital, sin intereses."
        error={errors.principal?.message}
      >
        <Controller
          control={control}
          name="principal"
          render={({ field }) => (
            <CampoMonto
              id="principal"
              valor={field.value}
              onChange={field.onChange}
              tono="egreso"
              invalido={!!errors.principal}
            />
          )}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Número de cuotas"
          htmlFor="cuotas"
          error={errors.totalInstallments?.message}
        >
          <Entrada
            id="cuotas"
            type="number"
            min={1}
            max={600}
            inputMode="numeric"
            {...register("totalInstallments", { valueAsNumber: true })}
          />
        </Campo>

        <Campo
          etiqueta="Tasa mensual (%)"
          htmlFor="tasa"
          ayuda="Opcional, solo para sugerir la cuota."
          error={errors.interestRate?.message}
        >
          <Entrada
            id="tasa"
            type="number"
            step="0.01"
            min={0}
            max={100}
            inputMode="decimal"
            {...register("interestRate", { valueAsNumber: true })}
          />
        </Campo>
      </div>

      <Campo
        etiqueta="Valor de la cuota"
        htmlFor="cuota"
        error={errors.installmentAmount?.message}
      >
        <Controller
          control={control}
          name="installmentAmount"
          render={({ field }) => (
            <CampoMonto
              id="cuota"
              valor={field.value}
              onChange={field.onChange}
              tono="egreso"
              invalido={!!errors.installmentAmount}
            />
          )}
        />
      </Campo>

      {sugerida > 0 && (
        <button
          type="button"
          onClick={() => setValue("installmentAmount", sugerida, { shouldValidate: true })}
          className="w-full rounded-app bg-marca-suave px-3 py-2 text-left text-xs text-marca transition-opacity hover:opacity-80"
        >
          Con esos datos la cuota sería <strong>{moneda.format(sugerida)}</strong>. Tócalo para
          usarla.
        </button>
      )}

      <Campo
        etiqueta="Fecha de la primera cuota"
        htmlFor="inicio-cred"
        error={errors.startDate?.message}
      >
        <Entrada id="inicio-cred" type="date" {...register("startDate")} />
      </Campo>

      <Boton type="submit" className="w-full" tamano="lg" cargando={isSubmitting}>
        {credito ? "Guardar cambios" : "Registrar crédito"}
      </Boton>
    </form>
  );
}
