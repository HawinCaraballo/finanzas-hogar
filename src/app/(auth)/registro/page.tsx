import type { Metadata } from "next";
import Link from "next/link";
import { FormularioRegistro } from "./formulario";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function PaginaRegistro() {
  return (
    <div className="rounded-app border border-borde bg-superficie p-6">
      <h2 className="text-base font-semibold text-texto">Crea tu cuenta</h2>
      <p className="mb-5 mt-1 text-sm text-texto-suave">
        En el siguiente paso creas tu hogar o te unes a uno.
      </p>

      <FormularioRegistro />

      <p className="mt-5 text-center text-sm text-texto-suave">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-marca hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
