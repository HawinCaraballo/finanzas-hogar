import { describe, expect, it } from "vitest";
import {
  decimalesDe,
  formatMoney,
  parseMoney,
  redondear,
  variacionPorcentual,
} from "@/lib/money";

const COP = { currency: "COP", locale: "es-CO" };
const USD = { currency: "USD", locale: "es-US" };

describe("decimalesDe", () => {
  it("no usa decimales en monedas donde nadie escribe centavos", () => {
    expect(decimalesDe("COP")).toBe(0);
    expect(decimalesDe("cop")).toBe(0);
    expect(decimalesDe("CLP")).toBe(0);
  });

  it("usa dos decimales en el resto", () => {
    expect(decimalesDe("USD")).toBe(2);
    expect(decimalesDe("EUR")).toBe(2);
  });
});

describe("formatMoney", () => {
  it("formatea pesos colombianos sin decimales", () => {
    const salida = formatMoney(1250000, COP);
    expect(salida).toContain("1.250.000");
    expect(salida).not.toContain(",00");
  });

  it("formatea dólares con dos decimales", () => {
    expect(formatMoney(1250.5, USD)).toContain("1,250.50");
  });

  it("conserva el signo de los montos negativos", () => {
    expect(formatMoney(-50000, COP)).toContain("-");
  });

  it("formatea el cero", () => {
    expect(formatMoney(0, COP)).toContain("0");
  });
});

describe("parseMoney", () => {
  it("lee un monto con separadores de miles colombianos", () => {
    expect(parseMoney("1.250.000", "es-CO")).toBe(1250000);
  });

  it("lee un monto con decimales colombianos", () => {
    expect(parseMoney("1.250,75", "es-CO")).toBe(1250.75);
  });

  it("lee un monto con formato estadounidense", () => {
    expect(parseMoney("1,250.75", "en-US")).toBe(1250.75);
  });

  it("ignora el símbolo de moneda y los espacios", () => {
    expect(parseMoney("$ 45.000 ", "es-CO")).toBe(45000);
  });

  it("acepta dígitos sueltos", () => {
    expect(parseMoney("45000", "es-CO")).toBe(45000);
  });

  it("respeta el signo negativo", () => {
    expect(parseMoney("-45.000", "es-CO")).toBe(-45000);
  });

  it("devuelve NaN cuando no hay números", () => {
    expect(parseMoney("", "es-CO")).toBeNaN();
    expect(parseMoney("abc", "es-CO")).toBeNaN();
    expect(parseMoney("   ", "es-CO")).toBeNaN();
  });
});

describe("redondear", () => {
  it("redondea a entero en COP", () => {
    expect(redondear(1250.67, "COP")).toBe(1251);
  });

  it("redondea a dos decimales en USD", () => {
    expect(redondear(0.1 + 0.2, "USD")).toBe(0.3);
  });
});

describe("variacionPorcentual", () => {
  it("calcula un aumento", () => {
    expect(variacionPorcentual(150, 100)).toBe(50);
  });

  it("calcula una caída", () => {
    expect(variacionPorcentual(80, 100)).toBe(-20);
  });

  it("devuelve null cuando no hay base de comparación", () => {
    expect(variacionPorcentual(100, 0)).toBeNull();
  });
});
