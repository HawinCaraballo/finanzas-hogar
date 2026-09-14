import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

/** Inter sostiene toda la capa de utilidad: navegación, cuerpo y etiquetas. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/*
  El manual pide su tipografía propia "Family" para los titulares de portada y
  prohíbe usar Inter a ese tamaño. Esa fuente no es pública, así que se usa
  Archivo —grotesca ligeramente condensada, en la línea de los sustitutos que
  el propio manual sugiere— y solo donde de verdad hay un titular de portada.
*/
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-archivo",
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
    { media: "(prefers-color-scheme: light)", color: "#fbfaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${archivo.variable}`}
      suppressHydrationWarning
    >
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
