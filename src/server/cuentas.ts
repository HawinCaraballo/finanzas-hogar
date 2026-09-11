"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db";
import { loginSchema, registroSchema } from "@/lib/validaciones";
import { comoFallo, exito, fallo, type Resultado } from "./resultado";

export async function registrarCuenta(entrada: unknown): Promise<Resultado> {
  try {
    const datos = registroSchema.parse(entrada);

    const existente = await prisma.user.findUnique({ where: { email: datos.email } });
    if (existente) {
      return fallo("Ya hay una cuenta con ese correo. Inicia sesión.");
    }

    await prisma.user.create({
      data: {
        email: datos.email,
        nombre: datos.nombre,
        passwordHash: await hashPassword(datos.password),
      },
    });

    await signIn("credentials", {
      email: datos.email,
      password: datos.password,
      redirect: false,
    });

    return exito();
  } catch (e) {
    if (e instanceof AuthError) {
      return fallo("Creamos la cuenta pero no pudimos iniciar sesión. Entra manualmente.");
    }
    return comoFallo(e);
  }
}

export async function entrar(entrada: unknown): Promise<Resultado> {
  try {
    const datos = loginSchema.parse(entrada);
    await signIn("credentials", { ...datos, redirect: false });
    return exito();
  } catch (e) {
    if (e instanceof AuthError) {
      // Mensaje genérico a propósito: no revelamos si el correo existe.
      return fallo("Correo o contraseña incorrectos.");
    }
    return comoFallo(e);
  }
}

export async function salir(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
