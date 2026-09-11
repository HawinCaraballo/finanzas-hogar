"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const baseCampo =
  "w-full rounded-app border border-borde bg-superficie px-3 text-texto placeholder:text-texto-suave/70 transition-colors focus:border-marca focus:outline-none disabled:opacity-60";

export const Etiqueta = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("text-sm font-medium text-texto", className)}
    {...props}
  />
));
Etiqueta.displayName = "Etiqueta";

export const Entrada = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(baseCampo, "h-11", className)} {...props} />
  ),
);
Entrada.displayName = "Entrada";

export const AreaTexto = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(baseCampo, "min-h-20 py-2.5", className)} {...props} />
));
AreaTexto.displayName = "AreaTexto";

/**
 * Select nativo. En móvil abre la rueda del sistema, que se usa mejor que
 * cualquier menú personalizado.
 */
export const Seleccion = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(baseCampo, "h-11 appearance-none pr-9", className)}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-texto-suave"
      aria-hidden
    />
  </div>
));
Seleccion.displayName = "Seleccion";

/** Agrupa etiqueta, campo, ayuda y error con el espaciado y el aria correctos. */
export function Campo({
  etiqueta,
  htmlFor,
  error,
  ayuda,
  children,
  className,
}: {
  etiqueta: string;
  htmlFor: string;
  error?: string;
  ayuda?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const idError = `${htmlFor}-error`;
  const idAyuda = `${htmlFor}-ayuda`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Etiqueta htmlFor={htmlFor}>{etiqueta}</Etiqueta>
      {children}
      {ayuda && !error && (
        <p id={idAyuda} className="text-xs text-texto-suave">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} role="alert" className="text-xs font-medium text-egreso">
          {error}
        </p>
      )}
    </div>
  );
}
