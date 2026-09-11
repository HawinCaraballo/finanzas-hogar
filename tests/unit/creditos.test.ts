import { describe, expect, it } from "vitest";
import { cuotaFrancesa, fechaCuota, fechaFinCredito, resumenCredito } from "@/lib/creditos";
import { aFechaISO, parseFechaISO } from "@/lib/periodo";

const credito = {
  principal: 10_000_000,
  totalInstallments: 12,
  installmentAmount: 950_000,
  startDate: parseFechaISO("2026-01-15"),
};

describe("resumenCredito", () => {
  it("calcula el total a pagar como cuota por número de cuotas", () => {
    expect(resumenCredito(credito, []).totalAPagar).toBe(11_400_000);
  });

  it("con cero pagos el saldo es todo el crédito", () => {
    const r = resumenCredito(credito, []);
    expect(r.totalPagado).toBe(0);
    expect(r.saldoPendiente).toBe(11_400_000);
    expect(r.cuotasPagadas).toBe(0);
    expect(r.progreso).toBe(0);
  });

  it("cuenta las cuotas pagadas a partir de los movimientos", () => {
    const r = resumenCredito(credito, [950_000, 950_000, 950_000]);
    expect(r.cuotasPagadas).toBe(3);
    expect(r.cuotasRestantes).toBe(9);
    expect(r.saldoPendiente).toBe(8_550_000);
  });

  it("no cuenta como cuota un abono parcial", () => {
    expect(resumenCredito(credito, [500_000]).cuotasPagadas).toBe(0);
  });

  it("no deja el saldo en negativo si se paga de más", () => {
    const r = resumenCredito(credito, [20_000_000]);
    expect(r.saldoPendiente).toBe(0);
    expect(r.progreso).toBe(100);
    expect(r.cuotasPagadas).toBe(12);
  });

  it("calcula los intereses como el exceso sobre el capital", () => {
    expect(resumenCredito(credito, []).interesesTotales).toBe(1_400_000);
  });

  it("no reporta intereses negativos cuando no hay costo financiero", () => {
    const sinInteres = { ...credito, installmentAmount: 500_000, principal: 10_000_000 };
    expect(resumenCredito(sinInteres, []).interesesTotales).toBe(0);
  });

  it("sobrevive a una cuota en cero sin dividir por cero", () => {
    const roto = { ...credito, installmentAmount: 0 };
    const r = resumenCredito(roto, [100]);
    expect(r.cuotasPagadas).toBe(0);
    expect(r.progreso).toBe(0);
  });
});

describe("fechas de cuotas", () => {
  it("la primera cuota cae el día de inicio", () => {
    expect(aFechaISO(fechaCuota(credito.startDate, 1))).toBe("2026-01-15");
  });

  it("la cuota N cae N-1 meses después", () => {
    expect(aFechaISO(fechaCuota(credito.startDate, 4))).toBe("2026-04-15");
  });

  it("ajusta el día cuando el mes no lo tiene", () => {
    const inicio = parseFechaISO("2026-01-31");
    expect(aFechaISO(fechaCuota(inicio, 2))).toBe("2026-02-28");
  });

  it("la fecha de fin es la última cuota", () => {
    expect(aFechaISO(fechaFinCredito(credito.startDate, 12))).toBe("2026-12-15");
  });
});

describe("cuotaFrancesa", () => {
  it("sin interés reparte el capital en partes iguales", () => {
    expect(cuotaFrancesa(1_200_000, 0, 12)).toBe(100_000);
  });

  it("con interés la cuota es mayor que el capital dividido", () => {
    const cuota = cuotaFrancesa(10_000_000, 1.5, 12);
    expect(cuota).toBeGreaterThan(10_000_000 / 12);
    expect(cuota).toBeCloseTo(916_799.8, 0);
  });

  it("devuelve cero si no hay cuotas", () => {
    expect(cuotaFrancesa(1_000_000, 1.5, 0)).toBe(0);
  });
});
