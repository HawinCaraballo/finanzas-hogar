"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Boton } from "@/components/ui/button";
import { aceptarInvitacion } from "@/server/hogares";

export function AceptarInvitacion({ token }: { token: string }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function aceptar() {
    iniciar(async () => {
      const res = await aceptarInvitacion(token);
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      toast.success("Ya haces parte del hogar.");
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="mt-5 space-y-3">
      <Boton onClick={aceptar} className="w-full" tamano="lg" cargando={pendiente}>
        Unirme al hogar
      </Boton>
      {error && (
        <p role="alert" className="text-xs font-medium text-egreso">
          {error}
        </p>
      )}
    </div>
  );
}
