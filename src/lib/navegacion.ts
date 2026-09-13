import {
  ArrowLeftRight, ChartColumnBig, Landmark, LayoutDashboard, Repeat, Tags, Target,
  Users, type LucideIcon,
} from "lucide-react";

export type ItemNavegacion = {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
  /** Si es true solo se muestra a los administradores del hogar. */
  soloAdmin?: boolean;
};

export const NAVEGACION: ItemNavegacion[] = [
  { href: "/dashboard", etiqueta: "Inicio", icono: LayoutDashboard },
  { href: "/movimientos", etiqueta: "Movimientos", icono: ArrowLeftRight },
  { href: "/reportes", etiqueta: "Reportes", icono: ChartColumnBig },
  { href: "/presupuestos", etiqueta: "Presupuestos", icono: Target },
  { href: "/creditos", etiqueta: "Créditos", icono: Landmark },
  { href: "/recurrentes", etiqueta: "Recurrentes", icono: Repeat },
  { href: "/categorias", etiqueta: "Categorías", icono: Tags },
  { href: "/hogar", etiqueta: "Hogar", icono: Users },
];

/** Los dos accesos de cada lado del botón de registrar en la barra del móvil. */
export const NAVEGACION_MOVIL = ["/dashboard", "/movimientos", "/presupuestos"];

export function esRutaActiva(actual: string, href: string): boolean {
  return actual === href || actual.startsWith(`${href}/`);
}
