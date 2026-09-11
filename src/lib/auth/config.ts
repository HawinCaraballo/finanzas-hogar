import type { NextAuthConfig } from "next-auth";

/**
 * Configuración compartida entre el middleware (que corre en el edge y no
 * puede cargar Prisma) y el runtime de Node. Los proveedores se añaden solo
 * en el archivo de Node.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.nombre = (user as { nombre?: string }).nombre ?? user.name ?? "";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.nombre = (token.nombre as string) ?? "";
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
