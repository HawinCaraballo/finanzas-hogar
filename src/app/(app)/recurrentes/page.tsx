import type { Metadata } from "next";
import { GestorRecurrentes } from "@/components/recurrentes/gestor-recurrentes";
import { requireHogar } from "@/lib/auth/guard";
import { miembrosDelHogar } from "@/server/hogares";
import { categoriasDelHogar } from "@/server/movimientos";
import { listarRecurrentes } from "@/server/recurrentes";

export const metadata: Metadata = { title: "Recurrentes" };

// La lista pone al día las reglas atrasadas, así que nunca se cachea.
export const dynamic = "force-dynamic";

export default async function PaginaRecurrentes() {
  const ctx = await requireHogar();
  const [reglas, categorias, miembros] = await Promise.all([
    listarRecurrentes(),
    categoriasDelHogar(),
    miembrosDelHogar(),
  ]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-texto">Movimientos recurrentes</h1>
        <p className="text-sm text-texto-suave">
          Lo que se repite cada mes se registra solo: arriendo, servicios, cuotas.
        </p>
      </header>

      <GestorRecurrentes
        reglas={reglas}
        categorias={categorias}
        miembros={miembros}
        usuarioActualId={ctx.user.id}
      />
    </div>
  );
}
