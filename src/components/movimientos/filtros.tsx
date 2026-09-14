"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Entrada, Seleccion } from "@/components/ui/campos";
import type { CategoriaVista, MiembroVista } from "@/lib/tipos";
import { cn } from "@/lib/utils";

/**
 * Filtros de la lista. Todos viven en la URL, así que el botón "atrás" del
 * navegador funciona y un filtro se puede compartir tal cual.
 */
export function FiltrosMovimientos({
  categorias,
  miembros,
  usuarioActualId,
  tipo,
  categoryId,
  quien,
  texto,
}: {
  categorias: CategoriaVista[];
  miembros: MiembroVista[];
  usuarioActualId: string;
  tipo: string;
  categoryId: string;
  quien: string;
  texto: string;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const [busqueda, setBusqueda] = useState(texto);

  function aplicar(cambios: Record<string, string>) {
    const siguientes = new URLSearchParams(params);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) siguientes.set(clave, valor);
      else siguientes.delete(clave);
    }
    siguientes.delete("pagina");
    router.push(`${ruta}?${siguientes.toString()}`, { scroll: false });
  }

  // La búsqueda espera a que el usuario deje de escribir para no lanzar una
  // consulta por cada tecla.
  useEffect(() => {
    if (busqueda === texto) return;
    const id = setTimeout(() => aplicar({ q: busqueda }), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  useEffect(() => setBusqueda(texto), [texto]);

  const opciones = categorias.filter(
    (c) => tipo === "TODOS" || c.type === tipo,
  );
  const hayFiltros = tipo !== "TODOS" || categoryId !== "" || quien !== "" || texto !== "";

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-texto-suave"
          aria-hidden
        />
        <Entrada
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por descripción o notas"
          aria-label="Buscar movimientos"
          className="pl-9"
          type="search"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          role="radiogroup"
          aria-label="Tipo"
          className="flex gap-1 rounded-pastilla bg-superficie-2 p-1"
        >
          {(
            [
              { valor: "TODOS", etiqueta: "Todos" },
              { valor: "INGRESO", etiqueta: "Ingresos" },
              { valor: "EGRESO", etiqueta: "Gastos" },
            ] as const
          ).map((op) => (
            <button
              key={op.valor}
              type="button"
              role="radio"
              aria-checked={tipo === op.valor}
              onClick={() => aplicar({ tipo: op.valor === "TODOS" ? "" : op.valor, categoria: "" })}
              className={cn(
                "h-8 rounded-pastilla px-3 text-micro font-medium transition-colors",
                tipo === op.valor
                  ? "bg-superficie text-texto shadow-sm"
                  : "text-texto-suave hover:text-texto",
              )}
            >
              {op.etiqueta}
            </button>
          ))}
        </div>

        <Seleccion
          value={categoryId}
          onChange={(e) => aplicar({ categoria: e.target.value })}
          aria-label="Categoría"
          className="h-9 w-auto min-w-44 text-caption"
        >
          <option value="">Todas las categorías</option>
          {opciones.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Seleccion>

        {miembros.length > 1 && (
          <Seleccion
            value={quien}
            onChange={(e) => aplicar({ quien: e.target.value })}
            aria-label="Quién pagó o recibió"
            className="h-9 w-auto min-w-40 text-caption"
          >
            <option value="">Cualquier persona</option>
            {miembros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id === usuarioActualId ? `${m.nombre} (yo)` : m.nombre}
              </option>
            ))}
          </Seleccion>
        )}

        {hayFiltros && (
          <button
            type="button"
            onClick={() => aplicar({ tipo: "", categoria: "", quien: "", q: "" })}
            className="flex h-9 items-center gap-1 rounded-pastilla px-2.5 text-micro font-medium text-texto-suave transition-colors hover:bg-superficie-2 hover:text-texto"
          >
            <X className="size-3.5" aria-hidden />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
