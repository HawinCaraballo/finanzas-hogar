import type { Metadata } from "next";
import { GestorCreditos } from "@/components/creditos/gestor-creditos";
import { listarCreditos } from "@/server/creditos";
import { categoriasDelHogar } from "@/server/movimientos";

export const metadata: Metadata = { title: "Créditos" };

export default async function PaginaCreditos() {
  const [creditos, categorias] = await Promise.all([listarCreditos(), categoriasDelHogar()]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-heading-sm font-medium text-texto">Créditos</h1>
        <p className="text-sm text-texto-suave">
          Cuánto llevas pagado y cuánto falta. Cada cuota se registra como un gasto normal.
        </p>
      </header>

      <GestorCreditos creditos={creditos} categorias={categorias} />
    </div>
  );
}
