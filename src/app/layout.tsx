import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

/**
 * Poppins es la única tipografía del sistema: geométrica y de remates
 * redondeados, hace juego con los botones píldora y las tarjetas de 24 px.
 * Peso 300 solo para titulares grandes; 500 para etiquetas de interfaz.
 */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Finanzas del hogar",
    template: "%s · Finanzas del hogar",
  },
  description:
    "Lleva los ingresos y gastos de tu casa en un solo lugar, con un resumen mes a mes.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6f8" },
    { media: "(prefers-color-scheme: dark)", color: "#14151d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={poppins.variable} suppressHydrationWarning>
      <head>
        {/*
          Aplica el tema antes del primer pintado para que no haya un
          destello blanco cuando el usuario tiene el modo oscuro activo.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('tema');if(t==='oscuro'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
