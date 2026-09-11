import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FormularioLogin } from "./formulario";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function PaginaLogin() {
  return (
    <div className="rounded-app border border-borde bg-superficie p-6">
      <h2 className="text-base font-semibold text-texto">Inicia sesión</h2>
      <p className="mb-5 mt-1 text-sm text-texto-suave">Entra con tu correo y contraseña.</p>

      <Suspense fallback={null}>
        <FormularioLogin />
      </Suspense>

      <p className="mt-5 text-center text-sm text-texto-suave">
        ¿Todavía no tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-marca hover:underline">
          Crea una
        </Link>
      </p>
    </div>
  );
}
