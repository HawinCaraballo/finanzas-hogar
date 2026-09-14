import { expect, test, type Page } from "@playwright/test";

/**
 * La garantía de esta funcionalidad: cada movimiento pertenece a una persona y
 * al hogar a la vez, así que el total del hogar tiene que ser exactamente la
 * suma de las cuentas individuales.
 *
 * El recorrido monta un hogar de verdad con dos personas —incluida la
 * invitación por enlace— porque es la única forma de probar el reparto.
 */

const CLAVE = "prueba1234";

function correoUnico(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@prueba.test`;
}

async function registrarCuenta(page: Page, nombre: string): Promise<string> {
  const email = correoUnico("cuentas");
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill(nombre);
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(CLAVE);
  await page.getByLabel("Repite la contraseña").fill(CLAVE);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await page.waitForURL("**/onboarding");
  return email;
}

async function crearHogar(page: Page, nombre: string) {
  await page.getByLabel("Nombre del hogar").fill(nombre);
  await page.getByRole("button", { name: "Crear hogar" }).click();
  await page.waitForURL("**/dashboard");
}

/** Genera una invitación y devuelve el enlace que habría que compartir. */
async function invitar(page: Page): Promise<string> {
  await page.goto("/hogar");
  await page.getByRole("button", { name: "Invitar" }).click();

  const dialogo = page.getByRole("dialog");
  await dialogo.getByLabel("Correo de la persona").fill(correoUnico("invitado"));
  await dialogo.getByRole("button", { name: "Generar enlace" }).click();

  const enlace = dialogo.locator("code");
  await expect(enlace).toBeVisible();
  return (await enlace.innerText()).trim();
}

async function registrarMovimiento(
  page: Page,
  opciones: { tipo: "Gasto" | "Ingreso"; monto: string; categoria: string; descripcion: string },
) {
  await page.getByRole("button", { name: "Registrar movimiento" }).first().click();
  const dialogo = page.getByRole("dialog");
  await expect(dialogo).toBeVisible();

  await dialogo.getByRole("radio", { name: opciones.tipo }).click();
  await dialogo.getByLabel("Monto").fill(opciones.monto);
  await dialogo.getByRole("button", { name: opciones.categoria, exact: true }).click();
  await dialogo.getByLabel("Descripción").fill(opciones.descripcion);

  const boton = opciones.tipo === "Gasto" ? "Registrar gasto" : "Registrar ingreso";
  await dialogo.getByRole("button", { name: boton }).click();
  await expect(dialogo).toBeHidden();
}

/**
 * Cambia el alcance del dashboard.
 *
 * Dos detalles del entorno de pruebas, no de la app: el cambio es una
 * navegación de cliente, que no dispara el evento "load" (de ahí toHaveURL y no
 * waitForURL); y la selección puede llegar antes de que React hidrate el
 * onChange, así que se reintenta. Una persona real nunca es tan rápida.
 */
async function verCuentaDe(page: Page, etiqueta: string) {
  const selector = page.getByLabel("De quién son las cifras");
  await expect(selector).toBeEnabled();

  await expect(async () => {
    await selector.selectOption({ label: etiqueta });
    await expect(page).toHaveURL(/quien=/, { timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
}

test("el hogar es la suma de las cuentas individuales", async ({ page, context }) => {
  // --- Ana monta el hogar y aporta 3.000.000 ---
  await registrarCuenta(page, "Ana Prueba");
  await crearHogar(page, "Hogar compartido");
  await registrarMovimiento(page, {
    tipo: "Ingreso",
    monto: "3000000",
    categoria: "Salario",
    descripcion: "Salario de Ana",
  });

  const enlace = await invitar(page);
  expect(enlace).toContain("/invitacion/");

  // --- Luis entra por el enlace y aporta 1.000.000 ---
  await context.clearCookies();
  await registrarCuenta(page, "Luis Prueba");
  await page.goto(new URL(enlace).pathname);
  await page.getByRole("button", { name: "Unirme al hogar" }).click();
  await page.waitForURL("**/dashboard");

  await registrarMovimiento(page, {
    tipo: "Ingreso",
    monto: "1000000",
    categoria: "Salario",
    descripcion: "Salario de Luis",
  });

  // --- La invariante ---
  await page.goto("/reportes");
  await expect(page.getByRole("heading", { name: "Reportes" })).toBeVisible();

  const tabla = page.getByRole("table");
  await expect(tabla).toContainText("Ana Prueba");
  await expect(tabla).toContainText("Luis Prueba");
  // 3.000.000 + 1.000.000 = 4.000.000 en la fila del hogar.
  await expect(tabla.getByRole("row", { name: /Todo el hogar/ })).toContainText("4.000.000");

  // --- Y el selector del dashboard filtra de verdad ---
  await page.goto("/dashboard");
  // 4.000.000 solo puede salir de sumar las dos cuentas: ningún movimiento
  // suelto tiene ese monto.
  await expect(page.locator("body")).toContainText("4.000.000");

  await verCuentaDe(page, "Luis Prueba (yo)");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Luis Prueba");
  await expect(page.locator("body")).toContainText("1.000.000");
  await expect(page.locator("body")).not.toContainText("4.000.000");
  await expect(page.locator("body")).not.toContainText("3.000.000");
});

test("un movimiento se puede atribuir a otra persona del hogar", async ({ page, context }) => {
  await registrarCuenta(page, "Ana Atribuye");
  await crearHogar(page, "Hogar de atribución");
  const enlace = await invitar(page);

  await context.clearCookies();
  await registrarCuenta(page, "Luis Recibe");
  await page.goto(new URL(enlace).pathname);
  await page.getByRole("button", { name: "Unirme al hogar" }).click();
  await page.waitForURL("**/dashboard");

  // Luis registra un gasto, pero lo pagó Ana.
  await page.getByRole("button", { name: "Registrar movimiento" }).first().click();
  const dialogo = page.getByRole("dialog");
  await dialogo.getByLabel("Monto").fill("250000");
  await dialogo.getByRole("button", { name: "Mercado", exact: true }).click();
  await dialogo.getByLabel("Descripción").fill("Mercado que pagó Ana");
  await dialogo.getByLabel("¿Quién lo pagó?").selectOption({ label: "Ana Atribuye" });
  await dialogo.getByRole("button", { name: "Registrar gasto" }).click();
  await expect(dialogo).toBeHidden();

  // La lista lo dice: pagó Ana, lo registró Luis.
  await page.goto("/movimientos");
  const fila = page.locator("li").filter({ hasText: "Mercado que pagó Ana" });
  await expect(fila).toContainText("pagó Ana Atribuye");
  await expect(fila).toContainText("registró Luis Recibe");

  // Y cuenta en la cuenta de Ana, no en la de Luis.
  await page.goto("/dashboard");
  await expect(page.locator("body")).toContainText("250.000");

  await verCuentaDe(page, "Luis Recibe (yo)");
  await expect(page.locator("body")).not.toContainText("250.000");
});
