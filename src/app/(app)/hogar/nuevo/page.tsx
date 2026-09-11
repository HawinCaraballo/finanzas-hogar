import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FormularioHogar } from "@/components/hogar/formulario-hogar";
import { Tarjeta, TarjetaContenido } from "@/components/ui/card";

export const metadata: Metadata = { title: "Nuevo hogar" };

export default function PaginaNuevoHogar() {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <Link
        href="/hogar"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-texto-suave transition-colors hover:text-texto"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver
      </Link>

      <header>
        <h1 className="text-xl font-semibold tracking-tight text-texto">Crear otro hogar</h1>
        <p className="text-sm text-texto-suave">
          Útil si administras más de una casa. Cada hogar tiene sus propias categorías,
          movimientos y miembros.
        </p>
      </header>

      <Tarjeta>
        <TarjetaContenido className="pt-4 sm:pt-5">
          <FormularioHogar modo="crear" />
        </TarjetaContenido>
      </Tarjeta>
    </div>
  );
}
