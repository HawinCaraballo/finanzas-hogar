/**
 * Formateo y lectura de montos. El dato siempre viaja como number (pesos, no
 * centavos); solo la presentacion depende de la moneda y el locale del hogar.
 */

/** Monedas que en la practica no se escriben con decimales. */
const SIN_DECIMALES = new Set(["COP", "CLP", "PYG", "JPY", "KRW", "VND", "ISK"]);

export type ConfigMoneda = { currency: string; locale: string };

export function decimalesDe(currency: string): number {
  return SIN_DECIMALES.has(currency.toUpperCase()) ? 0 : 2;
}

/** Ej: formatMoney(1250000, { currency: "COP", locale: "es-CO" }) -> "$ 1.250.000" */
export function formatMoney(valor: number, config: ConfigMoneda): string {
  const digits = decimalesDe(config.currency);
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(valor);
}

/** Igual que formatMoney pero sin simbolo, para inputs y tablas densas. */
export function formatNumero(valor: number, config: ConfigMoneda): string {
  const digits = decimalesDe(config.currency);
  return new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(valor);
}

/** Version corta para ejes de graficas: 1.250.000 -> "1,3 M". */
export function formatMoneyCompacto(valor: number, config: ConfigMoneda): string {
  const abs = Math.abs(valor);
  if (abs < 1000) return formatMoney(valor, config);
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(valor);
}

function separador(locale: string, tipo: "decimal" | "group"): string {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234567.8);
  return parts.find((p) => p.type === tipo)?.value ?? (tipo === "decimal" ? "." : ",");
}

/**
 * Lee lo que el usuario escribio en un campo de monto y devuelve un number.
 * Tolera simbolos, espacios y separadores de miles del locale.
 * Devuelve NaN si no hay ningun digito.
 */
export function parseMoney(entrada: string, locale = "es-CO"): number {
  if (typeof entrada !== "string") return NaN;
  const decimal = separador(locale, "decimal");
  const grupo = separador(locale, "group");

  let texto = entrada.trim();
  if (texto === "") return NaN;

  const negativo = texto.startsWith("-");
  texto = texto.split(grupo).join("");
  texto = texto.split(decimal).join(".");
  // Quita todo lo que no sea digito o punto decimal.
  texto = texto.replace(/[^\d.]/g, "");
  // Si quedaron varios puntos, el ultimo manda como separador decimal.
  const piezas = texto.split(".");
  if (piezas.length > 2) {
    texto = piezas.slice(0, -1).join("") + "." + piezas[piezas.length - 1];
  }
  if (texto === "" || texto === ".") return NaN;

  const valor = Number(texto);
  if (Number.isNaN(valor)) return NaN;
  return negativo ? -valor : valor;
}

/** Redondea al numero de decimales que usa la moneda, evitando ruido binario. */
export function redondear(valor: number, currency: string): number {
  const factor = 10 ** decimalesDe(currency);
  return Math.round(valor * factor) / factor;
}

/**
 * Variacion porcentual contra el periodo anterior.
 * Devuelve null cuando no hay base de comparacion (anterior en cero).
 */
export function variacionPorcentual(actual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return ((actual - anterior) / Math.abs(anterior)) * 100;
}
