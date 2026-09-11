"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Boton } from "@/components/ui/button";
import { Campo, Entrada } from "@/components/ui/campos";
import { loginSchema } from "@/lib/validaciones";
import { entrar } from "@/server/cuentas";

type Datos = z.infer<typeof loginSchema>;

export function FormularioLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const volverA = params.get("volverA");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const enviar = handleSubmit(async (valores) => {
    const res = await entrar(valores);
    if (!res.ok) {
      setError("password", { message: res.error });
      toast.error(res.error);
      return;
    }
    router.replace(volverA && volverA.startsWith("/") ? volverA : "/dashboard");
    router.refresh();
  });

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
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

      <Campo etiqueta="Contraseña" htmlFor="password" error={errors.password?.message}>
        <Entrada
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </Campo>

      <Boton type="submit" className="w-full" tamano="lg" cargando={isSubmitting}>
        Entrar
      </Boton>
    </form>
  );
}
