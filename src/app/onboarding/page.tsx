import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { FormularioHogar } from "@/components/hogar/formulario-hogar";

export const metadata: Metadata = { title: "Crea tu hogar" };

export default async function PaginaOnboarding() {
  const user = await requireUser();

  // Si ya pertenece a un hogar no tiene nada que hacer aquí.
  const tieneHogar = await prisma.householdMember.count({ where: { userId: user.id } });
  if (tieneHogar > 0) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-fondo px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <span className="grid size-12 place-items-center rounded-icono bg-marca text-marca-texto">
            <Wallet className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="font-display text-heading font-medium text-texto sm:text-heading-lg">
              Hola, {user.nombre.split(" ")[0]}
            </h1>
            <p className="mt-3 text-caption text-texto-suave">
              Crea el hogar cuyas finanzas vas a llevar. Después puedes invitar a quien viva contigo.
            </p>
          </div>
        </div>

        <div className="rounded-app bg-superficie hairline p-6">
          <FormularioHogar modo="crear" />
        </div>

        <p className="mt-5 text-center text-micro text-texto-suave">
          ¿Te invitaron a un hogar? Abre el enlace que te compartieron y quedarás dentro.
        </p>
      </div>
    </main>
  );
}
