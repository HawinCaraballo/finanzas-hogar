import type { Metadata } from "next";
import Link from "next/link";
import { FormularioRegistro } from "./formulario";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function PaginaRegistro() {
  return (
    <div className="rounded-app bg-superficie hairline p-6">
      <h2 className="text-body font-semibold text-texto">Crea tu cuenta</h2>
      <p className="mb-5 mt-1 text-caption text-texto-suave">
        En el siguiente paso creas tu hogar o te unes a uno.
      </p>

      <FormularioRegistro />

      <p className="mt-5 text-center text-caption text-texto-suave">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-marca-fuerte hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
