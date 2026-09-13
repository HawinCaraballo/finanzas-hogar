"use client";

import { Users } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CLAVE_HOGAR, claveAlcance, type Alcance, type MiembroBasico } from "@/lib/alcance";
import { Seleccion } from "@/components/ui/campos";
import { cn } from "@/lib/utils";

/**
 * De quién son las cifras que se están viendo. Igual que el selector de mes, el
 * valor vive en la URL (?quien=) para que el botón "atrás" funcione y la vista
 * se pueda compartir tal cual.
 */
export function SelectorAlcance({
  alcance,
  miembros,
  usuarioActualId,
  className,
}: {
  alcance: Alcance;
  miembros: MiembroBasico[];
  usuarioActualId: string;
  className?: string;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();

  // En un hogar de una sola persona no hay nada que elegir.
  if (miembros.length < 2) return null;

  function elegir(valor: string) {
    const siguientes = new URLSearchParams(params);
    if (valor === CLAVE_HOGAR) siguientes.delete("quien");
    else siguientes.set("quien", valor);
    router.push(`${ruta}?${siguientes.toString()}`, { scroll: false });
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Users className="size-4 shrink-0 text-texto-suave" aria-hidden />
      <Seleccion
        value={claveAlcance(alcance)}
        onChange={(e) => elegir(e.target.value)}
        aria-label="De quién son las cifras"
        className="h-9 w-auto min-w-40 text-sm"
      >
        <option value={CLAVE_HOGAR}>Todo el hogar</option>
        {miembros.map((m) => (
          <option key={m.id} value={m.id}>
            {m.id === usuarioActualId ? `${m.nombre} (yo)` : m.nombre}
          </option>
        ))}
      </Seleccion>
    </div>
  );
}
