import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Insignia({
  className,
  tono = "neutro",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tono?: "neutro" | "marca" | "ingreso" | "egreso" | "alerta";
}) {
  const tonos = {
    neutro: "bg-superficie-2 text-texto-suave",
    marca: "bg-marca-suave text-marca",
    ingreso: "bg-ingreso-suave text-ingreso",
    egreso: "bg-egreso-suave text-egreso",
    alerta: "bg-alerta/15 text-alerta",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        tonos[tono],
        className,
      )}
      {...props}
    />
  );
}

export function Barra({
  porcentaje,
  color = "bg-marca",
  className,
  etiqueta,
}: {
  porcentaje: number;
  color?: string;
  className?: string;
  etiqueta?: string;
}) {
  const ancho = Math.min(100, Math.max(0, porcentaje));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-superficie-2", className)}
      role="progressbar"
      aria-valuenow={Math.round(porcentaje)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={etiqueta}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", color)}
        style={{ width: `${ancho}%` }}
      />
    </div>
  );
}

export function EstadoVacio({
  icono: Icono,
  titulo,
  descripcion,
  children,
}: {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-superficie-2 text-texto-suave">
        <Icono className="size-5" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-texto">{titulo}</p>
        <p className="mx-auto max-w-xs text-sm text-texto-suave">{descripcion}</p>
      </div>
      {children}
    </div>
  );
}

export function Separador({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-borde", className)} role="separator" />;
}

/** Punto de color de una categoría, con su ícono. */
export function PuntoCategoria({
  color,
  children,
  className,
}: {
  color: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("grid size-9 shrink-0 place-items-center rounded-full", className)}
      style={{ backgroundColor: `${color}1f`, color }}
    >
      {children}
    </span>
  );
}
