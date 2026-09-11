import { expect, test, type Page } from "@playwright/test";

/**
 * Recorrido completo de la aplicación: crear cuenta y hogar, registrar un
 * ingreso y un gasto, y comprobar que el dashboard cuadra.
 *
 * Se corre en escritorio y en móvil (ver playwright.config.ts). El único
 * detalle que cambia entre los dos es cómo se abre el formulario: en móvil es
 * el botón flotante de la barra inferior; en escritorio, el de la barra lateral.
 */

const CLAVE = "prueba1234";

function correoUnico(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@prueba.test`;
}

async function crearCuentaYHogar(page: Page, nombreHogar: string) {
  const email = correoUnico("e2e");

  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Persona de prueba");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(CLAVE);
  await page.getByLabel("Repite la contraseña").fill(CLAVE);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await page.waitForURL("**/onboarding");
  await page.getByLabel("Nombre del hogar").fill(nombreHogar);
  await page.getByRole("button", { name: "Crear hogar" }).click();

  await page.waitForURL("**/dashboard");
  return email;
}

async function abrirFormulario(page: Page) {
  await page.getByRole("button", { name: "Registrar movimiento" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

async function registrarMovimiento(
  page: Page,
  opciones: { tipo: "Gasto" | "Ingreso"; monto: string; categoria: string; descripcion: string },
) {
  await abrirFormulario(page);

  const dialogo = page.getByRole("dialog");
  await dialogo.getByRole("radio", { name: opciones.tipo }).click();
  await dialogo.getByLabel("Monto").fill(opciones.monto);
  await dialogo.getByRole("button", { name: opciones.categoria, exact: true }).click();
  await dialogo.getByLabel("Descripción").fill(opciones.descripcion);

  const boton = opciones.tipo === "Gasto" ? "Registrar gasto" : "Registrar ingreso";
  await dialogo.getByRole("button", { name: boton }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

test("registrar ingresos y gastos se refleja en el dashboard", async ({ page }) => {
  await crearCuentaYHogar(page, "Hogar de prueba");

  // Un hogar recién creado no tiene movimientos.
  await expect(
    page.getByText("Tu dashboard está esperando el primer movimiento"),
  ).toBeVisible();

  await registrarMovimiento(page, {
    tipo: "Ingreso",
    monto: "3000000",
    categoria: "Salario",
    descripcion: "Salario del mes",
  });

  await registrarMovimiento(page, {
    tipo: "Gasto",
    monto: "500000",
    categoria: "Mercado",
    descripcion: "Mercado de la semana",
  });

  // Las tres cifras del mes: 3.000.000 - 500.000 = 2.500.000.
  await expect(page.getByText("3.000.000").first()).toBeVisible();
  await expect(page.getByText("500.000").first()).toBeVisible();
  await expect(page.getByText("2.500.000").first()).toBeVisible();

  // Y aparecen en la lista de últimos movimientos.
  await expect(page.getByText("Salario del mes")).toBeVisible();
  await expect(page.getByText("Mercado de la semana")).toBeVisible();
});

test("la lista de movimientos filtra por tipo", async ({ page }) => {
  await crearCuentaYHogar(page, "Hogar de filtros");

  await registrarMovimiento(page, {
    tipo: "Ingreso",
    monto: "1000000",
    categoria: "Salario",
    descripcion: "Un ingreso",
  });
  await registrarMovimiento(page, {
    tipo: "Gasto",
    monto: "200000",
    categoria: "Mercado",
    descripcion: "Un gasto",
  });

  await page.goto("/movimientos");
  await expect(page.getByText("Un ingreso")).toBeVisible();
  await expect(page.getByText("Un gasto")).toBeVisible();

  await page.getByRole("radio", { name: "Gastos" }).click();
  await expect(page.getByText("Un gasto")).toBeVisible();
  await expect(page.getByText("Un ingreso")).toBeHidden();
});

test("un presupuesto excedido se marca en rojo", async ({ page }) => {
  await crearCuentaYHogar(page, "Hogar con topes");

  await registrarMovimiento(page, {
    tipo: "Gasto",
    monto: "900000",
    categoria: "Mercado",
    descripcion: "Mercado grande",
  });

  await page.goto("/presupuestos");
  await page.getByRole("button", { name: "Fijar tope de Mercado" }).click();
  await page.getByLabel("Tope de Mercado").fill("500000");
  await page.getByRole("button", { name: "Guardar tope" }).click();

  await expect(page.getByText("Excedido").first()).toBeVisible();
  await expect(page.getByText("180 %").first()).toBeVisible();
});

test("cada hogar ve solo sus propios movimientos", async ({ page, context }) => {
  await crearCuentaYHogar(page, "Hogar A");
  await registrarMovimiento(page, {
    tipo: "Gasto",
    monto: "111000",
    categoria: "Mercado",
    descripcion: "Gasto secreto del hogar A",
  });

  // Segunda persona, sin relación con el primer hogar.
  await context.clearCookies();
  await crearCuentaYHogar(page, "Hogar B");

  await page.goto("/movimientos");
  await expect(page.getByText("Gasto secreto del hogar A")).toBeHidden();

  // El nombre del hogar aparece en la barra lateral y en la barra del móvil;
  // el encabezado del dashboard es el único sitio donde sale una sola vez.
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1, name: "Hogar B" })).toBeVisible();
});
