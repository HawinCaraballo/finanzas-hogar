import { Wallet } from "lucide-react";

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-fondo px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <span className="grid size-12 place-items-center rounded-icono bg-marca text-marca-texto">
            <Wallet className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="font-display text-heading font-medium text-texto sm:text-heading-lg">
              Finanzas del hogar
            </h1>
            <p className="mt-3 text-caption text-texto-suave">
              Lo que entra y lo que sale, en un solo lugar.
            </p>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
