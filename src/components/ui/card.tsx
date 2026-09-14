import * as React from "react";
import { cn } from "@/lib/utils";

/*
  Tarjeta del manual: superficie blanca, borde Mist de 1 px, radio de 24 px,
  relleno de 24 px y una única sombra suave teñida de lavanda. Nada de sombras
  duras ni de pilas de elevación.
*/
export function Tarjeta({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-app border border-borde bg-superficie shadow-suave dark:shadow-black/40", className)}
      {...props}
    />
  );
}

export function TarjetaEncabezado({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-start justify-between gap-4 p-5 pb-3 sm:p-6 sm:pb-3", className)}
      {...props}
    />
  );
}

export function TarjetaTitulo({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-body font-medium text-texto", className)} {...props} />;
}

export function TarjetaDescripcion({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-caption text-texto-suave", className)} {...props} />;
}

export function TarjetaContenido({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-3 sm:p-6 sm:pt-3", className)} {...props} />;
}
