"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { COOKIE_HOGAR, requireAdmin, requireHogar, requireUser } from "@/lib/auth/guard";
import { CATEGORIAS_POR_DEFECTO } from "@/lib/categorias-default";
import { prisma } from "@/lib/db";
import { hogarSchema, invitacionSchema } from "@/lib/validaciones";
import { comoFallo, exito, fallo, type Resultado } from "./resultado";

const DIAS_VIGENCIA_INVITACION = 7;
const UN_ANO = 60 * 60 * 24 * 365;

async function fijarHogarActivo(householdId: string) {
  (await cookies()).set(COOKIE_HOGAR, householdId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UN_ANO,
  });
}

export async function crearHogar(entrada: unknown): Promise<Resultado<{ id: string }>> {
  try {
    const user = await requireUser();
    const datos = hogarSchema.parse(entrada);

    const hogar = await prisma.$transaction(async (tx) => {
      const creado = await tx.household.create({ data: datos });
      await tx.householdMember.create({
        data: { userId: user.id, householdId: creado.id, role: "ADMIN" },
      });
      // Un hogar sin categorías no sirve para nada; se siembran de una vez.
      await tx.category.createMany({
        data: CATEGORIAS_POR_DEFECTO.map((c) => ({ ...c, householdId: creado.id, isSystem: true })),
      });
      return creado;
    });

    await fijarHogarActivo(hogar.id);
    revalidatePath("/", "layout");
    return exito({ id: hogar.id });
  } catch (e) {
    return comoFallo(e);
  }
}

export async function cambiarHogar(householdId: string): Promise<Resultado> {
  try {
    const user = await requireUser();
    const membresia = await prisma.householdMember.findUnique({
      where: { userId_householdId: { userId: user.id, householdId } },
    });
    if (!membresia) return fallo("No perteneces a ese hogar.");

    await fijarHogarActivo(householdId);
    revalidatePath("/", "layout");
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

export async function actualizarHogar(entrada: unknown): Promise<Resultado> {
  try {
    const ctx = await requireAdmin();
    const datos = hogarSchema.parse(entrada);
    await prisma.household.update({ where: { id: ctx.hogar.id }, data: datos });
    revalidatePath("/", "layout");
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

export async function crearInvitacion(entrada: unknown): Promise<Resultado<{ token: string }>> {
  try {
    const ctx = await requireAdmin();
    const datos = invitacionSchema.parse(entrada);

    const yaEsMiembro = await prisma.householdMember.findFirst({
      where: { householdId: ctx.hogar.id, user: { email: datos.email } },
    });
    if (yaEsMiembro) return fallo("Esa persona ya es miembro del hogar.");

    const token = randomBytes(24).toString("base64url");
    const expiresAt = new Date(Date.now() + DIAS_VIGENCIA_INVITACION * 86_400_000);

    await prisma.invitation.create({
      data: { householdId: ctx.hogar.id, email: datos.email, role: datos.role, token, expiresAt },
    });

    revalidatePath("/hogar");
    return exito({ token });
  } catch (e) {
    return comoFallo(e);
  }
}

export async function revocarInvitacion(id: string): Promise<Resultado> {
  try {
    const ctx = await requireAdmin();
    // El where incluye el hogar: así un id de otro hogar simplemente no borra nada.
    const { count } = await prisma.invitation.deleteMany({
      where: { id, householdId: ctx.hogar.id },
    });
    if (count === 0) return fallo("Esa invitación ya no existe.");
    revalidatePath("/hogar");
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

export async function aceptarInvitacion(token: string): Promise<Resultado<{ id: string }>> {
  try {
    const user = await requireUser();

    const invitacion = await prisma.invitation.findUnique({ where: { token } });
    if (!invitacion) return fallo("Esta invitación no existe.");
    if (invitacion.acceptedAt) return fallo("Esta invitación ya se usó.");
    if (invitacion.expiresAt < new Date()) return fallo("Esta invitación venció.");

    await prisma.$transaction(async (tx) => {
      await tx.householdMember.upsert({
        where: { userId_householdId: { userId: user.id, householdId: invitacion.householdId } },
        update: {},
        create: {
          userId: user.id,
          householdId: invitacion.householdId,
          role: invitacion.role,
        },
      });
      await tx.invitation.update({
        where: { id: invitacion.id },
        data: { acceptedAt: new Date() },
      });
    });

    await fijarHogarActivo(invitacion.householdId);
    revalidatePath("/", "layout");
    return exito({ id: invitacion.householdId });
  } catch (e) {
    return comoFallo(e);
  }
}

export async function cambiarRol(memberId: string, role: "ADMIN" | "MIEMBRO"): Promise<Resultado> {
  try {
    const ctx = await requireAdmin();
    const miembro = await prisma.householdMember.findFirst({
      where: { id: memberId, householdId: ctx.hogar.id },
    });
    if (!miembro) return fallo("Ese miembro no existe en este hogar.");

    if (miembro.role === "ADMIN" && role === "MIEMBRO" && (await esUnicoAdmin(ctx.hogar.id))) {
      return fallo("El hogar debe tener al menos un administrador.");
    }

    await prisma.householdMember.update({ where: { id: memberId }, data: { role } });
    revalidatePath("/hogar");
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

export async function expulsarMiembro(memberId: string): Promise<Resultado> {
  try {
    const ctx = await requireAdmin();
    const miembro = await prisma.householdMember.findFirst({
      where: { id: memberId, householdId: ctx.hogar.id },
    });
    if (!miembro) return fallo("Ese miembro no existe en este hogar.");
    if (miembro.userId === ctx.user.id) return fallo("No puedes sacarte a ti mismo del hogar.");
    if (miembro.role === "ADMIN" && (await esUnicoAdmin(ctx.hogar.id))) {
      return fallo("El hogar debe tener al menos un administrador.");
    }

    // Sus movimientos se quedan en el hogar: son historia del hogar, no suya.
    await prisma.householdMember.delete({ where: { id: memberId } });
    revalidatePath("/hogar");
    return exito();
  } catch (e) {
    return comoFallo(e);
  }
}

async function esUnicoAdmin(householdId: string): Promise<boolean> {
  const admins = await prisma.householdMember.count({
    where: { householdId, role: "ADMIN" },
  });
  return admins <= 1;
}

/** Datos de la pantalla de administración del hogar. */
export async function datosDelHogar() {
  const ctx = await requireHogar();
  const [miembros, invitaciones] = await Promise.all([
    prisma.householdMember.findMany({
      where: { householdId: ctx.hogar.id },
      include: { user: { select: { id: true, nombre: true, email: true } } },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    }),
    prisma.invitation.findMany({
      where: { householdId: ctx.hogar.id, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { ctx, miembros, invitaciones };
}
