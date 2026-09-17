import type { Metadata } from "next";
import { GestorCreditos } from "@/components/creditos/gestor-creditos";
import { requireHogar } from "@/lib/auth/guard";
import { listarCreditos } from "@/server/creditos";
import { miembrosDelHogar } from "@/server/hogares";
import { categoriasDelHogar } from "@/server/movimientos";

export const metadata: Metadata = { title: "Créditos" };

export default async function PaginaCreditos() {
  const ctx = await requireHogar();
  const [creditos, categorias, miembros] = await Promise.all([
    listarCreditos(),
    categoriasDelHogar(),
    miembrosDelHogar(),
  ]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-texto">Créditos</h1>
        <p className="text-sm text-texto-suave">
          Cuánto llevas pagado y cuánto falta. Cada cuota se registra como un gasto normal.
        </p>
      </header>

      <GestorCreditos
        creditos={creditos}
        categorias={categorias}
        miembros={miembros}
        usuarioActualId={ctx.user.id}
      />
    </div>
  );
}
