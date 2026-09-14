import type { Metadata } from "next";
import { GestorCategorias } from "@/components/categorias/gestor-categorias";
import { usoDeCategorias } from "@/server/categorias";
import { categoriasDelHogar } from "@/server/movimientos";

export const metadata: Metadata = { title: "Categorías" };

export default async function PaginaCategorias() {
  const [categorias, uso] = await Promise.all([categoriasDelHogar(false), usoDeCategorias()]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-heading font-medium text-texto">Categorías</h1>
        <p className="text-caption text-texto-suave">
          Con ellas se clasifican los movimientos y se arman los presupuestos y las gráficas.
        </p>
      </header>

      <GestorCategorias categorias={categorias} uso={uso} />
    </div>
  );
}
