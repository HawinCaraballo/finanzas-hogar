# Finanzas del hogar

Aplicación web para llevar los ingresos y gastos de una casa entre varias personas.
Responsive: se usa igual desde el celular que desde el computador.

- **Dashboard mensual** con ingresos, gastos y balance, la comparación contra el mes
  anterior y una gráfica de barras de los últimos 12 meses.
- **Movimientos** de ingreso y gasto con categorías, filtros y búsqueda.
- **Categorías** editables (servicios públicos, créditos, tarjeta de crédito, comida…),
  con 28 creadas por defecto en cada hogar.
- **Presupuestos** mensuales por categoría, con alerta al acercarse o pasarse del tope.
- **Movimientos recurrentes**: el arriendo, los servicios y las cuotas se registran solos.
- **Créditos** con seguimiento de cuotas pagadas, saldo pendiente y fecha de finalización.
- **Multi-hogar y multi-usuario**: una persona puede administrar varias casas, e invitar
  a quien viva con ella como administrador o miembro.

## Puesta en marcha (local)

Requisitos: Node 20 o superior y Docker (para la base de datos).

```bash
npm install
cp .env.example .env        # y genera los secretos (ver abajo)
docker compose up -d        # PostgreSQL en el puerto 5432
npm run db:push             # crea las tablas
npm run db:seed             # datos de demostración (opcional)
npm run dev
```

Abre http://localhost:3000. Con la semilla puedes entrar como:

| Correo | Contraseña | Rol |
|---|---|---|
| `ana@hogar.test` | `demo1234` | Administradora |
| `luis@hogar.test` | `demo1234` | Miembro |

### Secretos del `.env`

```bash
# AUTH_SECRET: firma las sesiones
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# CRON_SECRET: protege /api/cron/recurrentes
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila para producción (incluye lint y chequeo de tipos) |
| `npm run typecheck` | Solo TypeScript |
| `npm test` | Pruebas unitarias de la lógica de cálculo (Vitest) |
| `npm run test:e2e` | Recorridos completos en escritorio y móvil (Playwright) |
| `npm run db:studio` | Explorador visual de la base de datos |
| `npm run db:seed` | Vuelve a sembrar los datos de demostración |

La primera vez que corras los e2e: `npx playwright install chromium`.

## Cómo está hecho

- **Next.js 15** (App Router) con React 19 y TypeScript estricto.
- **PostgreSQL** vía **Prisma**. Los montos se guardan como `Decimal(14,2)`; nunca `Float`.
- **Auth.js v5** con correo y contraseña (bcrypt, coste 12) y sesión JWT.
- **Tailwind CSS v4** con tokens de color propios. Verde = entra dinero, rosa = sale.
  Ese par de colores no se usa para nada más en toda la interfaz.
- **Server Actions** para todas las escrituras, validadas con **Zod** en cliente y servidor
  usando el mismo esquema.

### Dónde está cada cosa

```
src/lib/          Lógica pura y probable sin base de datos:
                  money.ts (formato y lectura de montos)
                  periodo.ts (meses, rangos, fechas en UTC)
                  recurrencia.ts (cuándo toca la próxima ocurrencia)
                  creditos.ts / presupuesto.ts (cálculos)
src/server/       Server Actions: validar -> autorizar -> consultar -> revalidar
src/components/   Interfaz, agrupada por sección
src/app/          Rutas (App Router)
prisma/           Esquema y semilla
tests/unit/       Vitest sobre src/lib
tests/e2e/        Playwright sobre la app completa
```

### Regla de seguridad

Ninguna consulta recibe un `householdId` enviado por el cliente. Todo pasa por
`requireHogar()` ([src/lib/auth/guard.ts](src/lib/auth/guard.ts)), que lee la sesión,
resuelve el hogar activo desde una cookie y **verifica la membresía** antes de devolver
el contexto. Las acciones de administración usan `requireAdmin()`. Hay una prueba e2e
dedicada a comprobar que un hogar no ve los movimientos de otro.

### Moneda

La moneda y el locale son del hogar, no del usuario. El dato guardado no cambia: solo
cambia el formato con `Intl.NumberFormat`, así el mismo monto se ve `$ 1.250.000` en COP
y `$1,250.00` en USD. Las monedas donde nadie escribe centavos (COP, CLP, JPY…) se
muestran sin decimales.

### Movimientos recurrentes

Las reglas se ejecutan por dos vías: el **cron diario** de Vercel
(`/api/cron/recurrentes`, protegido con `CRON_SECRET`) y una **puesta al día perezosa**
cuando alguien abre la pantalla de recurrentes, por si el cron falló. Ejecutarlo dos
veces es inofensivo: el índice único `(recurringRuleId, periodKey)` impide duplicados.

Para probarlo a mano:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/recurrentes
```

## Despliegue en Vercel + Neon

1. Crea una base en [Neon](https://neon.tech) y copia su cadena de conexión.
2. Importa el repositorio en Vercel.
3. Variables de entorno del proyecto: `DATABASE_URL` (la de Neon, con `?sslmode=require`),
   `AUTH_SECRET`, `AUTH_URL` (la URL pública) y `CRON_SECRET`.
4. Despliega. El `build` corre `prisma generate`; las tablas se crean con
   `npx prisma db push` apuntando a `DATABASE_URL` de Neon.
5. El cron de `vercel.json` queda programado a las 06:00 UTC.

## Lo que quedó fuera de esta versión

- **Correos**: las invitaciones se comparten como enlace (se copia y se envía por
  WhatsApp o correo). No hay recuperación de contraseña por correo.
- **Cuentas bancarias con saldo propio**: la tarjeta de crédito es una categoría de gasto,
  no una cuenta con cupo.
- **Importar extractos bancarios (CSV)**: el modelo de datos lo admitiría sin cambios.
