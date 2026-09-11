import { Wallet } from "lucide-react";

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-fondo px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-marca text-marca-texto">
            <Wallet className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-texto">Finanzas del hogar</h1>
            <p className="mt-1 text-sm text-texto-suave">
              Lo que entra y lo que sale, en un solo lugar.
            </p>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
