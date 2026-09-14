"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, Plus } from "lucide-react";
import { useMovimiento } from "@/components/movimientos/proveedor-movimiento";
import type { Hogar } from "@/lib/auth/guard";
import { NAVEGACION, NAVEGACION_MOVIL, esRutaActiva } from "@/lib/navegacion";
import { cn } from "@/lib/utils";
import { MenuUsuario } from "./menu-usuario";
import { SelectorHogar } from "./selector-hogar";

/** Barra superior del móvil: identidad del hogar y acceso a la cuenta. */
export function BarraSuperiorMovil({
  hogares,
  hogar,
  usuario,
}: {
  hogares: Hogar[];
  hogar: Hogar;
  usuario: { nombre: string; email: string };
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-borde bg-superficie/90 px-3 py-2 backdrop-blur md:hidden">
      <SelectorHogar hogares={hogares} activo={hogar} className="min-w-0 flex-1" />
      <MenuUsuario nombre={usuario.nombre} email={usuario.email} />
    </header>
  );
}

/**
 * Barra inferior del móvil. El botón de registrar va al centro, que es donde
 * llega el pulgar sin estirar la mano.
 */
export function NavegacionMovil() {
  const ruta = usePathname();
  const { registrar } = useMovimiento();

  const principales = NAVEGACION.filter((i) => NAVEGACION_MOVIL.includes(i.href));
  const izquierda = principales.slice(0, 2);
  const derecha = principales.slice(2);
  const resto = NAVEGACION.filter((i) => !NAVEGACION_MOVIL.includes(i.href));
  const restoActivo = resto.some((i) => esRutaActiva(ruta, i.href));

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-borde bg-superficie/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="grid grid-cols-5 items-end">
        {izquierda.map((item) => (
          <EnlaceMovil key={item.href} item={item} activo={esRutaActiva(ruta, item.href)} />
        ))}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => registrar()}
            className="-mt-5 grid size-14 place-items-center rounded-full bg-marca text-marca-texto shadow-flotante transition-transform active:scale-95"
            aria-label="Registrar movimiento"
          >
            <Plus className="size-6" aria-hidden />
          </button>
        </div>

        {derecha.map((item) => (
          <EnlaceMovil key={item.href} item={item} activo={esRutaActiva(ruta, item.href)} />
        ))}

        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            className={cn(
              "flex h-14 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
              restoActivo ? "text-marca-fuerte" : "text-texto-suave",
            )}
          >
            <MoreHorizontal className="size-5" aria-hidden />
            Más
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="top"
              align="end"
              sideOffset={10}
              className="z-50 mr-2 min-w-48 rounded-panel border border-borde bg-superficie p-1 shadow-flotante"
            >
              {resto.map((item) => (
                <DropdownMenu.Item key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-campo px-3 py-2.5 text-sm outline-none data-[highlighted]:bg-superficie-2",
                      esRutaActiva(ruta, item.href) ? "text-marca-fuerte" : "text-texto",
                    )}
                  >
                    <item.icono className="size-4" aria-hidden />
                    {item.etiqueta}
                  </Link>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </nav>
  );
}

function EnlaceMovil({
  item,
  activo,
}: {
  item: (typeof NAVEGACION)[number];
  activo: boolean;
}) {
  return (
    <Link
      href={item.href}
      aria-current={activo ? "page" : undefined}
      className={cn(
        "flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
        activo ? "text-marca-fuerte" : "text-texto-suave",
      )}
    >
      <item.icono className="size-5" aria-hidden />
      {item.etiqueta}
    </Link>
  );
}
