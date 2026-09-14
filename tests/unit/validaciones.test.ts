import { describe, expect, it } from "vitest";
import { movimientoSchema, recurrenteSchema } from "@/lib/validaciones";

const movimientoBase = {
  type: "EGRESO" as const,
  amount: 50_000,
  categoryId: "cat-1",
  date: "2026-09-14",
};

const recurrenteBase = {
  type: "EGRESO" as const,
  amount: 50_000,
  categoryId: "cat-1",
  frequency: "MENSUAL" as const,
  dayOfMonth: 5,
  startDate: "2026-09-14",
  autoPost: true,
};

describe("descripción en los movimientos", () => {
  // Registrar un gasto tiene que costar lo menos posible: la categoría ya dice
  // de qué va, así que obligar a describirlo solo añade fricción.
  it("se puede registrar sin descripción", () => {
    expect(movimientoSchema.safeParse({ ...movimientoBase, descripcion: "" }).success).toBe(true);
  });

  it("se puede registrar omitiendo el campo entero", () => {
    expect(movimientoSchema.safeParse(movimientoBase).success).toBe(true);
  });

  it("sigue aceptando una descripción normal", () => {
    const r = movimientoSchema.safeParse({ ...movimientoBase, descripcion: "Mercado" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.descripcion).toBe("Mercado");
  });

  it("sigue rechazando una descripción absurdamente larga", () => {
    expect(
      movimientoSchema.safeParse({ ...movimientoBase, descripcion: "x".repeat(200) }).success,
    ).toBe(false);
  });
});

describe("descripción en las reglas recurrentes", () => {
  // Aquí sí es obligatoria: es lo único que distingue una regla de otra en la
  // lista, y el cron la usa como texto del movimiento que genera.
  it("no se puede crear una regla sin descripción", () => {
    expect(recurrenteSchema.safeParse({ ...recurrenteBase, descripcion: "" }).success).toBe(false);
  });

  it("tampoco omitiendo el campo", () => {
    expect(recurrenteSchema.safeParse(recurrenteBase).success).toBe(false);
  });

  it("con descripción sí", () => {
    expect(
      recurrenteSchema.safeParse({ ...recurrenteBase, descripcion: "Arriendo" }).success,
    ).toBe(true);
  });
});
