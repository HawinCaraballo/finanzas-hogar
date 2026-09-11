import { describe, expect, it } from "vitest";
import {
  clavePeriodoOcurrencia,
  ocurrenciasPendientes,
  primeraOcurrenciaDesde,
  siguienteOcurrencia,
} from "@/lib/recurrencia";
import { aFechaISO, parseFechaISO } from "@/lib/periodo";

const iso = (d: Date) => aFechaISO(d);

describe("reglas mensuales", () => {
  const regla = {
    frequency: "MENSUAL" as const,
    dayOfMonth: 5,
    startDate: parseFechaISO("2026-01-05"),
  };

  it("devuelve el día del mes en curso si aún no pasó", () => {
    expect(iso(primeraOcurrenciaDesde(regla, parseFechaISO("2026-03-01")))).toBe("2026-03-05");
  });

  it("salta al mes siguiente si el día ya pasó", () => {
    expect(iso(primeraOcurrenciaDesde(regla, parseFechaISO("2026-03-06")))).toBe("2026-04-05");
  });

  it("no devuelve nada anterior a la fecha de inicio", () => {
    expect(iso(primeraOcurrenciaDesde(regla, parseFechaISO("2025-06-01")))).toBe("2026-01-05");
  });

  it("avanza un mes exacto", () => {
    expect(iso(siguienteOcurrencia(regla, parseFechaISO("2026-03-05")))).toBe("2026-04-05");
  });
});

describe("día 31 en meses cortos", () => {
  const regla = {
    frequency: "MENSUAL" as const,
    dayOfMonth: 31,
    startDate: parseFechaISO("2026-01-31"),
  };

  it("cae el 28 en febrero en vez de saltarse el mes", () => {
    expect(iso(siguienteOcurrencia(regla, parseFechaISO("2026-01-31")))).toBe("2026-02-28");
  });

  it("cae el 29 en un febrero bisiesto", () => {
    const bisiesto = { ...regla, startDate: parseFechaISO("2024-01-31") };
    expect(iso(siguienteOcurrencia(bisiesto, parseFechaISO("2024-01-31")))).toBe("2024-02-29");
  });

  it("vuelve al 31 el mes siguiente", () => {
    expect(iso(siguienteOcurrencia(regla, parseFechaISO("2026-02-28")))).toBe("2026-03-31");
  });

  it("cae el 30 en abril", () => {
    expect(iso(siguienteOcurrencia(regla, parseFechaISO("2026-03-31")))).toBe("2026-04-30");
  });
});

describe("reglas semanales y quincenales", () => {
  it("avanza de siete en siete desde el inicio", () => {
    const regla = {
      frequency: "SEMANAL" as const,
      dayOfMonth: 1,
      startDate: parseFechaISO("2026-09-01"),
    };
    expect(iso(primeraOcurrenciaDesde(regla, parseFechaISO("2026-09-10")))).toBe("2026-09-15");
  });

  it("avanza de catorce en catorce", () => {
    const regla = {
      frequency: "QUINCENAL" as const,
      dayOfMonth: 1,
      startDate: parseFechaISO("2026-09-01"),
    };
    expect(iso(siguienteOcurrencia(regla, parseFechaISO("2026-09-01")))).toBe("2026-09-15");
  });
});

describe("reglas anuales", () => {
  const regla = {
    frequency: "ANUAL" as const,
    dayOfMonth: 15,
    startDate: parseFechaISO("2026-06-15"),
  };

  it("repite el mismo mes y día al año siguiente", () => {
    expect(iso(siguienteOcurrencia(regla, parseFechaISO("2026-06-15")))).toBe("2027-06-15");
  });
});

describe("ocurrenciasPendientes", () => {
  const regla = {
    frequency: "MENSUAL" as const,
    dayOfMonth: 1,
    startDate: parseFechaISO("2026-01-01"),
    nextRunDate: parseFechaISO("2026-01-01"),
  };

  it("devuelve todos los meses atrasados de una sola vez", () => {
    const fechas = ocurrenciasPendientes(regla, parseFechaISO("2026-04-15"));
    expect(fechas.map(iso)).toEqual(["2026-01-01", "2026-02-01", "2026-03-01", "2026-04-01"]);
  });

  it("no devuelve nada si la próxima ejecución es futura", () => {
    const futura = { ...regla, nextRunDate: parseFechaISO("2026-10-01") };
    expect(ocurrenciasPendientes(futura, parseFechaISO("2026-09-11"))).toEqual([]);
  });

  it("se detiene en la fecha de fin", () => {
    const conFin = { ...regla, endDate: parseFechaISO("2026-02-28") };
    expect(ocurrenciasPendientes(conFin, parseFechaISO("2026-06-01")).map(iso)).toEqual([
      "2026-01-01",
      "2026-02-01",
    ]);
  });

  it("respeta el tope para no entrar en bucle", () => {
    expect(ocurrenciasPendientes(regla, parseFechaISO("2200-01-01")).length).toBe(120);
  });
});

describe("clavePeriodoOcurrencia", () => {
  it("usa el mes en las reglas mensuales, para que cambiar el día no duplique", () => {
    expect(clavePeriodoOcurrencia("MENSUAL", parseFechaISO("2026-09-05"))).toBe("2026-09");
    expect(clavePeriodoOcurrencia("MENSUAL", parseFechaISO("2026-09-20"))).toBe("2026-09");
  });

  it("usa el año en las reglas anuales", () => {
    expect(clavePeriodoOcurrencia("ANUAL", parseFechaISO("2026-06-15"))).toBe("2026");
  });

  it("usa la fecha exacta en semanales y quincenales", () => {
    expect(clavePeriodoOcurrencia("SEMANAL", parseFechaISO("2026-09-15"))).toBe("2026-09-15");
  });
});
