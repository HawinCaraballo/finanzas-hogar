import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

const RUTAS_PUBLICAS = ["/login", "/registro", "/invitacion"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const autenticado = !!req.auth;
  const esPublica = RUTAS_PUBLICAS.some((r) => pathname.startsWith(r));

  if (!autenticado && !esPublica) {
    const destino = new URL("/login", req.nextUrl);
    // Tras iniciar sesión se vuelve a donde el usuario quería entrar.
    if (pathname !== "/") destino.searchParams.set("volverA", pathname);
    return NextResponse.redirect(destino);
  }

  if (autenticado && (pathname === "/login" || pathname === "/registro")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Excluye assets estáticos y las rutas de API de autenticación y cron.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
