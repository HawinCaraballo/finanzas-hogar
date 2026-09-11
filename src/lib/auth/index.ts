import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validaciones";
import { authConfig } from "./config";
import { verificarPassword } from "./password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credenciales) {
        const parsed = loginSchema.safeParse(credenciales);
        if (!parsed.success) return null;

        const usuario = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        // Si el correo no existe igual se compara contra un hash falso para que
        // el tiempo de respuesta no revele qué correos están registrados.
        const hash = usuario?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu";
        const coincide = await verificarPassword(parsed.data.password, hash);
        if (!usuario || !coincide) return null;

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nombre,
          nombre: usuario.nombre,
        };
      },
    }),
  ],
});
