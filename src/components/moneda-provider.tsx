"use client";

import { createContext, useContext, useMemo } from "react";
import {
  formatMoney,
  formatMoneyCompacto,
  formatNumero,
  parseMoney,
  type ConfigMoneda,
} from "@/lib/money";

/**
 * La moneda y el locale son del hogar, no del usuario. Se inyectan una vez en
 * el layout para que ningún componente cliente tenga que recibirlos por props.
 */
const MonedaContext = createContext<ConfigMoneda>({ currency: "COP", locale: "es-CO" });

export function MonedaProvider({
  config,
  children,
}: {
  config: ConfigMoneda;
  children: React.ReactNode;
}) {
  const valor = useMemo(() => config, [config.currency, config.locale]); // eslint-disable-line react-hooks/exhaustive-deps
  return <MonedaContext.Provider value={valor}>{children}</MonedaContext.Provider>;
}

export function useMoneda() {
  const config = useContext(MonedaContext);
  return useMemo(
    () => ({
      ...config,
      format: (v: number) => formatMoney(v, config),
      formatNumero: (v: number) => formatNumero(v, config),
      formatCompacto: (v: number) => formatMoneyCompacto(v, config),
      parse: (v: string) => parseMoney(v, config.locale),
    }),
    [config],
  );
}
