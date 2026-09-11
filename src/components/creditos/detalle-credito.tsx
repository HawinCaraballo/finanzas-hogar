"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMoneda } from "@/components/moneda-provider";
import { CampoMonto } from "@/components/movimientos/campo-monto";
import { Boton } from "@/components/ui/button";
import { Campo, AreaTexto, Entrada } from "@/components/ui/campos";
import { Dialogo, DialogoContenido } from "@/components/ui/dialog";
import { aFechaISO } from "@/lib/periodo";
import type { CreditoConResumen } from "@/lib/tipos";
import { pagoCuotaSchema } from "@/lib/validaciones";
import { eliminarCredito, pagarCuota, reabrirCredito } from "@/server/creditos";
import type { z } from "zod";

type PagoInput = z.infer<typeof pagoCuotaSchema>;

/** Acciones del detalle: registrar una cuota, reabrir o eliminar el crédito. */
export function AccionesCredito({ credito }: { credito: CreditoConResumen }) {
  const router = useRouter();
  const [pagando, setPagando] = useState(false);

  async function reabrir() {
    const res = await reabrirCredito(credito.id, !credito.activo);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(credito.activo ? "Crédito marcado como pagado." : "Crédito reabierto.");
    router.refresh();
  }

  async function borrar() {
    const res = await eliminarCredito(credito.id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Crédito eliminado. Los pagos registrados siguen en el historial.");
    router.push("/creditos");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {credito.activo && credito.resumen.cuotasRestantes > 0 && (
          <Boton onClick={() => setPagando(true)}>Registrar cuota</Boton>
        )}
        <Boton variante="secundario" onClick={reabrir}>
          <RotateCcw aria-hidden />
          {credito.activo ? "Marcar como pagado" : "Reabrir"}
        </Boton>
        <Boton variante="contorno" onClick={borrar} aria-label="Eliminar crédito">
          <Trash2 className="text-egreso" aria-hidden />
        </Boton>
      </div>

      <Dialogo open={pagando} onOpenChange={setPagando}>
        {pagando && (
          <DialogoContenido
            titulo="Registrar cuota"
            descripcion={`Cuota ${credito.resumen.cuotasPagadas + 1} de ${credito.totalInstallments}`}
          >
            <FormularioPago
              credito={credito}
              onListo={() => {
                setPagando(false);
                router.refresh();
              }}
            />
          </DialogoContenido>
        )}
      </Dialogo>
    </>
  );
}

function FormularioPago({
  credito,
  onListo,
}: {
  credito: CreditoConResumen;
  onListo: () => void;
}) {
  const moneda = useMoneda();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PagoInput>({
    resolver: zodResolver(pagoCuotaSchema),
    defaultValues: {
      loanId: credito.id,
      // Se precarga el valor de la cuota: el caso normal es pagar exactamente eso.
      amount: credito.installmentAmount,
      date: aFechaISO(new Date()),
      notas: "",
    },
  });

  const enviar = handleSubmit(async (valores) => {
    const res = await pagarCuota(valores);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Cuota registrada como gasto.");
    onListo();
  });

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <input type="hidden" {...register("loanId")} />

      <Campo
        etiqueta="Monto pagado"
        htmlFor="monto-cuota"
        ayuda={`Saldo pendiente: ${moneda.format(credito.resumen.saldoPendiente)}`}
        error={errors.amount?.message}
      >
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <CampoMonto
              id="monto-cuota"
              valor={field.value}
              onChange={field.onChange}
              tono="egreso"
              invalido={!!errors.amount}
            />
          )}
        />
      </Campo>

      <Campo etiqueta="Fecha" htmlFor="fecha-cuota" error={errors.date?.message}>
        <Entrada id="fecha-cuota" type="date" {...register("date")} />
      </Campo>

      <Campo etiqueta="Notas" htmlFor="notas-cuota">
        <AreaTexto id="notas-cuota" placeholder="Opcional" {...register("notas")} />
      </Campo>

      <Boton type="submit" variante="peligro" className="w-full" tamano="lg" cargando={isSubmitting}>
        Registrar pago
      </Boton>
    </form>
  );
}
