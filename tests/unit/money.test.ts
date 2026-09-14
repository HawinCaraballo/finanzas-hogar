import { describe, expect, it } from "vitest";
import {
  decimalesDe,
  formatearEntradaMonto,
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

describe("formatearEntradaMonto", () => {
  // Teclea carácter a carácter, como una persona, partiendo de lo que el campo
  // ya muestra. Es la única forma de cazar los fallos acumulativos.
  function teclear(texto: string, config: { currency: string; locale: string }) {
    let actual = "";
    for (const tecla of texto) {
      actual = formatearEntradaMonto(actual + tecla, config).texto;
    }
    return actual;
  }

  describe("monedas sin decimales (COP)", () => {
    it("separa los miles al teclear un millón", () => {
      expect(teclear("1000000", COP)).toBe("1.000.000");
    });

    it("va poniendo los separadores conforme crece", () => {
      expect(teclear("1", COP)).toBe("1");
      expect(teclear("100", COP)).toBe("100");
      expect(teclear("1000", COP)).toBe("1.000");
      expect(teclear("10000", COP)).toBe("10.000");
    });

    it("acepta que le peguen un valor ya formateado sin deformarlo", () => {
      expect(formatearEntradaMonto("1.250.000", COP).texto).toBe("1.250.000");
      expect(formatearEntradaMonto("1.250.000", COP).valor).toBe(1250000);
    });

    it("no admite decimales en una moneda que no los usa", () => {
      expect(formatearEntradaMonto("1250,75", COP).valor).toBe(125075);
    });
  });

  describe("monedas con decimales (USD)", () => {
    it("separa los miles al teclear un millón", () => {
      expect(teclear("1000000", USD)).toBe("1,000,000");
    });

    it("no fuerza los decimales mientras se escribe", () => {
      expect(teclear("1000", USD)).toBe("1,000");
    });

    it("deja escribir el separador decimal y seguir", () => {
      expect(teclear("1000.", USD)).toBe("1,000.");
      expect(teclear("1000.5", USD)).toBe("1,000.5");
      expect(teclear("1000.55", USD)).toBe("1,000.55");
    });

    it("recorta lo que sobra de dos decimales", () => {
      expect(formatearEntradaMonto("1000.555", USD).texto).toBe("1,000.55");
      expect(formatearEntradaMonto("1000.555", USD).valor).toBe(1000.55);
    });

    it("solo respeta el primer separador decimal", () => {
      expect(formatearEntradaMonto("1.2.3", USD).texto).toBe("1.23");
    });
  });

  describe("casos de borde", () => {
    it("el campo vacío devuelve vacío y cero", () => {
      expect(formatearEntradaMonto("", COP)).toEqual({ texto: "", valor: 0 });
    });

    it("un texto sin dígitos no deja nada", () => {
      expect(formatearEntradaMonto("abc", COP)).toEqual({ texto: "", valor: 0 });
    });

    it("ignora el símbolo de moneda y los espacios", () => {
      expect(formatearEntradaMonto("$ 45.000", COP).valor).toBe(45000);
    });

    it("quita los ceros a la izquierda", () => {
      expect(formatearEntradaMonto("007", COP).texto).toBe("7");
    });

    it("mantiene el cero solo", () => {
      expect(formatearEntradaMonto("0", COP).texto).toBe("0");
    });
  });
});
