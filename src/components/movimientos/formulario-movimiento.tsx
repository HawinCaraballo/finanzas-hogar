"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ChevronDown, Trash2 } from "lucide-react";
import { Boton } from "@/components/ui/button";
import { AreaTexto, Campo, Entrada, Seleccion } from "@/components/ui/campos";
import { iconoPorNombre } from "@/lib/iconos";
import { aFechaISO } from "@/lib/periodo";
import type {
  CategoriaVista,
  CreditoVista,
  MiembroVista,
  MovimientoVista,
} from "@/lib/tipos";
import { cn } from "@/lib/utils";
import { movimientoSchema, type MovimientoInput } from "@/lib/validaciones";
import {
  actualizarMovimiento,
  crearMovimiento,
  eliminarMovimiento,
} from "@/server/movimientos";
import { CampoMonto } from "./campo-monto";

/**
 * Un solo formulario para ingresos y gastos. El selector de tipo va arriba y de
 * él dependen el color, las categorías que se ofrecen y el verbo del botón:
 * así no hay manera de registrar un gasto creyendo que era un ingreso.
 */
export function FormularioMovimiento({
  categorias,
  creditos,
  miembros,
  usuarioActualId,
  movimiento,
  tipoInicial = "EGRESO",
  onListo,
}: {
  categorias: CategoriaVista[];
  creditos: CreditoVista[];
  miembros: MiembroVista[];
  usuarioActualId: string;
  movimiento?: MovimientoVista;
  tipoInicial?: "INGRESO" | "EGRESO";
  onListo: () => void;
}) {
  const router = useRouter();
  const editando = Boolean(movimiento);
  const [masOpciones, setMasOpciones] = useState(
    Boolean(movimiento?.notas || movimiento?.loanId),
  );

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MovimientoInput>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: movimiento
      ? {
          id: movimiento.id,
          type: movimiento.type,
          amount: movimiento.amount,
          categoryId: movimiento.categoria.id,
          date: movimiento.fecha,
          descripcion: movimiento.descripcion,
          notas: movimiento.notas ?? "",
          loanId: movimiento.loanId ?? "",
          paidByUserId: movimiento.responsable.id,
          esPersonal: movimiento.esPersonal,
        }
      : {
          type: tipoInicial,
          amount: 0,
          categoryId: "",
          date: aFechaISO(new Date()),
          descripcion: "",
          notas: "",
          loanId: "",
          paidByUserId: usuarioActualId,
          esPersonal: false,
        },
  });

  const tipo = watch("type");
  const categoriaElegida = watch("categoryId");
  const esIngreso = tipo === "INGRESO";

  const opciones = useMemo(
    () => categorias.filter((c) => c.type === tipo && !c.archivada),
    [categorias, tipo],
  );

  function cambiarTipo(nuevo: "INGRESO" | "EGRESO") {
    if (nuevo === tipo) return;
    setValue("type", nuevo);
    // La categoría anterior es del otro tipo: se limpia para obligar a elegir.
    setValue("categoryId", "");
  }

  const enviar = handleSubmit(async (valores) => {
    const res = editando
      ? await actualizarMovimiento(valores)
      : await crearMovimiento(valores);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(
      editando
        ? "Movimiento actualizado."
        : esIngreso
          ? "Ingreso registrado."
          : "Gasto registrado.",
    );
    onListo();
    router.refresh();
  });

  async function borrar() {
    if (!movimiento) return;
    const res = await eliminarMovimiento(movimiento.id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Movimiento eliminado.");
    onListo();
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      <div
        role="radiogroup"
        aria-label="Tipo de movimiento"
        className="grid grid-cols-2 gap-1 rounded-app bg-superficie-2 p-1"
      >
        {(
          [
            { valor: "EGRESO", etiqueta: "Gasto", activo: "bg-egreso text-white" },
            { valor: "INGRESO", etiqueta: "Ingreso", activo: "bg-ingreso text-white" },
          ] as const
        ).map((op) => (
          <button
            key={op.valor}
            type="button"
            role="radio"
            aria-checked={tipo === op.valor}
            onClick={() => cambiarTipo(op.valor)}
            className={cn(
              "h-11 rounded-[0.5rem] text-sm font-semibold transition-colors",
              tipo === op.valor ? op.activo : "text-texto-suave hover:text-texto",
            )}
          >
            {op.etiqueta}
          </button>
        ))}
      </div>

      <Campo etiqueta="Monto" htmlFor="monto" error={errors.amount?.message}>
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <CampoMonto
              id="monto"
              valor={field.value}
              onChange={field.onChange}
              tono={esIngreso ? "ingreso" : "egreso"}
              invalido={!!errors.amount}
              focoInicial={!editando}
            />
          )}
        />
      </Campo>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-texto">Categoría</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {opciones.map((c) => {
            const Icono = iconoPorNombre(c.icon);
            const elegida = c.id === categoriaElegida;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setValue("categoryId", c.id, { shouldValidate: true })}
                aria-pressed={elegida}
                className={cn(
                  "flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-app border p-2 text-center transition-colors",
                  elegida
                    ? "border-transparent ring-2 ring-marca"
                    : "border-borde hover:bg-superficie-2",
                )}
                style={elegida ? { backgroundColor: `${c.color}1f` } : undefined}
              >
                <Icono className="size-5" style={{ color: c.color }} aria-hidden />
                <span className="line-clamp-2 text-[11px] font-medium leading-tight text-texto">
                  {c.nombre}
                </span>
              </button>
            );
          })}
        </div>
        <input type="hidden" {...register("categoryId")} />
        {errors.categoryId && (
          <p role="alert" className="mt-2 text-xs font-medium text-egreso">
            {errors.categoryId.message}
          </p>
        )}
        {opciones.length === 0 && (
          <p className="mt-2 text-xs text-texto-suave">
            No hay categorías de este tipo. Créalas en la sección Categorías.
          </p>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Fecha" htmlFor="fecha" error={errors.date?.message}>
          <Entrada id="fecha" type="date" aria-invalid={!!errors.date} {...register("date")} />
        </Campo>

        <Campo
          etiqueta="Descripción (opcional)"
          htmlFor="descripcion"
          error={errors.descripcion?.message}
        >
          <Entrada
            id="descripcion"
            placeholder={esIngreso ? "Salario de septiembre" : "Mercado de la semana"}
            aria-invalid={!!errors.descripcion}
            {...register("descripcion")}
          />
        </Campo>
      </div>

      {/*
        Un hogar de una sola persona no necesita elegir pagador: sería un campo
        con una única opción estorbando en el camino rápido.
      */}
      {miembros.length > 1 && (
        <Campo
          etiqueta={esIngreso ? "¿Quién lo recibió?" : "¿Quién lo pagó?"}
          htmlFor="pagador"
          ayuda="Define en qué cuenta individual entra este movimiento."
          error={errors.paidByUserId?.message}
        >
          <Seleccion id="pagador" {...register("paidByUserId")}>
            {miembros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id === usuarioActualId ? `${m.nombre} (yo)` : m.nombre}
              </option>
            ))}
          </Seleccion>
        </Campo>
      )}

      <label className="flex cursor-pointer items-start gap-3 rounded-app border border-borde p-3">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-[var(--marca)]"
          {...register("esPersonal")}
        />
        <span>
          <span className="block text-sm font-medium text-texto">
            {esIngreso ? "Ingreso personal" : "Gasto personal"}
          </span>
          <span className="block text-xs text-texto-suave">
            Entra en tu cuenta individual pero no en los totales del hogar ni en los
            presupuestos. Los demás lo siguen viendo en la lista.
          </span>
        </span>
      </label>

      <div>
        <button
          type="button"
          onClick={() => setMasOpciones((v) => !v)}
          aria-expanded={masOpciones}
          className="flex items-center gap-1 text-sm font-medium text-texto-suave transition-colors hover:text-texto"
        >
          <ChevronDown
            className={cn("size-4 transition-transform", masOpciones && "rotate-180")}
            aria-hidden
          />
          Más opciones
        </button>

        {masOpciones && (
          <div className="mt-3 space-y-4">
            {!esIngreso && creditos.length > 0 && (
              <Campo
                etiqueta="Asociar a un crédito"
                htmlFor="credito"
                ayuda="El pago se descuenta del saldo pendiente de ese crédito."
              >
                <Seleccion id="credito" {...register("loanId")}>
                  <option value="">Ninguno</option>
                  {creditos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </Seleccion>
              </Campo>
            )}

            <Campo etiqueta="Notas" htmlFor="notas" error={errors.notas?.message}>
              <AreaTexto
                id="notas"
                placeholder="Cualquier detalle que quieras recordar"
                {...register("notas")}
              />
            </Campo>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        {editando && (
          <Boton type="button" variante="contorno" tamano="lg" onClick={borrar} aria-label="Eliminar movimiento">
            <Trash2 className="text-egreso" aria-hidden />
          </Boton>
        )}
        <Boton
          type="submit"
          tamano="lg"
          variante={esIngreso ? "ingreso" : "peligro"}
          className="flex-1"
          cargando={isSubmitting}
        >
          {editando ? "Guardar cambios" : esIngreso ? "Registrar ingreso" : "Registrar gasto"}
        </Boton>
      </div>
    </form>
  );
}
