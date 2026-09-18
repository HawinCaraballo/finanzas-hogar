import { z } from "zod";

/**
 * Esquemas compartidos entre el formulario (cliente) y la Server Action
 * (servidor). Validar dos veces con el mismo esquema evita que la interfaz y el
 * backend se desalineen.
 */

const MONTO_MAX = 999_999_999_999;

export const montoSchema = z
  .number({ invalid_type_error: "Escribe un monto válido" })
  .positive("El monto debe ser mayor que cero")
  .max(MONTO_MAX, "El monto es demasiado grande");

export const fechaISOSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona una fecha válida");

export const tipoMovimientoSchema = z.enum(["INGRESO", "EGRESO"], {
  errorMap: () => ({ message: "Elige si es un ingreso o un gasto" }),
});

// --- Autenticación ---

export const registroSchema = z
  .object({
    nombre: z.string().trim().min(2, "Escribe tu nombre").max(80),
    email: z.string().trim().toLowerCase().email("Correo inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres").max(100),
    confirmar: z.string(),
  })
  .refine((d) => d.password === d.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

// --- Hogar ---

export const hogarSchema = z.object({
  nombre: z.string().trim().min(2, "Ponle un nombre al hogar").max(60),
  currency: z.string().trim().length(3, "Código de moneda de 3 letras").toUpperCase(),
  locale: z.string().trim().min(2).max(10),
});

export const invitacionSchema = z.object({
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  role: z.enum(["ADMIN", "MIEMBRO"]),
});

// --- Categorías ---

export const categoriaSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().trim().min(2, "Escribe un nombre").max(40),
  type: tipoMovimientoSchema,
  icon: z.string().trim().min(1).max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido"),
});

// --- Movimientos ---

export const movimientoSchema = z.object({
  id: z.string().optional(),
  type: tipoMovimientoSchema,
  amount: montoSchema,
  categoryId: z.string().min(1, "Elige una categoría"),
  date: fechaISOSchema,
  // Opcional a propósito: la categoría ya dice de qué va el movimiento, y
  // obligar a describirlo solo añade fricción al registro rápido. En las
  // reglas recurrentes sí es obligatoria, porque ahí es lo único que las
  // distingue en la lista.
  descripcion: z.string().trim().max(120, "Máximo 120 caracteres").optional(),
  notas: z.string().trim().max(500).optional().or(z.literal("")),
  loanId: z.string().optional().or(z.literal("")),
  // Quién puso la plata. Si no viene, la acción usa al usuario de la sesión.
  paidByUserId: z.string().optional().or(z.literal("")),
  // Marca el movimiento como personal: cuenta en la cuenta individual de su
  // responsable, pero no en los totales del hogar ni en los presupuestos.
  esPersonal: z.boolean().optional(),
});

// --- Presupuestos ---

export const presupuestoSchema = z.object({
  categoryId: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  // 0 significa "sin tope": la acción borra el presupuesto.
  amount: z.number().min(0).max(MONTO_MAX),
});

// --- Recurrentes ---

export const recurrenteSchema = z.object({
  id: z.string().optional(),
  type: tipoMovimientoSchema,
  amount: montoSchema,
  categoryId: z.string().min(1, "Elige una categoría"),
  descripcion: z.string().trim().min(1, "Escribe una descripción").max(120),
  frequency: z.enum(["SEMANAL", "QUINCENAL", "MENSUAL", "ANUAL"]),
  dayOfMonth: z.number().int().min(1).max(31),
  startDate: fechaISOSchema,
  endDate: fechaISOSchema.optional().or(z.literal("")),
  autoPost: z.boolean(),
  paidByUserId: z.string().optional().or(z.literal("")),
  esPersonal: z.boolean().optional(),
});

// --- Créditos ---

export const creditoSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().trim().min(2, "Ponle un nombre al crédito").max(60),
  kind: z.enum(["CREDITO", "TARJETA", "HIPOTECA", "VEHICULO", "OTRO"]),
  categoryId: z.string().min(1, "Elige la categoría con la que se paga"),
  principal: montoSchema,
  interestRate: z.number().min(0).max(100),
  totalInstallments: z.number().int().min(1, "Mínimo 1 cuota").max(600),
  installmentAmount: montoSchema,
  startDate: fechaISOSchema,
  paidByUserId: z.string().optional().or(z.literal("")),
});

export const pagoCuotaSchema = z.object({
  loanId: z.string().min(1),
  amount: montoSchema,
  date: fechaISOSchema,
  notas: z.string().trim().max(500).optional().or(z.literal("")),
  paidByUserId: z.string().optional().or(z.literal("")),
});

export type MovimientoInput = z.infer<typeof movimientoSchema>;
export type CategoriaInput = z.infer<typeof categoriaSchema>;
export type RecurrenteInput = z.infer<typeof recurrenteSchema>;
export type CreditoInput = z.infer<typeof creditoSchema>;
export type HogarInput = z.infer<typeof hogarSchema>;
