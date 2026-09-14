"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, Moon, Sun, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { salir } from "@/server/cuentas";

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function MenuUsuario({
  nombre,
  email,
  className,
}: {
  nombre: string;
  email: string;
  className?: string;
}) {
  const [oscuro, setOscuro] = useState(false);

  // El tema real ya lo aplicó el script del layout; aquí solo se sincroniza.
  useEffect(() => {
    setOscuro(document.documentElement.classList.contains("dark"));
  }, []);

  function alternarTema() {
    const siguiente = !oscuro;
    setOscuro(siguiente);
    document.documentElement.classList.toggle("dark", siguiente);
    try {
      localStorage.setItem("tema", siguiente ? "oscuro" : "claro");
    } catch {
      // Navegación privada: el tema simplemente no se recuerda.
    }
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full bg-superficie-2 text-xs font-semibold text-texto transition-colors hover:bg-borde",
          className,
        )}
        aria-label="Tu cuenta"
      >
        {iniciales(nombre) || <UserRound className="size-4" aria-hidden />}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-56 rounded-app border border-borde bg-superficie p-1 shadow-lg"
        >
          <div className="px-2 py-2">
            <p className="truncate text-sm font-medium text-texto">{nombre}</p>
            <p className="truncate text-xs text-texto-suave">{email}</p>
          </div>

          <DropdownMenu.Separator className="my-1 h-px bg-borde" />

          <DropdownMenu.Item
            onSelect={(e) => {
              // Sin esto el menú se cierra antes de que se vea el cambio.
              e.preventDefault();
              alternarTema();
            }}
            className="flex cursor-pointer items-center gap-2 rounded-[0.5rem] px-2 py-2 text-sm text-texto outline-none data-[highlighted]:bg-superficie-2"
          >
            {oscuro ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
            {oscuro ? "Tema claro" : "Tema oscuro"}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-borde" />

          {/*
            Sin el preventDefault, Radix cierra el menú en cuanto se pulsa y
            React desmonta este formulario ANTES de que el navegador despache el
            submit: un formulario fuera del documento no envía nada, y la sesión
            no se cerraba. Al no cerrar el menú, el submit llega y signOut
            redirige a /login.
          */}
          <DropdownMenu.Item asChild onSelect={(e) => e.preventDefault()}>
            <form action={salir}>
              <button
                type="submit"
                className="flex w-full cursor-pointer items-center gap-2 rounded-[0.5rem] px-2 py-2 text-sm text-egreso outline-none data-[highlighted]:bg-superficie-2"
              >
                <LogOut className="size-4" aria-hidden />
                Cerrar sesión
              </button>
            </form>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
