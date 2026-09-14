"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Pause, Pencil, Play, Plus, Repeat, Trash2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMoneda } from "@/components/moneda-provider";
import { CampoMonto } from "@/components/movimientos/campo-monto";
import { Boton } from "@/components/ui/button";
import { Campo, Entrada, Seleccion } from "@/components/ui/campos";
import { Tarjeta } from "@/components/ui/card";
import { Dialogo, DialogoContenido } from "@/components/ui/dialog";
import { EstadoVacio, Insignia } from "@/components/ui/varios";
import { Controller } from "react-hook-form";
import { iconoPorNombre } from "@/lib/iconos";
import { aFechaISO, fechaLegible, parseFechaISO, soloFecha } from "@/lib/periodo";
import { ETIQUETA_FRECUENCIA } from "@/lib/recurrencia";
import type { CategoriaVista, RecurrenteVista } from "@/lib/tipos";
import { cn } from "@/lib/utils";
import { recurrenteSchema, type RecurrenteInput } from "@/lib/validaciones";
import {
  alternarRecurrente,
  eliminarRecurrente,
  guardarRecurrente,
  registrarAhora,
} from "@/server/recurrentes";

export function GestorRecurrentes({
  reglas,
  categorias,
}: {
  reglas: RecurrenteVista[];
  categorias: CategoriaVista[];
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<RecurrenteVista | "nueva" | null>(null);

  async function accion(promesa: Promise<{ ok: boolean; error?: string }>, exito: string) {
    const res = await promesa;
    if (!res.ok) {
      toast.error(res.error ?? "No pudimos completar la operación.");
      return;
    }
    toast.success(exito);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Boton onClick={() => setEditando("nueva")}>
        <Plus aria-hidden />
        Nueva regla
      </Boton>

      {reglas.length === 0 ? (
        <Tarjeta>
          <EstadoVacio
            icono={Repeat}
            titulo="Sin movimientos fijos"
            descripcion="Crea una regla para el arriendo, los servicios o la cuota del crédito y deja de registrarlos a mano cada mes."
          />
        </Tarjeta>
      ) : (
        <Tarjeta className="overflow-hidden">
          <ul className="divide-y divide-borde">
            {reglas.map((r) => (
              <Fila
                key={r.id}
                regla={r}
                onEditar={() => setEditando(r)}
                onAlternar={() =>
                  accion(
                    alternarRecurrente(r.id, !r.activa),
                    r.activa ? "Regla pausada." : "Regla reactivada.",
                  )
                }
                onBorrar={() => accion(eliminarRecurrente(r.id), "Regla eliminada.")}
                onRegistrar={() => accion(registrarAhora(r.id), "Movimiento registrado.")}
              />
            ))}
          </ul>
        </Tarjeta>
      )}

      <Dialogo open={editando !== null} onOpenChange={(a) => !a && setEditando(null)}>
        {editando && (
          <DialogoContenido
            titulo={editando === "nueva" ? "Nueva regla recurrente" : "Editar regla"}
            descripcion="Lo que se repite todos los meses: arriendo, servicios, cuotas."
          >
            <FormularioRecurrente
              categorias={categorias}
              regla={editando === "nueva" ? undefined : editando}
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

function Fila({
  regla: r,
  onEditar,
  onAlternar,
  onBorrar,
  onRegistrar,
}: {
  regla: RecurrenteVista;
  onEditar: () => void;
  onAlternar: () => void;
  onBorrar: () => void;
  onRegistrar: () => void;
}) {
  const moneda = useMoneda();
  const Icono = iconoPorNombre(r.categoria.icon);
  const esIngreso = r.type === "INGRESO";
  const vencida = r.activa && !r.autoPost && parseFechaISO(r.proximaFecha) <= soloFecha(new Date());

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-full"
        style={{ backgroundColor: `${r.categoria.color}1f`, color: r.categoria.color }}
      >
        <Icono className="size-4" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "truncate text-sm font-medium",
              r.activa ? "text-texto" : "text-texto-suave",
            )}
          >
            {r.descripcion}
          </span>
          {!r.activa && <Insignia>Pausada</Insignia>}
          {r.autoPost ? (
            <Insignia tono="marca">
              <Zap className="size-3" aria-hidden />
              Automática
            </Insignia>
          ) : (
            <Insignia>Recordatorio</Insignia>
          )}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-texto-suave">
          <CalendarClock className="size-3" aria-hidden />
          {ETIQUETA_FRECUENCIA[r.frequency]} · próxima{" "}
          <span className="first-letter:uppercase">{fechaLegible(r.proximaFecha)}</span>
        </p>
      </div>

      <span
        className={cn(
          "cifra shrink-0 text-sm font-semibold",
          esIngreso ? "text-ingreso" : "text-egreso",
        )}
      >
        {esIngreso ? "+" : "-"}
        {moneda.format(r.amount)}
      </span>

      <div className="flex shrink-0 items-center gap-0.5">
        {vencida && (
          <Boton variante="secundario" tamano="sm" onClick={onRegistrar}>
            Registrar
          </Boton>
        )}
        <Boton variante="fantasma" tamano="iconoSm" onClick={onEditar} aria-label="Editar regla">
          <Pencil aria-hidden />
        </Boton>
        <Boton
          variante="fantasma"
          tamano="iconoSm"
          onClick={onAlternar}
          aria-label={r.activa ? "Pausar regla" : "Reactivar regla"}
        >
          {r.activa ? <Pause aria-hidden /> : <Play aria-hidden />}
        </Boton>
        <Boton variante="fantasma" tamano="iconoSm" onClick={onBorrar} aria-label="Eliminar regla">
          <Trash2 className="text-egreso" aria-hidden />
        </Boton>
      </div>
    </li>
  );
}

function FormularioRecurrente({
  categorias,
  regla,
  onListo,
}: {
  categorias: CategoriaVista[];
  regla?: RecurrenteVista;
  onListo: () => void;
}) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RecurrenteInput>({
    resolver: zodResolver(recurrenteSchema),
    defaultValues: regla
      ? {
          id: regla.id,
          type: regla.type,
          amount: regla.amount,
          categoryId: regla.categoria.id,
          descripcion: regla.descripcion,
          frequency: regla.frequency,
          dayOfMonth: regla.dayOfMonth,
          startDate: regla.fechaInicio,
          endDate: regla.fechaFin ?? "",
          autoPost: regla.autoPost,
        }
      : {
          type: "EGRESO",
          amount: 0,
          categoryId: "",
          descripcion: "",
          frequency: "MENSUAL",
          dayOfMonth: new Date().getUTCDate(),
          startDate: aFechaISO(new Date()),
          endDate: "",
          autoPost: true,
        },
  });

  const tipo = watch("type");
  const frecuencia = watch("frequency");
  const opciones = categorias.filter((c) => c.type === tipo && !c.archivada);

  const enviar = handleSubmit(async (valores) => {
    const res = await guardarRecurrente(valores);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(regla ? "Regla actualizada." : "Regla creada.");
    onListo();
  });

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Tipo" htmlFor="tipo-rec">
          <Seleccion id="tipo-rec" {...register("type")}>
            <option value="EGRESO">Gasto fijo</option>
            <option value="INGRESO">Ingreso fijo</option>
          </Seleccion>
        </Campo>

        <Campo etiqueta="Cada cuánto" htmlFor="frecuencia">
          <Seleccion id="frecuencia" {...register("frequency")}>
            <option value="MENSUAL">Cada mes</option>
            <option value="QUINCENAL">Cada 15 días</option>
            <option value="SEMANAL">Cada semana</option>
            <option value="ANUAL">Cada año</option>
          </Seleccion>
        </Campo>
      </div>

      <Campo etiqueta="Monto" htmlFor="monto-rec" error={errors.amount?.message}>
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <CampoMonto
              id="monto-rec"
              valor={field.value}
              onChange={field.onChange}
              tono={tipo === "INGRESO" ? "ingreso" : "egreso"}
              invalido={!!errors.amount}
            />
          )}
        />
      </Campo>

      <Campo etiqueta="Descripción" htmlFor="desc-rec" error={errors.descripcion?.message}>
        <Entrada id="desc-rec" placeholder="Arriendo" {...register("descripcion")} />
      </Campo>

      <Campo etiqueta="Categoría" htmlFor="cat-rec" error={errors.categoryId?.message}>
        <Seleccion id="cat-rec" {...register("categoryId")}>
          <option value="">Elige una categoría</option>
          {opciones.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Seleccion>
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        {(frecuencia === "MENSUAL" || frecuencia === "ANUAL") && (
          <Campo
            etiqueta="Día del mes"
            htmlFor="dia-rec"
            ayuda="Si el mes no tiene ese día, se cobra el último."
            error={errors.dayOfMonth?.message}
          >
            <Entrada
              id="dia-rec"
              type="number"
              min={1}
              max={31}
              inputMode="numeric"
              {...register("dayOfMonth", { valueAsNumber: true })}
            />
          </Campo>
        )}

        <Campo etiqueta="Desde" htmlFor="inicio-rec" error={errors.startDate?.message}>
          <Entrada id="inicio-rec" type="date" {...register("startDate")} />
        </Campo>

        <Campo
          etiqueta="Hasta (opcional)"
          htmlFor="fin-rec"
          ayuda="Déjalo vacío si no tiene fin."
          error={errors.endDate?.message}
        >
          <Entrada id="fin-rec" type="date" {...register("endDate")} />
        </Campo>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-panel border border-borde p-3">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-[var(--marca)]"
          {...register("autoPost")}
        />
        <span>
          <span className="block text-sm font-medium text-texto">Registrarlo automáticamente</span>
          <span className="block text-xs text-texto-suave">
            Si lo desactivas, la regla solo te lo recuerda y tú confirmas el registro.
          </span>
        </span>
      </label>

      <Boton type="submit" className="w-full" tamano="lg" cargando={isSubmitting}>
        {regla ? "Guardar cambios" : "Crear regla"}
      </Boton>
    </form>
  );
}
