import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/*
  El manual solo admite dos píldoras: la oscura (#121212, el único momento de
  negro del sistema) y la de arena, más clara que el lienzo. Las etiquetas van
  en Inter 600, que es el peso que reserva para lo que se puede pulsar.
*/
const botonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-boton font-semibold transition-colors select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variante: {
        principal: "bg-marca text-marca-texto hover:opacity-90",
        // La píldora de arena: el par tonal de la oscura, sin borde.
        secundario: "bg-superficie-2 text-texto hover:opacity-80",
        contorno: "bg-superficie text-texto hairline hover:bg-superficie-2",
        fantasma: "bg-transparent text-texto-suave hover:bg-superficie-2 hover:text-texto",
        peligro: "bg-peligro text-white hover:opacity-90",
        ingreso: "bg-ingreso text-white hover:opacity-90",
      },
      tamano: {
        // 44 px de alto mínimo: el tamaño táctil cómodo en móvil.
        sm: "h-9 px-4 text-micro [&_svg]:size-4",
        md: "h-11 px-5 text-caption [&_svg]:size-4",
        lg: "h-12 px-6 text-body [&_svg]:size-5",
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
