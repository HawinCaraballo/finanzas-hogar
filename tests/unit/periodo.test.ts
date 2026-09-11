import { describe, expect, it } from "vitest";
import {
  aFechaISO,
  claveDePeriodo,
  diaSeguro,
  diasEnMes,
  fechaCorta,
  fechaLegible,
  fechaUTC,
  mesAnterior,
  nombrePeriodo,
  parseClavePeriodo,
  parseFechaISO,
  periodoDe,
  rangoDelMes,
  sumarMeses,
  ultimosMeses,
} from "@/lib/periodo";

describe("fechas ISO", () => {
  it("va y vuelve sin perder el día", () => {
    expect(aFechaISO(parseFechaISO("2026-09-11"))).toBe("2026-09-11");
  });

  it("no corre el día por zona horaria", () => {
    const d = parseFechaISO("2026-09-01");
    expect(periodoDe(d)).toEqual({ year: 2026, month: 9 });
  });

  it("rechaza formatos que no son ISO corto", () => {
    expect(() => parseFechaISO("11/09/2026")).toThrow();
  });
});

describe("claves de periodo", () => {
  it("rellena el mes con cero", () => {
    expect(claveDePeriodo({ year: 2026, month: 9 })).toBe("2026-09");
  });

  it("lee una clave válida", () => {
    expect(parseClavePeriodo("2026-09")).toEqual({ year: 2026, month: 9 });
  });

  it("rechaza claves inválidas", () => {
    expect(parseClavePeriodo("2026-13")).toBeNull();
    expect(parseClavePeriodo("septiembre")).toBeNull();
  });
});

describe("rangoDelMes", () => {
  it("va del día 1 al día 1 del mes siguiente", () => {
    const { desde, hasta } = rangoDelMes({ year: 2026, month: 9 });
    expect(aFechaISO(desde)).toBe("2026-09-01");
    expect(aFechaISO(hasta)).toBe("2026-10-01");
  });

  it("cruza bien el fin de año", () => {
    const { desde, hasta } = rangoDelMes({ year: 2026, month: 12 });
    expect(aFechaISO(desde)).toBe("2026-12-01");
    expect(aFechaISO(hasta)).toBe("2027-01-01");
  });
});

describe("aritmética de meses", () => {
  it("suma cruzando el año", () => {
    expect(sumarMeses({ year: 2026, month: 11 }, 3)).toEqual({ year: 2027, month: 2 });
  });

  it("resta cruzando el año", () => {
    expect(mesAnterior({ year: 2026, month: 1 })).toEqual({ year: 2025, month: 12 });
  });

  it("devuelve los últimos 12 meses en orden", () => {
    const meses = ultimosMeses({ year: 2026, month: 3 }, 12);
    expect(meses).toHaveLength(12);
    expect(meses[0]).toEqual({ year: 2025, month: 4 });
    expect(meses[11]).toEqual({ year: 2026, month: 3 });
  });
});

describe("días del mes", () => {
  it("conoce febrero bisiesto", () => {
    expect(diasEnMes(2024, 2)).toBe(29);
    expect(diasEnMes(2026, 2)).toBe(28);
  });

  it("ajusta un día que no existe al último del mes", () => {
    expect(diaSeguro(2026, 2, 31)).toBe(28);
    expect(diaSeguro(2026, 4, 31)).toBe(30);
    expect(diaSeguro(2026, 1, 31)).toBe(31);
  });
});

describe("nombrePeriodo", () => {
  it("escribe el mes en español", () => {
    expect(nombrePeriodo({ year: 2026, month: 9 })).toBe("septiembre 2026");
  });
});

describe("fechaUTC", () => {
  it("construye medianoche UTC", () => {
    expect(fechaUTC(2026, 9, 11).toISOString()).toBe("2026-09-11T00:00:00.000Z");
  });
});

describe("fechaLegible", () => {
  const hoy = parseFechaISO("2026-09-11");

  it("dice Hoy para la fecha de referencia", () => {
    expect(fechaLegible("2026-09-11", hoy)).toBe("Hoy");
  });

  it("dice Ayer para el día anterior", () => {
    expect(fechaLegible("2026-09-10", hoy)).toBe("Ayer");
  });

  it("escribe el día y el mes dentro del mismo año", () => {
    expect(fechaLegible("2026-09-03", hoy)).toBe("jueves, 3 de septiembre");
  });

  it("añade el año cuando es de otro año", () => {
    expect(fechaLegible("2025-12-24", hoy)).toBe("24 de diciembre de 2025");
  });
});

describe("fechaCorta", () => {
  it("abrevia el mes", () => {
    expect(fechaCorta("2026-09-11")).toBe("11 sep");
  });
});
