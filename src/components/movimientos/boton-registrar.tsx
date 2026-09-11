"use client";

import { Plus } from "lucide-react";
import { Boton, type BotonProps } from "@/components/ui/button";
import { useMovimiento } from "./proveedor-movimiento";

/** Abre el formulario de movimientos desde cualquier pantalla. */
export function BotonRegistrar({
  tipo,
  children = "Registrar movimiento",
  ...props
}: { tipo?: "INGRESO" | "EGRESO" } & Omit<BotonProps, "onClick">) {
  const { registrar } = useMovimiento();
  return (
    <Boton onClick={() => registrar(tipo)} {...props}>
      <Plus aria-hidden />
      {children}
    </Boton>
  );
}
