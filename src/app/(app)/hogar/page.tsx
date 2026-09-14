import type { Metadata } from "next";
import { FormularioHogar } from "@/components/hogar/formulario-hogar";
import { GestorMiembros } from "@/components/hogar/gestor-miembros";
import { Tarjeta, TarjetaContenido, TarjetaEncabezado, TarjetaTitulo } from "@/components/ui/card";
import { aFechaISO } from "@/lib/periodo";
import { datosDelHogar } from "@/server/hogares";

export const metadata: Metadata = { title: "Hogar" };

export default async function PaginaHogar() {
  const { ctx, miembros, invitaciones } = await datosDelHogar();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-heading font-medium text-texto">{ctx.hogar.nombre}</h1>
        <p className="text-caption text-texto-suave">
          Quién administra estas finanzas y con qué moneda se llevan.
        </p>
      </header>

      <GestorMiembros
        miembros={miembros.map((m) => ({ id: m.id, role: m.role, user: m.user }))}
        invitaciones={invitaciones.map((i) => ({
          id: i.id,
          email: i.email,
          role: i.role,
          token: i.token,
          expiresAt: aFechaISO(i.expiresAt),
        }))}
        esAdmin={ctx.esAdmin}
        usuarioActualId={ctx.user.id}
      />

      {ctx.esAdmin && (
        <Tarjeta>
          <TarjetaEncabezado>
            <TarjetaTitulo>Datos del hogar</TarjetaTitulo>
          </TarjetaEncabezado>
          <TarjetaContenido>
            <FormularioHogar
              modo="editar"
              inicial={{
                nombre: ctx.hogar.nombre,
                currency: ctx.hogar.currency,
                locale: ctx.hogar.locale,
              }}
            />
          </TarjetaContenido>
        </Tarjeta>
      )}
    </div>
  );
}
