import { expect, type BrowserContext, type Page } from "@playwright/test";

/**
 * Cierra la sesión del navegador de pruebas.
 *
 * `context.clearCookies()` a secas no basta. La app dispara `router.refresh()`
 * después de registrar cosas, y esas peticiones pueden responder con
 * `Set-Cookie` y reponer las cookies de Auth.js justo después de haberlas
 * borrado. Cuando la que revive es la de sesión, el middleware manda /registro
 * a /dashboard y la prueba muere esperando un campo que nunca va a aparecer,
 * con un error que no dice nada de la causa.
 *
 * Por eso aquí se espera a que no quede nada en vuelo, y se reintenta el
 * borrado hasta comprobar que de verdad se quedó vacío.
 */
export async function salirDeLaSesion(page: Page, context: BrowserContext) {
  await page.waitForLoadState("networkidle");

  await expect(async () => {
    await context.clearCookies();
    const deAuth = (await context.cookies()).filter((c) => c.name.startsWith("authjs"));
    expect(deAuth).toEqual([]);
  }).toPass({ timeout: 15_000 });
}

/**
 * Abre /registro comprobando que se llegó de verdad.
 *
 * Si quedara sesión, el middleware redirige a /dashboard; fallar aquí dice
 * exactamente eso, en vez de dejar un tiempo de espera agotado sobre un campo.
 */
export async function abrirRegistro(page: Page) {
  await page.goto("/registro");
  await expect(page, "quedó sesión abierta: /registro redirigió al dashboard").toHaveURL(
    /\/registro/,
  );
}
