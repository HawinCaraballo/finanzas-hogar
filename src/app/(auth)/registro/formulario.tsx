"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Boton } from "@/components/ui/button";
import { Campo, Entrada } from "@/components/ui/campos";
import { registroSchema } from "@/lib/validaciones";
import { registrarCuenta } from "@/server/cuentas";

type Datos = z.infer<typeof registroSchema>;

export function FormularioRegistro() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({
    resolver: zodResolver(registroSchema),
    defaultValues: { nombre: "", email: "", password: "", confirmar: "" },
  });

  const enviar = handleSubmit(async (valores) => {
    const res = await registrarCuenta(valores);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    router.replace("/onboarding");
    router.refresh();
  });

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <Campo etiqueta="Nombre" htmlFor="nombre" error={errors.nombre?.message}>
        <Entrada
          id="nombre"
          autoComplete="name"
          placeholder="Cómo te llamamos"
          aria-invalid={!!errors.nombre}
          {...register("nombre")}
        />
      </Campo>

      <Campo etiqueta="Correo" htmlFor="email" error={errors.email?.message}>
        <Entrada
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="tucorreo@ejemplo.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </Campo>

      <Campo
        etiqueta="Contraseña"
        htmlFor="password"
        ayuda="Mínimo 8 caracteres."
        error={errors.password?.message}
      >
        <Entrada
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </Campo>

      <Campo etiqueta="Repite la contraseña" htmlFor="confirmar" error={errors.confirmar?.message}>
        <Entrada
          id="confirmar"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmar}
          {...register("confirmar")}
        />
      </Campo>

      <Boton type="submit" className="w-full" tamano="lg" cargando={isSubmitting}>
        Crear cuenta
      </Boton>
    </form>
  );
}
