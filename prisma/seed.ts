/**
 * Datos de arranque para desarrollo: un hogar con dos usuarios, las categorías
 * por defecto y unos meses de movimientos para que el dashboard no se vea vacío.
 *
 *   npm run db:seed
 */
import { PrismaClient, type MovementType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CATEGORIAS_POR_DEFECTO } from "../src/lib/categorias-default";

const prisma = new PrismaClient();

const DEMO = [
  { email: "ana@hogar.test", nombre: "Ana", password: "demo1234", role: "ADMIN" as const },
  { email: "luis@hogar.test", nombre: "Luis", password: "demo1234", role: "MIEMBRO" as const },
];

function fechaUTC(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m - 1, d));
}

async function main() {
  console.log("Sembrando datos de demostración...");

  const usuarios = [];
  for (const u of DEMO) {
    const usuario = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        nombre: u.nombre,
        passwordHash: await bcrypt.hash(u.password, 12),
      },
    });
    usuarios.push({ ...usuario, role: u.role });
  }

  let hogar = await prisma.household.findFirst({ where: { nombre: "Casa de ejemplo" } });
  if (!hogar) {
    hogar = await prisma.household.create({
      data: { nombre: "Casa de ejemplo", currency: "COP", locale: "es-CO" },
    });
  }

  for (const u of usuarios) {
    await prisma.householdMember.upsert({
      where: { userId_householdId: { userId: u.id, householdId: hogar.id } },
      update: {},
      create: { userId: u.id, householdId: hogar.id, role: u.role },
    });
  }

  for (const c of CATEGORIAS_POR_DEFECTO) {
    await prisma.category.upsert({
      where: {
        householdId_nombre_type: { householdId: hogar.id, nombre: c.nombre, type: c.type },
      },
      update: {},
      create: { ...c, householdId: hogar.id, isSystem: true },
    });
  }

  const categorias = await prisma.category.findMany({ where: { householdId: hogar.id } });
  const buscar = (nombre: string) => {
    const c = categorias.find((x) => x.nombre === nombre);
    if (!c) throw new Error(`Falta la categoría ${nombre}`);
    return c;
  };

  const yaHayMovimientos = await prisma.transaction.count({ where: { householdId: hogar.id } });
  if (yaHayMovimientos > 0) {
    console.log("Ya existían movimientos; no se agregan más.");
    return;
  }

  const hoy = new Date();
  // El último número dice quién pone la plata: 0 = Ana, 1 = Luis. Se reparte a
  // propósito para que el dashboard y los reportes tengan algo que comparar.
  const plantilla: Array<[string, number, number, string, number]> = [
    ["Salario", 4_800_000, 1, "Salario mensual", 0],
    ["Honorarios", 900_000, 12, "Proyecto freelance", 1],
    ["Arriendo o hipoteca", 1_800_000, 2, "Arriendo", 0],
    ["Energía", 145_000, 8, "Factura de energía", 1],
    ["Agua", 68_000, 9, "Factura de acueducto", 1],
    ["Gas", 42_000, 9, "Factura de gas", 1],
    ["Internet", 119_900, 10, "Plan de internet", 0],
    ["Telefonía", 75_000, 10, "Plan celular", 1],
    ["Mercado", 780_000, 6, "Mercado del mes", 0],
    ["Restaurantes", 210_000, 18, "Salidas a comer", 1],
    ["Transporte", 160_000, 15, "Transporte", 1],
    ["Combustible", 240_000, 14, "Gasolina", 0],
    ["Cuota de crédito", 620_000, 20, "Cuota crédito de libre inversión", 0],
    ["Tarjeta de crédito", 450_000, 22, "Pago tarjeta", 0],
    ["Entretenimiento", 130_000, 25, "Streaming y cine", 1],
  ];

  const movimientos = [];
  for (let atras = 5; atras >= 0; atras--) {
    const ref = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - atras, 1));
    const year = ref.getUTCFullYear();
    const month = ref.getUTCMonth() + 1;

    for (const [nombreCat, base, dia, descripcion, pagador] of plantilla) {
      const cat = buscar(nombreCat);
      // Variación de +-12 % para que las gráficas no salgan planas.
      const factor = 0.88 + ((atras * 7 + dia) % 25) / 100;
      movimientos.push({
        householdId: hogar.id,
        categoryId: cat.id,
        // Quien registra y quien paga se cruzan a propósito en algunos casos,
        // para que se vea que la app los distingue.
        createdByUserId: usuarios[dia % 2].id,
        paidByUserId: usuarios[pagador].id,
        type: cat.type as MovementType,
        amount: Math.round((base * factor) / 100) * 100,
        date: fechaUTC(year, month, Math.min(dia, 28)),
        descripcion,
      });
    }
  }
  await prisma.transaction.createMany({ data: movimientos });

  // Un par de movimientos personales, para que la funcionalidad se vea desde el
  // primer arranque: son de Ana y no cuentan en los totales del hogar.
  await prisma.transaction.createMany({
    data: [
      {
        householdId: hogar.id,
        categoryId: buscar("Ropa").id,
        createdByUserId: usuarios[0].id,
        paidByUserId: usuarios[0].id,
        type: "EGRESO" as MovementType,
        amount: 180_000,
        date: fechaUTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 7),
        descripcion: "Ropa para mí",
        esPersonal: true,
      },
      {
        householdId: hogar.id,
        categoryId: buscar("Entretenimiento").id,
        createdByUserId: usuarios[1].id,
        paidByUserId: usuarios[1].id,
        type: "EGRESO" as MovementType,
        amount: 95_000,
        date: fechaUTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 11),
        descripcion: "Videojuego",
        esPersonal: true,
      },
    ],
  });

  const catMercado = buscar("Mercado");
  const catServicios = buscar("Energía");
  await prisma.budget.createMany({
    data: [
      {
        householdId: hogar.id, categoryId: catMercado.id,
        year: hoy.getUTCFullYear(), month: hoy.getUTCMonth() + 1, amount: 800_000,
      },
      {
        householdId: hogar.id, categoryId: catServicios.id,
        year: hoy.getUTCFullYear(), month: hoy.getUTCMonth() + 1, amount: 150_000,
      },
    ],
    skipDuplicates: true,
  });

  const catCuota = buscar("Cuota de crédito");
  // La primera cuota coincide con el mes más viejo que se sembró (5 meses atrás),
  // usando Date.UTC para que el cálculo cruce bien el fin de año.
  const inicioCredito = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - 5, 20));
  const credito = await prisma.loan.create({
    data: {
      householdId: hogar.id,
      categoryId: catCuota.id,
      paidByUserId: usuarios[0].id,
      nombre: "Crédito de libre inversión",
      kind: "CREDITO",
      principal: 12_000_000,
      interestRate: 1.4,
      totalInstallments: 24,
      installmentAmount: 620_000,
      startDate: inicioCredito,
    },
  });

  // Los gastos de "Cuota de crédito" son pagos de ese crédito: al vincularlos,
  // el detalle muestra un saldo pendiente realista en vez de cero cuotas pagadas.
  await prisma.transaction.updateMany({
    where: { householdId: hogar.id, categoryId: catCuota.id, loanId: null },
    data: { loanId: credito.id },
  });

  await prisma.recurringRule.create({
    data: {
      householdId: hogar.id,
      categoryId: buscar("Arriendo o hipoteca").id,
      paidByUserId: usuarios[0].id,
      type: "EGRESO",
      amount: 1_800_000,
      descripcion: "Arriendo",
      frequency: "MENSUAL",
      dayOfMonth: 2,
      startDate: fechaUTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 2),
      nextRunDate: fechaUTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 2, 2),
      autoPost: true,
    },
  });

  console.log(`Listo. ${movimientos.length} movimientos creados.`);
  console.log("Entra con ana@hogar.test / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
