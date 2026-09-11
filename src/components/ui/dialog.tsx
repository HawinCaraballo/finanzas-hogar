"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialogo = DialogPrimitive.Root;
export const DialogoDisparador = DialogPrimitive.Trigger;
export const DialogoCerrar = DialogPrimitive.Close;

/**
 * Marca el campo que debe recibir el foco al abrir el diálogo.
 * Sin esto Radix enfoca el primer elemento que encuentra, que en un formulario
 * largo puede ser un botón a mitad de la lista y deja el diálogo desplazado.
 */
export const FOCO_INICIAL = "data-foco-inicial";

export function DialogoContenido({
  className,
  children,
  titulo,
  descripcion,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  titulo: string;
  descripcion?: string;
}) {
  const contenido = React.useRef<HTMLDivElement>(null);

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        ref={contenido}
        onOpenAutoFocus={(evento) => {
          evento.preventDefault();
          const nodo = contenido.current;
          if (!nodo) return;
          // El diálogo siempre empieza arriba, aunque el formulario sea largo.
          nodo.querySelector<HTMLElement>("[data-scroll]")?.scrollTo({ top: 0 });
          const inicial = nodo.querySelector<HTMLElement>(`[${FOCO_INICIAL}]`);
          (inicial ?? nodo).focus({ preventScroll: true });
        }}
        className={cn(
          // En móvil sube desde abajo ocupando el ancho; en escritorio es un panel centrado.
          "fixed z-50 flex flex-col bg-superficie shadow-xl outline-none",
          "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-2xl",
          "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-app sm:border sm:border-borde",
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b border-borde p-4 sm:p-5">
          <div className="min-w-0">
            <DialogPrimitive.Title className="text-base font-semibold text-texto">
              {titulo}
            </DialogPrimitive.Title>
            {descripcion ? (
              <DialogPrimitive.Description className="mt-0.5 text-xs text-texto-suave">
                {descripcion}
              </DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{titulo}</DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close
            className="-m-1 rounded-app p-2 text-texto-suave transition-colors hover:bg-superficie-2 hover:text-texto"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        </div>

        <div
          data-scroll
          className="scrollbar-fina overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5"
        >
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
