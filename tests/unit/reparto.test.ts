import { describe, expect, it } from "vitest";
import {
  colorDeMiembro,
  ordenarPorAporte,
  participacion,
  totalesDeHogar,
  type FilaMiembro,
} from "@/lib/reparto";

const fila = (
  userId: string,
  nombre: string,
  ingresos: number,
  egresos: number,
): FilaMiembro => ({ userId, nombre, ingresos, egresos, balance: ingresos - egresos });

describe("participacion", () => {
  it("calcula la cuota sobre el total", () => {
    expect(participacion(250, 1000)).toBe(25);
  });

  it("una sola persona se lleva el 100", () => {
    expect(participacion(1000, 1000)).toBe(100);
  });

  it("sin total no hay porcentaje que calcular", () => {
    expect(participacion(0, 0)).toBe(0);
    expect(participacion(500, 0)).toBe(0);
  });

  it("un monto en cero es cero por ciento", () => {
    expect(participacion(0, 1000)).toBe(0);
  });

  it("las cuotas de todos suman cien", () => {
    const montos = [300, 450, 250];
    const total = 1000;
    const suma = montos.reduce((acc, m) => acc + participacion(m, total), 0);
    expect(suma).toBeCloseTo(100, 10);
  });
});

describe("totalesDeHogar", () => {
  const filas = [fila("a", "Ana", 3_000_000, 1_200_000), fila("b", "Luis", 2_000_000, 800_000)];

  it("suma los ingresos y los gastos de todos", () => {
    expect(totalesDeHogar(filas)).toEqual({
      ingresos: 5_000_000,
      egresos: 2_000_000,
      balance: 3_000_000,
    });
  });

  // La invariante del diseño: como no hay gastos personales, el hogar es
  // exactamente la suma de las cuentas individuales.
  it("el balance del hogar es la suma de los balances individuales", () => {
    const { balance } = totalesDeHogar(filas);
    expect(balance).toBe(filas.reduce((acc, f) => acc + f.balance, 0));
  });

  it("sin miembros todo queda en cero", () => {
    expect(totalesDeHogar([])).toEqual({ ingresos: 0, egresos: 0, balance: 0 });
  });

  it("admite un hogar que gastó más de lo que le entró", () => {
    expect(totalesDeHogar([fila("a", "Ana", 100, 350)]).balance).toBe(-250);
  });
});

describe("ordenarPorAporte", () => {
  it("pone primero a quien más aportó", () => {
    const orden = ordenarPorAporte([
      fila("a", "Ana", 1_000_000, 0),
      fila("b", "Luis", 3_000_000, 0),
      fila("c", "Sara", 2_000_000, 0),
    ]);
    expect(orden.map((f) => f.nombre)).toEqual(["Luis", "Sara", "Ana"]);
  });

  it("con ingresos iguales desempata por gasto y luego por nombre", () => {
    const orden = ordenarPorAporte([
      fila("c", "Carlos", 1000, 100),
      fila("a", "Ana", 1000, 500),
      fila("b", "Beto", 1000, 100),
    ]);
    expect(orden.map((f) => f.nombre)).toEqual(["Ana", "Beto", "Carlos"]);
  });

  it("no modifica el arreglo original", () => {
    const original = [fila("a", "Ana", 1, 0), fila("b", "Luis", 2, 0)];
    const copia = [...original];
    ordenarPorAporte(original);
    expect(original).toEqual(copia);
  });

  it("sobrevive a la lista vacía", () => {
    expect(ordenarPorAporte([])).toEqual([]);
  });
});

describe("colorDeMiembro", () => {
  it("da un color distinto a cada uno de los primeros miembros", () => {
    const colores = [0, 1, 2, 3].map(colorDeMiembro);
    expect(new Set(colores).size).toBe(4);
  });

  it("da siempre el mismo color a la misma posición", () => {
    expect(colorDeMiembro(2)).toBe(colorDeMiembro(2));
  });

  it("da la vuelta a la paleta en hogares muy grandes", () => {
    expect(colorDeMiembro(8)).toBe(colorDeMiembro(0));
  });
});
