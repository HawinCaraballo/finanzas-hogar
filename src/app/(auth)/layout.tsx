import { Wallet } from "lucide-react";

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-fondo px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <span className="marca-prisma grid size-14 place-items-center rounded-boton p-[3px]">
            <span className="grid size-full place-items-center rounded-boton bg-superficie text-marca-fuerte">
              <Wallet className="size-6" aria-hidden />
            </span>
          </span>
          <div>
            <h1 className="text-heading-sm font-medium text-texto">Finanzas del hogar</h1>
            <p className="mt-2 text-body-sm text-texto-suave">
              Lo que entra y lo que sale, en un solo lugar.
            </p>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
