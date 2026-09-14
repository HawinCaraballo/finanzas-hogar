import { describe, expect, it } from "vitest";
import {
  ALCANCE_HOGAR,
  claveAlcance,
  esPersona,
  etiquetaAlcance,
  parseAlcance,
} from "@/lib/alcance";

const MIEMBROS = [
  { id: "u-ana", nombre: "Ana" },
  { id: "u-luis", nombre: "Luis" },
];

describe("parseAlcance", () => {
  it("sin valor devuelve el hogar completo", () => {
    expect(parseAlcance(undefined, MIEMBROS)).toEqual({ tipo: "hogar" });
    expect(parseAlcance(null, MIEMBROS)).toEqual({ tipo: "hogar" });
    expect(parseAlcance("", MIEMBROS)).toEqual({ tipo: "hogar" });
  });

  it('reconoce la palabra "hogar"', () => {
    expect(parseAlcance("hogar", MIEMBROS)).toEqual({ tipo: "hogar" });
  });

  it("reconoce a un miembro por su id", () => {
    expect(parseAlcance("u-luis", MIEMBROS)).toEqual({ tipo: "persona", userId: "u-luis" });
  });

  // Esta es la defensa que importa: sin ella, un ?quien= con el id de alguien
  // de otro hogar filtraría por esa persona en vez de caer en el hogar propio.
  it("ignora un id que no pertenece al hogar", () => {
    expect(parseAlcance("u-de-otra-casa", MIEMBROS)).toEqual({ tipo: "hogar" });
  });

  it("ignora basura", () => {
    expect(parseAlcance("../../etc/passwd", MIEMBROS)).toEqual({ tipo: "hogar" });
  });

  it("sin miembros siempre cae en el hogar", () => {
    expect(parseAlcance("u-ana", [])).toEqual({ tipo: "hogar" });
  });
});

describe("claveAlcance", () => {
  it("el hogar se escribe como hogar", () => {
    expect(claveAlcance(ALCANCE_HOGAR)).toBe("hogar");
  });

  it("una persona se escribe como su id", () => {
    expect(claveAlcance({ tipo: "persona", userId: "u-ana" })).toBe("u-ana");
  });

  it("va y vuelve sin perder información", () => {
    for (const alcance of [ALCANCE_HOGAR, { tipo: "persona" as const, userId: "u-ana" }]) {
      expect(parseAlcance(claveAlcance(alcance), MIEMBROS)).toEqual(alcance);
    }
  });
});

describe("etiquetaAlcance", () => {
  it("nombra el hogar completo", () => {
    expect(etiquetaAlcance(ALCANCE_HOGAR, MIEMBROS)).toBe("Todo el hogar");
  });

  it("usa el nombre de la persona", () => {
    expect(etiquetaAlcance({ tipo: "persona", userId: "u-ana" }, MIEMBROS)).toBe("Ana");
  });

  it("no revienta si la persona ya no está en el hogar", () => {
    expect(etiquetaAlcance({ tipo: "persona", userId: "u-fantasma" }, MIEMBROS)).toBe(
      "Todo el hogar",
    );
  });
});

describe("esPersona", () => {
  it("distingue los dos casos", () => {
    expect(esPersona(ALCANCE_HOGAR)).toBe(false);
    expect(esPersona({ tipo: "persona", userId: "u-ana" })).toBe(true);
  });
});
