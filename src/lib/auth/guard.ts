import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const COOKIE_HOGAR = "hogar_activo";

export type UsuarioSesion = { id: string; email: string; nombre: string };

export type Hogar = {
  id: string;
  nombre: string;
  currency: string;
  locale: string;
};

export type Contexto = {
  user: UsuarioSesion;
  hogar: Hogar;
  role: Role;
  esAdmin: boolean;
  /** Todos los hogares del usuario, para el selector de la barra superior. */
  hogares: Hogar[];
};

export async function usuarioActual(): Promise<UsuarioSesion | null> {
  const sesion = await auth();
  if (!sesion?.user?.id) return null;
  return {
    id: sesion.user.id,
    email: sesion.user.email ?? "",
    nombre: sesion.user.nombre || sesion.user.name || "",
  };
}

export async function requireUser(): Promise<UsuarioSesion> {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  return usuario;
}

/**
 * Punto único de autorización. Resuelve el hogar activo a partir de la cookie,
 * verificando SIEMPRE que el usuario sea miembro. Ninguna consulta de la app
 * debe recibir un householdId enviado por el cliente: lo toma de aquí.
 */
export async function requireHogar(): Promise<Contexto> {
  const user = await requireUser();

  const membresias = await prisma.householdMember.findMany({
    where: { userId: user.id },
    include: { household: true },
    orderBy: { joinedAt: "asc" },
  });

  if (membresias.length === 0) redirect("/onboarding");

  const deseado = (await cookies()).get(COOKIE_HOGAR)?.value;
  const activa =
    membresias.find((m) => m.householdId === deseado) ?? membresias[0];

  return {
    user,
    hogar: aHogar(activa.household),
    role: activa.role,
    esAdmin: activa.role === "ADMIN",
    hogares: membresias.map((m) => aHogar(m.household)),
  };
}

/** Para acciones que solo puede ejecutar un administrador del hogar. */
export async function requireAdmin(): Promise<Contexto> {
  const ctx = await requireHogar();
  if (!ctx.esAdmin) {
    throw new Error("Solo un administrador del hogar puede hacer esto.");
  }
  return ctx;
}

function aHogar(h: { id: string; nombre: string; currency: string; locale: string }): Hogar {
  return { id: h.id, nombre: h.nombre, currency: h.currency, locale: h.locale };
}
