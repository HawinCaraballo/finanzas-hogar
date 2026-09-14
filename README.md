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
- **Cuenta individual y cuenta del hogar**: cada movimiento se atribuye a quien puso o
  recibió la plata, así que el dashboard se puede ver por persona o por casa completa.
- **Reportes** que comparan a los miembros entre sí: quién aportó cuánto, quién pagó qué
  y cómo se repartió el esfuerzo mes a mes.

## Puesta en marcha (local)

Requisitos: Node 20 o superior y Docker (para la base de datos).

```bash
npm install
cp .env.example .env        # y genera los secretos (ver abajo)
docker compose up -d        # PostgreSQL en el puerto 5432
npm run db:deploy           # crea las tablas aplicando las migraciones
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
| `npm run db:migrate` | Crea una migración tras cambiar `schema.prisma` |
| `npm run db:deploy` | Aplica las migraciones pendientes |

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
                  alcance.ts (de quién son las cifras)
                  reparto.ts (participación de cada miembro)
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

### Las dos cuentas

Un movimiento guarda dos personas distintas: `createdByUserId`, quien lo **registró** en
la app, y `paidByUserId`, quien **puso o recibió la plata**. No siempre son la misma:
Ana puede registrar la factura del gas que pagó Luis, y la cuenta individual se guía
siempre por la segunda.

De quién son las cifras que se están mirando es el **alcance**
([src/lib/alcance.ts](src/lib/alcance.ts)): el hogar entero o una persona. Vive en la URL
(`?quien=`) para que el botón «atrás» funcione y una vista se pueda compartir, y
`parseAlcance` lo valida **contra los miembros del hogar activo**, así un id ajeno cae en
«hogar» en vez de filtrar por alguien de otra casa.

No existen los gastos personales: todo movimiento cuenta a la vez en su cuenta individual
y en la del hogar. De ahí la invariante que prueba
[tests/e2e/cuentas-individuales.spec.ts](tests/e2e/cuentas-individuales.spec.ts): **el
total del hogar es la suma exacta de las cuentas individuales.**

Dos bloques del dashboard no siguen el alcance a propósito: los **presupuestos**, porque
un tope es del hogar y «mi parte del tope» no significa nada, y los **próximos pagos**,
porque lo que viene le importa a la casa entera. Ambos lo dicen en su encabezado cuando
hay una persona seleccionada.

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

## Despliegue en Vercel + Supabase

### 1. Base de datos en Supabase

Crea un proyecto en [supabase.com](https://supabase.com) (región más cercana: para
Colombia, `East US` o `South America (São Paulo)`). Guarda la contraseña de la base:
solo se muestra una vez.

En **Project Settings → Database → Connection string** copia las dos cadenas:

| Variable | Cuál copiar | Para qué |
|---|---|---|
| `DATABASE_URL` | **Transaction pooler**, puerto `6543` | La app. Añade `?pgbouncer=true&connection_limit=1` al final |
| `DIRECT_URL` | **Session pooler**, puerto `5432` | Solo las migraciones |

En serverless cada invocación abriría una conexión nueva, y por eso la app va por el
pooler. Las migraciones no pueden ir por ahí: PgBouncer en modo transacción no soporta
las sentencias que Prisma necesita.

### 2. Proyecto en Vercel

Sube el repositorio a GitHub e impórtalo en Vercel. No hace falta tocar la
configuración de build: `vercel.json` y los scripts ya están puestos.

Variables de entorno del proyecto (**Settings → Environment Variables**, en los tres
entornos):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | La del pooler de transacción (puerto 6543) |
| `DIRECT_URL` | La del pooler de sesión (puerto 5432) |
| `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `AUTH_URL` | La URL pública, por ejemplo `https://tu-proyecto.vercel.app` |
| `CRON_SECRET` | `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"` |

`AUTH_URL` solo se conoce después del primer despliegue: ponla y vuelve a desplegar.

### 3. Las tablas

El `build` corre `prisma migrate deploy`, así que las tablas se crean solas en el primer
despliegue. Si algo falla, el despliegue falla de forma visible en vez de reventar en la
primera petición.

Para aplicarlas a mano desde tu máquina:

```bash
DIRECT_URL="<la de Supabase, puerto 5432>" npx prisma migrate deploy
```

### 4. El cron

`vercel.json` programa `/api/cron/recurrentes` a las 06:00 UTC (01:00 en Colombia).
Vercel envía `CRON_SECRET` como Bearer token; sin él la ruta responde 401. En el plan
gratuito los crons corren una vez al día, que es justo lo que necesita esta app.

Para probarlo contra producción:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://tu-proyecto.vercel.app/api/cron/recurrentes
```

### 5. Tu cuenta

La app no trae usuarios: entra a `https://tu-proyecto.vercel.app/registro`, crea tu
cuenta, crea tu hogar y desde **Hogar → Invitar** generas el enlace para quien viva
contigo. La semilla de demostración es solo para desarrollo local; no la corras contra
producción.

## Lo que quedó fuera de esta versión

- **Correos**: las invitaciones se comparten como enlace (se copia y se envía por
  WhatsApp o correo). No hay recuperación de contraseña por correo.
- **Cuentas bancarias con saldo propio**: la tarjeta de crédito es una categoría de gasto,
  no una cuenta con cupo.
- **Importar extractos bancarios (CSV)**: el modelo de datos lo admitiría sin cambios.
