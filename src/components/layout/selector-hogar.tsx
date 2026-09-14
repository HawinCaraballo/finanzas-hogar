"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronsUpDown, House, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { Hogar } from "@/lib/auth/guard";
import { cn } from "@/lib/utils";
import { cambiarHogar } from "@/server/hogares";

/**
 * Cambia el hogar activo. Todos los datos de la app se filtran por él, así que
 * este menú es el control más importante de la barra superior.
 */
export function SelectorHogar({
  hogares,
  activo,
  className,
}: {
  hogares: Hogar[];
  activo: Hogar;
  className?: string;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();

  function elegir(id: string) {
    if (id === activo.id) return;
    iniciar(async () => {
      const res = await cambiarHogar(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  const unico = hogares.length === 1;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          "flex min-w-0 items-center gap-2 rounded-campo px-2 py-1.5 text-left transition-colors hover:bg-superficie-2 disabled:opacity-60",
          className,
        )}
        disabled={pendiente}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-campo bg-marca-suave text-marca-fuerte">
          <House className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-texto">{activo.nombre}</span>
          <span className="block text-[11px] text-texto-suave">
            {unico ? activo.currency : `${hogares.length} hogares`}
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-texto-suave" aria-hidden />
        <span className="sr-only">Cambiar de hogar</span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 min-w-56 rounded-panel border border-borde bg-superficie p-1 shadow-flotante"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-texto-suave">
            Tus hogares
          </DropdownMenu.Label>

          {hogares.map((h) => (
            <DropdownMenu.Item
              key={h.id}
              onSelect={() => elegir(h.id)}
              className="flex cursor-pointer items-center gap-2 rounded-campo px-2 py-2 text-sm text-texto outline-none data-[highlighted]:bg-superficie-2"
            >
              <span className="min-w-0 flex-1 truncate">{h.nombre}</span>
              <span className="text-[11px] text-texto-suave">{h.currency}</span>
              {h.id === activo.id && <Check className="size-4 text-marca-fuerte" aria-hidden />}
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="my-1 h-px bg-borde" />

          <DropdownMenu.Item asChild>
            <a
              href="/hogar/nuevo"
              className="flex cursor-pointer items-center gap-2 rounded-campo px-2 py-2 text-sm text-texto outline-none data-[highlighted]:bg-superficie-2"
            >
              <Plus className="size-4" aria-hidden />
              Crear otro hogar
            </a>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
