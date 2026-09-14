import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FormularioLogin } from "./formulario";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function PaginaLogin() {
  return (
    <div className="rounded-app bg-superficie hairline p-6">
      <h2 className="text-body font-semibold text-texto">Inicia sesión</h2>
      <p className="mb-5 mt-1 text-caption text-texto-suave">Entra con tu correo y contraseña.</p>

      <Suspense fallback={null}>
        <FormularioLogin />
      </Suspense>

      <p className="mt-5 text-center text-caption text-texto-suave">
        ¿Todavía no tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-marca-fuerte hover:underline">
          Crea una
        </Link>
      </p>
    </div>
  );
}
