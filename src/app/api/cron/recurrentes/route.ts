import { NextResponse } from "next/server";
import { ejecutarRecurrentes } from "@/lib/motor-recurrentes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron diario (ver vercel.json). Genera los movimientos recurrentes de todos
 * los hogares. Vercel Cron envía CRON_SECRET como Bearer token; sin él la ruta
 * queda abierta a cualquiera, así que se rechaza la petición.
 */
export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) {
    return NextResponse.json(
      { error: "CRON_SECRET no está configurado en el servidor." },
      { status: 500 },
    );
  }

  const autorizacion = request.headers.get("authorization");
  if (autorizacion !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const resultado = await ejecutarRecurrentes();
    return NextResponse.json({ ok: true, ...resultado });
  } catch (e) {
    console.error("Fallo el cron de recurrentes:", e);
    return NextResponse.json({ error: "Fallo la ejecución." }, { status: 500 });
  }
}
