import * as React from "react";
import { cn } from "@/lib/utils";

/*
  La tarjeta del manual: fondo blanco, radio de 10 px, relleno de 32 px y —la
  seña de identidad— una línea de 1 px hacia dentro en lugar de sombra. Es lo
  que le da al conjunto el aire de estar impreso sobre papel.
*/
export function Tarjeta({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-app bg-superficie hairline", className)} {...props} />;
}

export function TarjetaEncabezado({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-start justify-between gap-4 p-5 pb-3 sm:p-6 sm:pb-4", className)}
      {...props}
    />
  );
}

export function TarjetaTitulo({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-subheading font-medium text-texto", className)} {...props} />;
}

export function TarjetaDescripcion({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-caption text-texto-suave", className)} {...props} />;
}

export function TarjetaContenido({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-3 sm:p-6 sm:pt-4", className)} {...props} />;
}
