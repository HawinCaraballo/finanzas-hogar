"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, ArchiveRestore, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Boton } from "@/components/ui/button";
import { Campo, Entrada, Seleccion } from "@/components/ui/campos";
import { Dialogo, DialogoContenido } from "@/components/ui/dialog";
import { Tarjeta } from "@/components/ui/card";
import { EstadoVacio, Insignia } from "@/components/ui/varios";
import { COLORES, NOMBRES_ICONOS, iconoPorNombre } from "@/lib/iconos";
import type { CategoriaVista } from "@/lib/tipos";
import { cn } from "@/lib/utils";
import { categoriaSchema, type CategoriaInput } from "@/lib/validaciones";
import { archivarCategoria, eliminarCategoria, guardarCategoria } from "@/server/categorias";

export function GestorCategorias({
  categorias,
  uso,
}: {
  categorias: CategoriaVista[];
  uso: Record<string, number>;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<CategoriaVista | "nueva" | null>(null);
  const [verArchivadas, setVerArchivadas] = useState(false);

  const visibles = categorias.filter((c) => verArchivadas || !c.archivada);
  const egresos = visibles.filter((c) => c.type === "EGRESO");
  const ingresos = visibles.filter((c) => c.type === "INGRESO");
  const archivadas = categorias.filter((c) => c.archivada).length;

  async function alternarArchivo(c: CategoriaVista) {
    const res = await archivarCategoria(c.id, !c.archivada);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(c.archivada ? "Categoría restaurada." : "Categoría archivada.");
    router.refresh();
  }

  async function borrar(c: CategoriaVista) {
    const res = await eliminarCategoria(c.id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Categoría eliminada.");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Boton onClick={() => setEditando("nueva")}>
          <Plus aria-hidden />
          Nueva categoría
        </Boton>
        {archivadas > 0 && (
          <button
            type="button"
            onClick={() => setVerArchivadas((v) => !v)}
            className="text-xs font-medium text-marca-fuerte hover:underline"
          >
            {verArchivadas ? "Ocultar" : "Ver"} archivadas ({archivadas})
          </button>
        )}
      </div>

      {categorias.length === 0 ? (
        <Tarjeta>
          <EstadoVacio
            icono={Tags}
            titulo="Sin categorías"
            descripcion="Crea la primera para poder clasificar tus movimientos."
          />
        </Tarjeta>
      ) : (
        <>
          <Grupo
            titulo="Gastos"
            categorias={egresos}
            uso={uso}
            onEditar={setEditando}
            onArchivar={alternarArchivo}
            onBorrar={borrar}
          />
          <Grupo
            titulo="Ingresos"
            categorias={ingresos}
            uso={uso}
            onEditar={setEditando}
            onArchivar={alternarArchivo}
            onBorrar={borrar}
          />
        </>
      )}

      <Dialogo open={editando !== null} onOpenChange={(a) => !a && setEditando(null)}>
        {editando && (
          <DialogoContenido
            titulo={editando === "nueva" ? "Nueva categoría" : "Editar categoría"}
            descripcion="El ícono y el color te ayudan a reconocerla de un vistazo."
          >
            <FormularioCategoria
              categoria={editando === "nueva" ? undefined : editando}
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

function Grupo({
  titulo,
  categorias,
  uso,
  onEditar,
  onArchivar,
  onBorrar,
}: {
  titulo: string;
  categorias: CategoriaVista[];
  uso: Record<string, number>;
  onEditar: (c: CategoriaVista) => void;
  onArchivar: (c: CategoriaVista) => void;
  onBorrar: (c: CategoriaVista) => void;
}) {
  if (categorias.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-texto">{titulo}</h2>
      <Tarjeta className="overflow-hidden">
        <ul className="divide-y divide-borde">
          {categorias.map((c) => {
            const Icono = iconoPorNombre(c.icon);
            const usos = uso[c.id] ?? 0;
            return (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-full"
                  style={{ backgroundColor: `${c.color}1f`, color: c.color }}
                >
                  <Icono className="size-4" aria-hidden />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "truncate text-sm font-medium",
                        c.archivada ? "text-texto-suave line-through" : "text-texto",
                      )}
                    >
                      {c.nombre}
                    </span>
                    {c.archivada && <Insignia>Archivada</Insignia>}
                  </span>
                  <span className="block text-xs text-texto-suave">
                    {usos === 0
                      ? "Sin movimientos"
                      : `${usos} ${usos === 1 ? "movimiento" : "movimientos"}`}
                  </span>
                </span>

                <div className="flex shrink-0 items-center gap-0.5">
                  <Boton
                    variante="fantasma"
                    tamano="iconoSm"
                    onClick={() => onEditar(c)}
                    aria-label={`Editar ${c.nombre}`}
                  >
                    <Pencil aria-hidden />
                  </Boton>
                  <Boton
                    variante="fantasma"
                    tamano="iconoSm"
                    onClick={() => onArchivar(c)}
                    aria-label={`${c.archivada ? "Restaurar" : "Archivar"} ${c.nombre}`}
                  >
                    {c.archivada ? <ArchiveRestore aria-hidden /> : <Archive aria-hidden />}
                  </Boton>
                  {usos === 0 && (
                    <Boton
                      variante="fantasma"
                      tamano="iconoSm"
                      onClick={() => onBorrar(c)}
                      aria-label={`Eliminar ${c.nombre}`}
                    >
                      <Trash2 className="text-egreso" aria-hidden />
                    </Boton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Tarjeta>
    </section>
  );
}

function FormularioCategoria({
  categoria,
  onListo,
}: {
  categoria?: CategoriaVista;
  onListo: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoriaInput>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: categoria
      ? {
          id: categoria.id,
          nombre: categoria.nombre,
          type: categoria.type,
          icon: categoria.icon,
          color: categoria.color,
        }
      : { nombre: "", type: "EGRESO", icon: "Tag", color: "#64748b" },
  });

  const icono = watch("icon");
  const color = watch("color");

  const enviar = handleSubmit(async (valores) => {
    const res = await guardarCategoria(valores);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(categoria ? "Categoría actualizada." : "Categoría creada.");
    onListo();
  });

  const IconoElegido = iconoPorNombre(icono);

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <div className="flex items-center gap-3">
        <span
          className="grid size-12 shrink-0 place-items-center rounded-full"
          style={{ backgroundColor: `${color}1f`, color }}
        >
          <IconoElegido className="size-5" aria-hidden />
        </span>
        <div className="flex-1">
          <Campo etiqueta="Nombre" htmlFor="nombre-cat" error={errors.nombre?.message}>
            <Entrada id="nombre-cat" placeholder="Mercado" {...register("nombre")} />
          </Campo>
        </div>
      </div>

      <Campo etiqueta="Tipo" htmlFor="tipo-cat" error={errors.type?.message}>
        <Seleccion id="tipo-cat" {...register("type")}>
          <option value="EGRESO">Gasto</option>
          <option value="INGRESO">Ingreso</option>
        </Seleccion>
      </Campo>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-texto">Color</legend>
        <div className="flex flex-wrap gap-2">
          {COLORES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setValue("color", c)}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              className={cn(
                "size-8 rounded-full transition-transform",
                color === c && "ring-2 ring-marca ring-offset-2 ring-offset-superficie",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-texto">Ícono</legend>
        <div className="scrollbar-fina grid max-h-40 grid-cols-6 gap-1.5 overflow-y-auto rounded-panel border border-borde p-2 sm:grid-cols-8">
          {NOMBRES_ICONOS.map((nombre) => {
            const Icono = iconoPorNombre(nombre);
            return (
              <button
                key={nombre}
                type="button"
                onClick={() => setValue("icon", nombre)}
                aria-label={nombre}
                aria-pressed={icono === nombre}
                className={cn(
                  "grid size-9 place-items-center rounded-campo transition-colors",
                  icono === nombre
                    ? "bg-marca-suave text-marca-fuerte"
                    : "text-texto-suave hover:bg-superficie-2",
                )}
              >
                <Icono className="size-4" aria-hidden />
              </button>
            );
          })}
        </div>
      </fieldset>

      <Boton type="submit" className="w-full" tamano="lg" cargando={isSubmitting}>
        {categoria ? "Guardar cambios" : "Crear categoría"}
      </Boton>
    </form>
  );
}
