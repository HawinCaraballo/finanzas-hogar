import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/*
  La píldora es la firma del sistema: el manual la marca como innegociable, así
  que todos los botones salen con radio completo. Peso 500, nunca menos, y
  relleno sólido — el manual evita el patrón "contorno primero".
*/
const botonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-boton font-medium transition-colors select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variante: {
        principal: "bg-marca text-marca-texto hover:opacity-90",
        // La secundaria del manual es contorno fino sobre transparente.
        secundario: "border border-texto-suave bg-transparent text-texto hover:bg-superficie-2",
        contorno: "border border-borde bg-transparent text-texto hover:bg-superficie-2",
        fantasma: "bg-transparent text-texto-suave hover:bg-superficie-2 hover:text-texto",
        peligro: "bg-egreso text-white hover:opacity-90",
        ingreso: "bg-ingreso text-white hover:opacity-90",
      },
      tamano: {
        // 44 px de alto mínimo en móvil; el relleno horizontal es generoso
        // (24 px en la medida principal) como pide la densidad "cómoda".
        sm: "h-9 px-4 text-caption [&_svg]:size-4",
        md: "h-11 px-6 text-body-sm [&_svg]:size-4",
        lg: "h-12 px-8 text-body [&_svg]:size-5",
        icono: "size-11 [&_svg]:size-5",
        iconoSm: "size-9 [&_svg]:size-4",
      },
    },
    defaultVariants: { variante: "principal", tamano: "md" },
  },
);

export interface BotonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof botonVariants> {
  asChild?: boolean;
  cargando?: boolean;
}

export const Boton = React.forwardRef<HTMLButtonElement, BotonProps>(
  ({ className, variante, tamano, asChild, cargando, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(botonVariants({ variante, tamano }), className)}
        disabled={disabled || cargando}
        {...props}
      >
        {cargando ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Boton.displayName = "Boton";

export { botonVariants };
