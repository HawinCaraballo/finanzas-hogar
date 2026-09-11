"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Link2, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Boton } from "@/components/ui/button";
import { Campo, Entrada, Seleccion } from "@/components/ui/campos";
import { Tarjeta } from "@/components/ui/card";
import { Dialogo, DialogoContenido } from "@/components/ui/dialog";
import { Insignia } from "@/components/ui/varios";
import { fechaLegible } from "@/lib/periodo";
import { invitacionSchema } from "@/lib/validaciones";
import {
  cambiarRol,
  crearInvitacion,
  expulsarMiembro,
  revocarInvitacion,
} from "@/server/hogares";

type Miembro = {
  id: string;
  role: "ADMIN" | "MIEMBRO";
  user: { id: string; nombre: string; email: string };
};

type Invitacion = {
  id: string;
  email: string;
  role: "ADMIN" | "MIEMBRO";
  token: string;
  expiresAt: string;
};

export function GestorMiembros({
  miembros,
  invitaciones,
  esAdmin,
  usuarioActualId,
}: {
  miembros: Miembro[];
  invitaciones: Invitacion[];
  esAdmin: boolean;
  usuarioActualId: string;
}) {
  const router = useRouter();
  const [invitando, setInvitando] = useState(false);
  const [enlaceNuevo, setEnlaceNuevo] = useState<string | null>(null);

  async function correr(promesa: Promise<{ ok: boolean; error?: string }>, mensaje: string) {
    const res = await promesa;
    if (!res.ok) {
      toast.error(res.error ?? "No pudimos completar la operación.");
      return;
    }
    toast.success(mensaje);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-texto">
            Miembros ({miembros.length})
          </h2>
          {esAdmin && (
            <Boton tamano="sm" onClick={() => setInvitando(true)}>
              <UserPlus aria-hidden />
              Invitar
            </Boton>
          )}
        </div>

        <Tarjeta className="overflow-hidden">
          <ul className="divide-y divide-borde">
            {miembros.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-superficie-2 text-xs font-semibold text-texto">
                  {m.user.nombre.slice(0, 2).toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-medium text-texto">
                    {m.user.nombre}
                    {m.user.id === usuarioActualId && <Insignia>Tú</Insignia>}
                  </p>
                  <p className="truncate text-xs text-texto-suave">{m.user.email}</p>
                </div>

                {esAdmin ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <Seleccion
                      value={m.role}
                      onChange={(e) =>
                        correr(
                          cambiarRol(m.id, e.target.value as "ADMIN" | "MIEMBRO"),
                          "Permiso actualizado.",
                        )
                      }
                      aria-label={`Rol de ${m.user.nombre}`}
                      className="h-9 w-auto text-sm"
                    >
                      <option value="ADMIN">Administrador</option>
                      <option value="MIEMBRO">Miembro</option>
                    </Seleccion>
                    {m.user.id !== usuarioActualId && (
                      <Boton
                        variante="fantasma"
                        tamano="iconoSm"
                        onClick={() =>
                          correr(expulsarMiembro(m.id), "La persona salió del hogar.")
                        }
                        aria-label={`Sacar a ${m.user.nombre}`}
                      >
                        <Trash2 className="text-egreso" aria-hidden />
                      </Boton>
                    )}
                  </div>
                ) : (
                  <Insignia tono={m.role === "ADMIN" ? "marca" : "neutro"}>
                    {m.role === "ADMIN" ? "Administrador" : "Miembro"}
                  </Insignia>
                )}
              </li>
            ))}
          </ul>
        </Tarjeta>
      </section>

      {esAdmin && invitaciones.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-texto">Invitaciones pendientes</h2>
          <Tarjeta className="overflow-hidden">
            <ul className="divide-y divide-borde">
              {invitaciones.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-superficie-2 text-texto-suave">
                    <Link2 className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-texto">{i.email}</p>
                    <p className="text-xs text-texto-suave">
                      {i.role === "ADMIN" ? "Administrador" : "Miembro"} · vence{" "}
                      <span className="first-letter:uppercase">{fechaLegible(i.expiresAt)}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <BotonCopiar enlace={enlaceDe(i.token)} />
                    <Boton
                      variante="fantasma"
                      tamano="iconoSm"
                      onClick={() => correr(revocarInvitacion(i.id), "Invitación revocada.")}
                      aria-label={`Revocar invitación de ${i.email}`}
                    >
                      <Trash2 className="text-egreso" aria-hidden />
                    </Boton>
                  </div>
                </li>
              ))}
            </ul>
          </Tarjeta>
        </section>
      )}

      <Dialogo
        open={invitando}
        onOpenChange={(a) => {
          setInvitando(a);
          if (!a) setEnlaceNuevo(null);
        }}
      >
        {invitando && (
          <DialogoContenido
            titulo="Invitar a alguien"
            descripcion="Se genera un enlace de un solo uso que puedes enviar por WhatsApp o correo."
          >
            {enlaceNuevo ? (
              <div className="space-y-4">
                <p className="text-sm text-texto">
                  Listo. Comparte este enlace con la persona; vence en 7 días.
                </p>
                <div className="flex items-center gap-2 rounded-app border border-borde bg-superficie-2 p-3">
                  <code className="min-w-0 flex-1 truncate text-xs text-texto">{enlaceNuevo}</code>
                  <BotonCopiar enlace={enlaceNuevo} />
                </div>
                <Boton
                  variante="secundario"
                  className="w-full"
                  onClick={() => {
                    setEnlaceNuevo(null);
                    setInvitando(false);
                    router.refresh();
                  }}
                >
                  Cerrar
                </Boton>
              </div>
            ) : (
              <FormularioInvitacion onCreada={setEnlaceNuevo} />
            )}
          </DialogoContenido>
        )}
      </Dialogo>
    </div>
  );
}

function enlaceDe(token: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/invitacion/${token}`;
}

function BotonCopiar({ enlace }: { enlace: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      toast.success("Enlace copiado.");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("No pudimos copiarlo. Selecciona el enlace y cópialo a mano.");
    }
  }

  return (
    <Boton variante="fantasma" tamano="iconoSm" onClick={copiar} aria-label="Copiar enlace">
      {copiado ? <Check className="text-ingreso" aria-hidden /> : <Copy aria-hidden />}
    </Boton>
  );
}

function FormularioInvitacion({ onCreada }: { onCreada: (enlace: string) => void }) {
  type Datos = z.infer<typeof invitacionSchema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({
    resolver: zodResolver(invitacionSchema),
    defaultValues: { email: "", role: "MIEMBRO" },
  });

  const enviar = handleSubmit(async (valores) => {
    const res = await crearInvitacion(valores);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    onCreada(enlaceDe(res.data.token));
  });

  return (
    <form onSubmit={enviar} className="space-y-4" noValidate>
      <Campo
        etiqueta="Correo de la persona"
        htmlFor="email-inv"
        ayuda="Se usa para identificar la invitación; el enlace lo compartes tú."
        error={errors.email?.message}
      >
        <Entrada
          id="email-inv"
          type="email"
          inputMode="email"
          placeholder="persona@ejemplo.com"
          {...register("email")}
        />
      </Campo>

      <Campo
        etiqueta="Permisos"
        htmlFor="rol-inv"
        ayuda="El miembro registra movimientos; el administrador además gestiona el hogar."
      >
        <Seleccion id="rol-inv" {...register("role")}>
          <option value="MIEMBRO">Miembro</option>
          <option value="ADMIN">Administrador</option>
        </Seleccion>
      </Campo>

      <Boton type="submit" className="w-full" tamano="lg" cargando={isSubmitting}>
        Generar enlace
      </Boton>
    </form>
  );
}
