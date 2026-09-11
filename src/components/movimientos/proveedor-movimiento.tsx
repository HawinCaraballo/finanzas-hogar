"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Dialogo, DialogoContenido } from "@/components/ui/dialog";
import type { CategoriaVista, CreditoVista, MovimientoVista } from "@/lib/tipos";
import { FormularioMovimiento } from "./formulario-movimiento";

type Estado =
  | { modo: "cerrado" }
  | { modo: "nuevo"; tipo: "INGRESO" | "EGRESO" }
  | { modo: "editar"; movimiento: MovimientoVista };

type Api = {
  registrar: (tipo?: "INGRESO" | "EGRESO") => void;
  editar: (movimiento: MovimientoVista) => void;
};

const ContextoMovimiento = createContext<Api | null>(null);

/**
 * Deja el formulario de movimientos disponible desde cualquier parte de la app
 * (el botón flotante, la lista, el dashboard) sin duplicarlo en cada pantalla.
 */
export function ProveedorMovimiento({
  categorias,
  creditos,
  children,
}: {
  categorias: CategoriaVista[];
  creditos: CreditoVista[];
  children: React.ReactNode;
}) {
  const [estado, setEstado] = useState<Estado>({ modo: "cerrado" });

  const api = useMemo<Api>(
    () => ({
      registrar: (tipo = "EGRESO") => setEstado({ modo: "nuevo", tipo }),
      editar: (movimiento) => setEstado({ modo: "editar", movimiento }),
    }),
    [],
  );

  const cerrar = useCallback(() => setEstado({ modo: "cerrado" }), []);

  return (
    <ContextoMovimiento.Provider value={api}>
      {children}

      <Dialogo open={estado.modo !== "cerrado"} onOpenChange={(abierto) => !abierto && cerrar()}>
        {estado.modo !== "cerrado" && (
          <DialogoContenido
            titulo={estado.modo === "editar" ? "Editar movimiento" : "Registrar movimiento"}
            descripcion={
              estado.modo === "editar"
                ? "Corrige lo que haga falta o elimínalo."
                : "Elige si entra o sale dinero y completa los datos."
            }
          >
            <FormularioMovimiento
              categorias={categorias}
              creditos={creditos}
              movimiento={estado.modo === "editar" ? estado.movimiento : undefined}
              tipoInicial={estado.modo === "nuevo" ? estado.tipo : undefined}
              onListo={cerrar}
            />
          </DialogoContenido>
        )}
      </Dialogo>
    </ContextoMovimiento.Provider>
  );
}

export function useMovimiento(): Api {
  const api = useContext(ContextoMovimiento);
  if (!api) {
    throw new Error("useMovimiento debe usarse dentro de ProveedorMovimiento.");
  }
  return api;
}
