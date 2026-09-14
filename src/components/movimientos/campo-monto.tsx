"use client";

import { useEffect, useState } from "react";
import { useMoneda } from "@/components/moneda-provider";
import { FOCO_INICIAL } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Campo de monto. Muestra los separadores de miles mientras se escribe para que
 * no haya que contar ceros — el error más común al registrar un gasto grande.
 * Hacia afuera entrega siempre un number.
 */
export function CampoMonto({
  id,
  valor,
  onChange,
  tono,
  invalido,
  focoInicial,
}: {
  id: string;
  valor: number | undefined;
  onChange: (valor: number) => void;
  tono: "ingreso" | "egreso";
  invalido?: boolean;
  /** Marca este campo como el primero en recibir el foco al abrir un diálogo. */
  focoInicial?: boolean;
}) {
  const moneda = useMoneda();
  const [texto, setTexto] = useState(() =>
    valor !== undefined && valor > 0 ? moneda.formatNumero(valor) : "",
  );

  // Si el valor cambia desde fuera (abrir el diálogo en modo edición) se refleja.
  useEffect(() => {
    const actual = moneda.parse(texto);
    if (valor !== undefined && valor !== actual) {
      setTexto(valor > 0 ? moneda.formatNumero(valor) : "");
    }
    // Solo reacciona al valor externo, no a cada tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  function escribir(entrada: string) {
    const numero = moneda.parse(entrada);
    if (entrada.trim() === "") {
      setTexto("");
      onChange(0);
      return;
    }
    if (Number.isNaN(numero)) {
      setTexto(entrada);
      return;
    }
    // Mientras el usuario está escribiendo los decimales no se reformatea,
    // si no sería imposible escribir "1.250,5".
    const escribiendoDecimales = /[.,]\d*$/.test(entrada.trim());
    setTexto(escribiendoDecimales ? entrada : moneda.formatNumero(numero));
    onChange(numero);
  }

  const simbolo = moneda.format(0).replace(/[\d.,\s]/g, "") || "$";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-campo border-2 px-4 py-3 transition-colors",
        invalido
          ? "border-egreso"
          : tono === "ingreso"
            ? "border-ingreso/40 bg-ingreso-suave/40 focus-within:border-ingreso"
            : "border-egreso/40 bg-egreso-suave/40 focus-within:border-egreso",
      )}
    >
      <span
        className={cn(
          "text-xl font-semibold",
          tono === "ingreso" ? "text-ingreso" : "text-egreso",
        )}
        aria-hidden
      >
        {simbolo}
      </span>
      <input
        id={id}
        value={texto}
        onChange={(e) => escribir(e.target.value)}
        // decimal abre el teclado numérico en el móvil sin bloquear el separador.
        inputMode="decimal"
        autoComplete="off"
        {...(focoInicial ? { [FOCO_INICIAL]: "" } : {})}
        placeholder="0"
        aria-invalid={invalido}
        className={cn(
          "cifra w-full bg-transparent text-right text-2xl font-semibold outline-none placeholder:text-texto-suave/50",
          tono === "ingreso" ? "text-ingreso" : "text-egreso",
        )}
      />
    </div>
  );
}
