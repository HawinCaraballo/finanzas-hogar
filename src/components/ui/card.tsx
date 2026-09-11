import * as React from "react";
import { cn } from "@/lib/utils";

export function Tarjeta({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-app border border-borde bg-superficie", className)}
      {...props}
    />
  );
}

export function TarjetaEncabezado({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-3 p-4 pb-2 sm:p-5 sm:pb-3", className)} {...props} />;
}

export function TarjetaTitulo({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-sm font-semibold text-texto", className)} {...props} />;
}

export function TarjetaDescripcion({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-texto-suave", className)} {...props} />;
}

export function TarjetaContenido({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pt-2 sm:p-5 sm:pt-3", className)} {...props} />;
}
