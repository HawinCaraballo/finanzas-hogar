import type { Metadata } from "next";
import { GestorRecurrentes } from "@/components/recurrentes/gestor-recurrentes";
import { categoriasDelHogar } from "@/server/movimientos";
import { listarRecurrentes } from "@/server/recurrentes";

export const metadata: Metadata = { title: "Recurrentes" };

// La lista pone al día las reglas atrasadas, así que nunca se cachea.
export const dynamic = "force-dynamic";

export default async function PaginaRecurrentes() {
  const [reglas, categorias] = await Promise.all([listarRecurrentes(), categoriasDelHogar()]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-heading-sm font-medium text-texto">Movimientos recurrentes</h1>
        <p className="text-sm text-texto-suave">
          Lo que se repite cada mes se registra solo: arriendo, servicios, cuotas.
        </p>
      </header>

      <GestorRecurrentes reglas={reglas} categorias={categorias} />
    </div>
  );
}
