import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * La escala tipográfica del manual usa nombres propios (text-body, text-caption,
 * text-heading-sm…). tailwind-merge solo conoce los de fábrica, así que sin esto
 * los toma por colores de texto y, al combinar "text-body-sm" con
 * "text-marca-texto" en un mismo componente, descarta uno de los dos.
 * Registrarlos como tamaños deja que convivan tamaño y color.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "caption",
            "body-sm",
            "body",
            "subheading",
            "heading-sm",
            "heading",
            "heading-lg",
            "display",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
