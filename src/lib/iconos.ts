import {
  Baby, Banknote, Bike, Book, Briefcase, Building2, Bus, Car, Church, Coffee,
  Coins, CreditCard, Droplets, Dumbbell, Flame, Fuel, Gamepad2, Gift,
  GraduationCap, Hammer, HandCoins, HeartPulse, Home, KeyRound, Landmark, Music,
  PawPrint, PiggyBank, Pill, Plane, Popcorn, Receipt, Scissors, Shirt,
  ShoppingCart, Smartphone, Sparkles, Tag, TrendingUp, Umbrella, Undo2,
  UtensilsCrossed, Wallet, Wifi, Wrench, Zap, type LucideIcon,
} from "lucide-react";

/**
 * Catálogo cerrado de íconos. Se importan uno a uno (en vez de leer el paquete
 * completo por nombre) para que el bundle solo cargue estos y no los 1.500 de
 * lucide.
 */
export const ICONOS: Record<string, LucideIcon> = {
  Baby, Banknote, Bike, Book, Briefcase, Building2, Bus, Car, Church, Coffee,
  Coins, CreditCard, Droplets, Dumbbell, Flame, Fuel, Gamepad2, Gift,
  GraduationCap, Hammer, HandCoins, HeartPulse, Home, KeyRound, Landmark, Music,
  PawPrint, PiggyBank, Pill, Plane, Popcorn, Receipt, Scissors, Shirt,
  ShoppingCart, Smartphone, Sparkles, Tag, TrendingUp, Umbrella, Undo2,
  UtensilsCrossed, Wallet, Wifi, Wrench, Zap,
};

export const NOMBRES_ICONOS = Object.keys(ICONOS);

/** Nunca falla: si el nombre guardado ya no existe, cae en la etiqueta genérica. */
export function iconoPorNombre(nombre: string | null | undefined): LucideIcon {
  return (nombre && ICONOS[nombre]) || Tag;
}

/** Paleta que se ofrece al crear o editar una categoría. */
export const COLORES = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#64748b",
];
