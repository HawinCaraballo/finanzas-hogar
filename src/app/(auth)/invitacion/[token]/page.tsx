import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { Boton } from "@/components/ui/button";
import { AceptarInvitacion } from "./aceptar";

export const metadata: Metadata = { title: "Invitación a un hogar" };

export default async function PaginaInvitacion({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invitacion = await prisma.invitation.findUnique({
    where: { token },
    include: { household: { select: { nombre: true } } },
  });

  const problema = !invitacion
    ? "Esta invitación no existe o el enlace está incompleto."
    : invitacion.acceptedAt
      ? "Esta invitación ya se usó."
      : invitacion.expiresAt < new Date()
        ? "Esta invitación venció. Pídele al administrador que te envíe una nueva."
        : null;

  if (problema || !invitacion) {
    return (
      <div className="rounded-app bg-superficie hairline p-6 text-center">
        <h2 className="text-body font-semibold text-texto">No pudimos abrir la invitación</h2>
        <p className="mt-2 text-caption text-texto-suave">{problema}</p>
        <Boton asChild variante="secundario" className="mt-5 w-full">
          <Link href="/dashboard">Ir a la aplicación</Link>
        </Boton>
      </div>
    );
  }

  const usuario = await usuarioActual();
  if (!usuario) {
    // Tras iniciar sesión vuelve aquí y el botón de aceptar ya estará disponible.
    redirect(`/login?volverA=/invitacion/${token}`);
  }

  return (
    <div className="rounded-app bg-superficie hairline p-6 text-center">
      <h2 className="text-body font-semibold text-texto">
        Te invitaron a {invitacion.household.nombre}
      </h2>
      <p className="mt-2 text-caption text-texto-suave">
        Al aceptar podrás ver y registrar los movimientos de ese hogar como{" "}
        {invitacion.role === "ADMIN" ? "administrador" : "miembro"}.
      </p>
      <AceptarInvitacion token={token} />
    </div>
  );
}
