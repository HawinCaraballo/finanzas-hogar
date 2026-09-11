"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Boton } from "@/components/ui/button";
import { Campo, Entrada, Seleccion } from "@/components/ui/campos";
import { MONEDAS } from "@/lib/categorias-default";
import { hogarSchema, type HogarInput } from "@/lib/validaciones";
import { actualizarHogar, crearHogar } from "@/server/hogares";

export function FormularioHogar({
  modo,
  inicial,
}: {
  modo: "crear" | "editar";
  inicial?: HogarInput;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<HogarInput>({
    resolver: zodResolver(hogarSchema),
    defaultValues: inicial ?? { nombre: "", currency: "COP", locale: "es-CO" },
  });

  const enviar = handleSubmit(async (valores) => {
    const res = modo === "crear" ? await crearHogar(valores) : await actualizarHogar(valores);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    if (modo === "crear") {
      toast.success("Hogar creado. Ya puedes registrar movimientos.");
      router.replace("/dashboard");
    } else {
      toast.success("Cambios guardados.");
    }
    router.refresh();
  });

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <Campo
        etiqueta="Nombre del hogar"
        htmlFor="nombre-hogar"
        ayuda="Por ejemplo: Casa, Apartamento 302, Finanzas familia."
        error={errors.nombre?.message}
      >
        <Entrada
          id="nombre-hogar"
          placeholder="Casa"
          aria-invalid={!!errors.nombre}
          {...register("nombre")}
        />
      </Campo>

      <Campo
        etiqueta="Moneda"
        htmlFor="moneda"
        ayuda="Con esta moneda se muestran todos los montos del hogar."
        error={errors.currency?.message}
      >
        <Seleccion
          id="moneda"
          {...register("currency", {
            onChange: (e) => {
              // El locale acompaña a la moneda: decide separadores y decimales.
              const elegida = MONEDAS.find((m) => m.currency === e.target.value);
              if (elegida) setValue("locale", elegida.locale);
            },
          })}
        >
          {MONEDAS.map((m) => (
            <option key={m.currency} value={m.currency}>
              {m.etiqueta}
            </option>
          ))}
        </Seleccion>
      </Campo>

      <input type="hidden" {...register("locale")} />

      <Boton type="submit" className="w-full" tamano="lg" cargando={isSubmitting}>
        {modo === "crear" ? "Crear hogar" : "Guardar cambios"}
      </Boton>
    </form>
  );
}
