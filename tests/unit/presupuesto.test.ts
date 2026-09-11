import { describe, expect, it } from "vitest";
import { resumenPresupuesto } from "@/lib/presupuesto";

describe("resumenPresupuesto", () => {
  it("marca ok por debajo del 80 por ciento", () => {
    const r = resumenPresupuesto(500_000, 1_000_000);
    expect(r.porcentaje).toBe(50);
    expect(r.estado).toBe("ok");
    expect(r.restante).toBe(500_000);
  });

  it("marca alerta justo en el 80 por ciento", () => {
    expect(resumenPresupuesto(800_000, 1_000_000).estado).toBe("alerta");
  });

  it("sigue en alerta al llegar exactamente al tope", () => {
    const r = resumenPresupuesto(1_000_000, 1_000_000);
    expect(r.porcentaje).toBe(100);
    expect(r.estado).toBe("alerta");
    expect(r.restante).toBe(0);
  });

  it("marca excedido al pasarse", () => {
    const r = resumenPresupuesto(1_200_000, 1_000_000);
    expect(r.estado).toBe("excedido");
    expect(r.restante).toBe(-200_000);
    expect(r.porcentaje).toBe(120);
  });

  it("sin tope y sin gasto queda en cero", () => {
    expect(resumenPresupuesto(0, 0)).toMatchObject({ porcentaje: 0, estado: "ok" });
  });

  it("sin tope pero con gasto se considera excedido al 100", () => {
    expect(resumenPresupuesto(50_000, 0).porcentaje).toBe(100);
  });
});
