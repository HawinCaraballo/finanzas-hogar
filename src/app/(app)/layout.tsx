import { requireHogar } from "@/lib/auth/guard";
import { MonedaProvider } from "@/components/moneda-provider";
import { BarraLateral } from "@/components/layout/barra-lateral";
import { BarraSuperiorMovil, NavegacionMovil } from "@/components/layout/navegacion-movil";
import { ProveedorMovimiento } from "@/components/movimientos/proveedor-movimiento";
import { creditosActivos } from "@/server/creditos";
import { miembrosDelHogar } from "@/server/hogares";
import { categoriasDelHogar } from "@/server/movimientos";

/**
 * Armazón de la aplicación. Resuelve el hogar activo una sola vez y deja
 * disponibles la moneda y el formulario de movimientos para todas las páginas.
 */
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const ctx = await requireHogar();
  const [categorias, creditos, miembros] = await Promise.all([
    categoriasDelHogar(),
    creditosActivos(),
    miembrosDelHogar(),
  ]);

  return (
    <MonedaProvider config={{ currency: ctx.hogar.currency, locale: ctx.hogar.locale }}>
      <ProveedorMovimiento
        categorias={categorias}
        creditos={creditos}
        miembros={miembros}
        usuarioActualId={ctx.user.id}
      >
        <div className="min-h-dvh bg-fondo">
          <BarraLateral
            hogares={ctx.hogares}
            hogar={ctx.hogar}
            usuario={{ nombre: ctx.user.nombre, email: ctx.user.email }}
            esAdmin={ctx.esAdmin}
          />
          <BarraSuperiorMovil
            hogares={ctx.hogares}
            hogar={ctx.hogar}
            usuario={{ nombre: ctx.user.nombre, email: ctx.user.email }}
          />

          <main className="pb-navegacion md:pl-64">
            <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-8 sm:py-10">{children}</div>
          </main>

          <NavegacionMovil />
        </div>
      </ProveedorMovimiento>
    </MonedaProvider>
  );
}
