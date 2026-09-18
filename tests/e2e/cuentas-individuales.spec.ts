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

/**
 * Monta un hogar con dos personas y deja la sesión abierta con la segunda.
 * Devuelve el nombre de la primera, que es a quien se le atribuirán las cosas.
 */
async function hogarConDosPersonas(
  page: Page,
  context: { clearCookies: () => Promise<void> },
  nombreHogar: string,
): Promise<string> {
  const primera = "Ana Titular";
  await registrarCuenta(page, primera);
  await crearHogar(page, nombreHogar);
  const enlace = await invitar(page);

  await context.clearCookies();
  await registrarCuenta(page, "Luis Segundo");
  await page.goto(new URL(enlace).pathname);
  await page.getByRole("button", { name: "Unirme al hogar" }).click();
  await page.waitForURL("**/dashboard");
  return primera;
}

test("una regla recurrente se puede asignar a otra persona", async ({ page, context }) => {
  const otra = await hogarConDosPersonas(page, context, "Hogar de recurrentes");

  await page.goto("/recurrentes");
  await page.getByRole("button", { name: "Nueva regla" }).click();

  const dialogo = page.getByRole("dialog");
  await dialogo.getByLabel("Monto").fill("1800000");
  await dialogo.getByLabel("Descripción").fill("Arriendo");
  await dialogo.getByLabel("Categoría").selectOption({ label: "Arriendo o hipoteca" });
  await dialogo.getByLabel("¿Quién lo paga?").selectOption({ label: otra });
  await dialogo.getByRole("button", { name: "Crear regla" }).click();
  await expect(dialogo).toBeHidden();

  // La fila deja claro de quién es el gasto fijo.
  const fila = page.locator("li").filter({ hasText: "Arriendo" });
  await expect(fila).toContainText(`paga ${otra}`);
});

test("un crédito se asigna a una persona y sus cuotas la heredan", async ({ page, context }) => {
  const otra = await hogarConDosPersonas(page, context, "Hogar de créditos");

  await page.goto("/creditos");
  await page.getByRole("button", { name: "Nuevo crédito" }).click();

  const alta = page.getByRole("dialog");
  await alta.getByLabel("Nombre").fill("Crédito de prueba");
  await alta.getByLabel("Categoría de la cuota").selectOption({ label: "Cuota de crédito" });
  // El responsable se elige una sola vez, al crear el crédito.
  await alta.getByLabel("¿Quién lo paga?").selectOption({ label: otra });
  await alta.getByLabel("Monto prestado").fill("12000000");
  await alta.getByLabel("Número de cuotas").fill("12");
  await alta.getByLabel("Valor de la cuota").fill("1100000");
  await alta.getByRole("button", { name: "Registrar crédito" }).click();
  await expect(alta).toBeHidden();

  // La tarjeta lo dice sin tener que entrar.
  await expect(page.locator("a").filter({ hasText: "Crédito de prueba" })).toContainText(
    `paga ${otra}`,
  );

  await page.getByText("Crédito de prueba").click();
  await page.getByRole("button", { name: "Registrar cuota" }).click();

  // No se toca el pagador: la cuota debe heredar al responsable del crédito.
  const pago = page.getByRole("dialog");
  await pago.getByRole("button", { name: "Registrar pago" }).click();
  await expect(pago).toBeHidden();

  const pagos = page.locator("li").filter({ hasText: "cuota 1 de 12" });
  await expect(pagos).toContainText(`pagó ${otra}`);
});

test("un gasto personal queda fuera del hogar pero dentro de tu cuenta", async ({
  page,
  context,
}) => {
  const otra = await hogarConDosPersonas(page, context, "Hogar con personales");

  // Un gasto normal del hogar y otro marcado como personal, ambos de Luis.
  await registrarMovimiento(page, {
    tipo: "Gasto",
    monto: "300000",
    categoria: "Mercado",
    descripcion: "Mercado compartido",
  });

  await page.getByRole("button", { name: "Registrar movimiento" }).first().click();
  const dialogo = page.getByRole("dialog");
  await dialogo.getByLabel("Monto").fill("120000");
  await dialogo.getByRole("button", { name: "Ropa", exact: true }).click();
  await dialogo.getByLabel("Descripción").fill("Camisa mía");
  await dialogo.getByLabel("Gasto personal").check();
  await dialogo.getByRole("button", { name: "Registrar gasto" }).click();
  await expect(dialogo).toBeHidden();

  // La lista lo muestra a todos, marcado.
  await page.goto("/movimientos");
  const fila = page.locator("li").filter({ hasText: "Camisa mía" });
  await expect(fila).toContainText("Personal");

  // El hogar no lo cuenta, y avisa de que lo está dejando fuera.
  await page.goto("/dashboard");
  await expect(page.locator("body")).toContainText("300.000");
  await expect(page.locator("body")).not.toContainText("120.000");
  await expect(page.locator("body")).toContainText("movimiento personal");

  // Pero tu cuenta individual sí lo incluye.
  await verCuentaDe(page, "Luis Segundo (yo)");
  await expect(page.locator("body")).toContainText("120.000");

  // Y el filtro de la lista los separa.
  await page.goto("/movimientos?ambito=HOGAR");
  await expect(page.getByText("Camisa mía")).toBeHidden();
  await expect(page.getByText("Mercado compartido")).toBeVisible();

  await page.goto("/movimientos?ambito=PERSONAL");
  await expect(page.getByText("Camisa mía")).toBeVisible();
  await expect(page.getByText("Mercado compartido")).toBeHidden();

  // La comparativa de reportes es solo del hogar; lo personal va en su columna.
  await page.goto("/reportes");
  const tabla = page.getByRole("table");
  await expect(tabla.getByRole("row", { name: /Todo el hogar/ })).toContainText("300.000");
  await expect(tabla).toContainText("Personal");
  expect(otra).toBeTruthy();
});
