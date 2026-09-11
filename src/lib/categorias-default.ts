import type { MovementType } from "@prisma/client";

/**
 * Categorías con las que nace todo hogar. Cubren los casos que el usuario
 * mencionó (servicios públicos, créditos, tarjeta de crédito, comida) y algunos
 * más para que nadie tenga que empezar con la lista en blanco.
 * Son editables y archivables desde la app.
 */
export type CategoriaSemilla = {
  nombre: string;
  type: MovementType;
  icon: string;
  color: string;
};

export const CATEGORIAS_POR_DEFECTO: CategoriaSemilla[] = [
  // Servicios públicos
  { nombre: "Energía", type: "EGRESO", icon: "Zap", color: "#f59e0b" },
  { nombre: "Agua", type: "EGRESO", icon: "Droplets", color: "#0ea5e9" },
  { nombre: "Gas", type: "EGRESO", icon: "Flame", color: "#f97316" },
  { nombre: "Internet", type: "EGRESO", icon: "Wifi", color: "#6366f1" },
  { nombre: "Telefonía", type: "EGRESO", icon: "Smartphone", color: "#8b5cf6" },
  // Vivienda
  { nombre: "Arriendo o hipoteca", type: "EGRESO", icon: "Home", color: "#0d9488" },
  { nombre: "Administración", type: "EGRESO", icon: "Building2", color: "#14b8a6" },
  // Alimentación
  { nombre: "Mercado", type: "EGRESO", icon: "ShoppingCart", color: "#22c55e" },
  { nombre: "Restaurantes", type: "EGRESO", icon: "UtensilsCrossed", color: "#ef4444" },
  // Transporte
  { nombre: "Transporte", type: "EGRESO", icon: "Bus", color: "#3b82f6" },
  { nombre: "Combustible", type: "EGRESO", icon: "Fuel", color: "#eab308" },
  // Salud y educación
  { nombre: "Salud", type: "EGRESO", icon: "HeartPulse", color: "#ec4899" },
  { nombre: "Medicamentos", type: "EGRESO", icon: "Pill", color: "#f43f5e" },
  { nombre: "Educación", type: "EGRESO", icon: "GraduationCap", color: "#7c3aed" },
  // Deudas
  { nombre: "Cuota de crédito", type: "EGRESO", icon: "Landmark", color: "#dc2626" },
  { nombre: "Tarjeta de crédito", type: "EGRESO", icon: "CreditCard", color: "#be123c" },
  // Otros gastos
  { nombre: "Entretenimiento", type: "EGRESO", icon: "Popcorn", color: "#d946ef" },
  { nombre: "Ropa", type: "EGRESO", icon: "Shirt", color: "#06b6d4" },
  { nombre: "Mascotas", type: "EGRESO", icon: "PawPrint", color: "#a16207" },
  { nombre: "Ahorro e inversión", type: "EGRESO", icon: "PiggyBank", color: "#16a34a" },
  { nombre: "Otros gastos", type: "EGRESO", icon: "Tag", color: "#64748b" },

  // Ingresos
  { nombre: "Salario", type: "INGRESO", icon: "Wallet", color: "#16a34a" },
  { nombre: "Honorarios", type: "INGRESO", icon: "Briefcase", color: "#059669" },
  { nombre: "Arriendos recibidos", type: "INGRESO", icon: "KeyRound", color: "#0891b2" },
  { nombre: "Bonificaciones", type: "INGRESO", icon: "Gift", color: "#ca8a04" },
  { nombre: "Rendimientos", type: "INGRESO", icon: "TrendingUp", color: "#2563eb" },
  { nombre: "Reembolsos", type: "INGRESO", icon: "Undo2", color: "#7c3aed" },
  { nombre: "Otros ingresos", type: "INGRESO", icon: "Tag", color: "#64748b" },
];

/** Monedas que ofrece el formulario de hogar, con su locale sugerido. */
export const MONEDAS = [
  { currency: "COP", locale: "es-CO", etiqueta: "Peso colombiano (COP)" },
  { currency: "USD", locale: "es-US", etiqueta: "Dólar estadounidense (USD)" },
  { currency: "EUR", locale: "es-ES", etiqueta: "Euro (EUR)" },
  { currency: "MXN", locale: "es-MX", etiqueta: "Peso mexicano (MXN)" },
  { currency: "ARS", locale: "es-AR", etiqueta: "Peso argentino (ARS)" },
  { currency: "CLP", locale: "es-CL", etiqueta: "Peso chileno (CLP)" },
  { currency: "PEN", locale: "es-PE", etiqueta: "Sol peruano (PEN)" },
] as const;
