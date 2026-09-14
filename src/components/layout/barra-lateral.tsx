"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useMovimiento } from "@/components/movimientos/proveedor-movimiento";
import { Boton } from "@/components/ui/button";
import type { Hogar } from "@/lib/auth/guard";
import { NAVEGACION, esRutaActiva } from "@/lib/navegacion";
import { cn } from "@/lib/utils";
import { MenuUsuario } from "./menu-usuario";
import { SelectorHogar } from "./selector-hogar";

/** Navegación de escritorio. En móvil se reemplaza por la barra inferior. */
export function BarraLateral({
  hogares,
  hogar,
  usuario,
  esAdmin,
}: {
  hogares: Hogar[];
  hogar: Hogar;
  usuario: { nombre: string; email: string };
  esAdmin: boolean;
}) {
  const ruta = usePathname();
  const { registrar } = useMovimiento();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-borde bg-superficie md:flex">
      <div className="border-b border-borde p-3">
        <SelectorHogar hogares={hogares} activo={hogar} className="w-full" />
      </div>

      <div className="p-3">
        <Boton onClick={() => registrar()} className="w-full whitespace-nowrap px-4">
          <Plus aria-hidden />
          Registrar movimiento
        </Boton>
      </div>

      <nav aria-label="Secciones" className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        {NAVEGACION.filter((i) => !i.soloAdmin || esAdmin).map((item) => {
          const activo = esRutaActiva(ruta, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activo ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-campo px-3 py-2.5 text-sm font-medium transition-colors",
                activo
                  ? "bg-marca-suave text-marca-fuerte"
                  : "text-texto-suave hover:bg-superficie-2 hover:text-texto",
              )}
            >
              <item.icono className="size-4 shrink-0" aria-hidden />
              {item.etiqueta}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 border-t border-borde p-3">
        <MenuUsuario nombre={usuario.nombre} email={usuario.email} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-texto">{usuario.nombre}</p>
          <p className="truncate text-xs text-texto-suave">
            {esAdmin ? "Administrador" : "Miembro"}
          </p>
        </div>
      </div>
    </aside>
  );
}
