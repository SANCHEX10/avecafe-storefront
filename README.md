# AveCafé — Tienda de café colombiano

Tienda virtual headless para **AveCafé**, construida sobre [Spree Storefront](https://github.com/spree/storefront) (Next.js 16 + React 19) y la API de [Spree Commerce](https://spreecommerce.org) a través de `@spree/sdk`.

- **Marca:** AveCafé — café colombiano de origen
- **Región por defecto:** Colombia (`co`) · Español (`es`) · Peso colombiano (`COP`)
- **Sitio:** https://github.com/SANCHEX10/avecafe-storefront

---

## Contenido

- [Características](#características)
- [Stack](#stack)
- [Requisitos](#requisitos)
- [Inicio rápido](#inicio-rápido)
- [Variables de entorno](#variables-de-entorno)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Catálogo y configuración de marca](#catálogo-y-configuración-de-marca)
- [Pagos](#pagos)
- [Emails transaccionales](#emails-transaccionales)
- [Pruebas](#pruebas)
- [Despliegue](#despliegue)
- [Estado del proyecto](#estado-del-proyecto)
- [Licencia y atribución](#licencia-y-atribución)

---

## Características

| Área | Detalle |
|---|---|
| Catálogo | Listado con filtros y orden, detalle de producto con variantes y galería, categorías y colecciones |
| Carrito | Estado en servidor, actualización de cantidades, drawer lateral, checkout express |
| Checkout | Una página: direcciones (invitado y autenticado), envío multi-bulto, cupones, gift cards, store credit |
| Pagos | Stripe, PayPal y Adyen vía Payment Sessions (3DS, Apple Pay / Google Pay donde aplique) |
| Cuenta | Registro, login, perfil, historial de pedidos, direcciones, tarjetas guardadas, gift cards |
| Multi-región | Rutas `/{país}/{idioma}` con detección y redirección por middleware |
| SEO | Metadatos, JSON-LD, Open Graph, sitemap y robots |
| Emails | Confirmación de pedido, envío, cancelación y recuperación de contraseña con react-email + Resend |
| Analítica | Google Tag Manager y eventos ecommerce de GA4 |
| B2B / Marketplace | Portales opcionales (wholesale y sellers) que se activan por variables de entorno |

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack, `cacheComponents`)
- **React 19** (Server Components, `useActionState`, `useOptimistic`)
- **TypeScript** estricto
- **Tailwind CSS 4** + Radix/shadcn
- **`@spree/sdk` 6** para la Store API
- **next-intl** para internacionalización
- **Vitest** + **Testing Library** (unitarias) · **Playwright** (E2E)
- **Biome** (lint/format) · **pnpm 10.33.4**

## Requisitos

- Node.js 20 o superior (probado con Node 24)
- pnpm 10.33.4 (`npm install -g pnpm@10.33.4`)
- Un backend **Spree Commerce 5.4+** accesible (API v3)
- Opcional: Docker para el backend y los E2E

## Inicio rápido

### 1. Clonar e instalar

```bash
git clone https://github.com/SANCHEX10/avecafe-storefront.git
cd avecafe-storefront
pnpm install
```

### 2. Configurar el entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con los datos de tu backend:

```env
SPREE_API_URL=http://localhost:3000
SPREE_PUBLISHABLE_KEY=tu_publishable_key_de_spree_admin
```

> Ambas variables son **solo de servidor**: no llevan prefijo `NEXT_PUBLIC_` y nunca se exponen al navegador.

### 3. Arrancar

```bash
pnpm dev
```

Abre http://localhost:3001.

### Backend local (opcional)

Si no tienes un backend, puedes generarlo con la CLI oficial:

```bash
npx create-spree-app mi-tienda
```

El storefront queda en `apps/storefront/` y el backend se configura solo. La clave publicable se obtiene en **Spree Admin → Settings → API Keys**.

## Variables de entorno

### Obligatorias

| Variable | Descripción |
|---|---|
| `SPREE_API_URL` | URL base de la API de Spree |
| `SPREE_PUBLISHABLE_KEY` | Clave publicable de la tienda |

### Recomendadas

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio (SEO, sitemap, JSON-LD) |
| `NEXT_PUBLIC_DEFAULT_COUNTRY` | País por defecto; si se omite usa `co` de `src/config/business.ts` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | Idioma por defecto; si se omite usa `es` |
| `NEXT_PUBLIC_STORE_NAME` | Nombre de la tienda; por defecto `AveCafé` |
| `NEXT_PUBLIC_STORE_DESCRIPTION` | Descripción para metadatos |
| `SPREE_WEBHOOK_SECRET` | Secreto del webhook de Spree (sin él el endpoint responde 503) |

### Opcionales

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Pagos con Stripe |
| `RESEND_API_KEY`, `EMAIL_FROM` | Envío real de emails (en desarrollo se escriben en `.next/emails/`) |
| `GTM_ID` | Google Tag Manager |
| `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | Monitoreo de errores |
| `SPREE_WHOLESALE_CHANNEL` | Activa el portal B2B en `/wholesale` |
| `SPREE_MARKETPLACE_ENABLED=true` | Activa el directorio de vendedores `/sellers` |
| `SPREE_IMAGES_URL` | Host alternativo para imágenes de Active Storage |
| `STORE_SEO_TITLE`, `STORE_META_DESCRIPTION`, `STORE_META_KEYWORDS` | Overrides de SEO |

El listado completo y comentado está en `.env.example`.

## Arquitectura

Patrón **server-first**:

```
Navegador → Server Action → @spree/sdk → API de Spree
            (cookies httpOnly: sesión y carrito)
```

- Toda llamada a la API ocurre en el servidor; la clave publicable nunca llega al cliente.
- Los tokens de sesión y de carrito viajan en cookies `httpOnly`, `secure` en producción y `sameSite=lax`.
- Las mutaciones son **Server Actions** (`src/lib/data/*`) con revalidación por tags de caché.
- La UI es React Server Components por defecto; `"use client"` solo para interacción.
- El middleware resuelve `/{país}/{idioma}` y redirige rutas sin prefijo al mercado por defecto.
- Los filtros y la ordenación viven en la URL (compartibles y indexables).

## Estructura del proyecto

```
src/
├── app/
│   ├── [country]/[locale]/
│   │   ├── (storefront)/      # Home, productos, categorías, carrito, cuenta, políticas
│   │   ├── (checkout)/        # Checkout, confirmación de pago, pedido realizado
│   │   └── (wholesale)/       # Portal B2B opcional
│   ├── api/webhooks/spree/    # Webhook firmado de Spree
│   └── dev/emails/            # Previews de emails (solo desarrollo)
├── components/                # UI por dominio (checkout, productos, layout, account…)
├── config/business.ts         # Marca, tema y catálogo provisional
├── contexts/                  # Auth, carrito, checkout, tienda
├── i18n/                      # Locales, mercados y normalización
├── lib/
│   ├── data/                  # Server Actions contra @spree/sdk
│   ├── spree/                 # Cliente, cookies, JWT, middleware, webhooks
│   ├── emails/                # Plantillas react-email
│   └── utils/                 # Precios, filtros, checkout express, formato
└── types/
e2e/                           # Pruebas Playwright
messages/                      # Traducciones (es, en, de, fr, pl)
scripts/                       # Paridad de locales e importación de catálogo
```

## Catálogo y configuración de marca

Toda la identidad y los valores por defecto están en **`src/config/business.ts`**:

- `brand`: nombre, eslogan, descripción, logo y redes sociales.
- `locale`: país, idioma, moneda y formato (`co` / `es` / `COP` / `es-CO`).
- `theme`: colores y superficies.
- `catalog.mode`:
  - `"spree"` → usa el catálogo real del backend (modo actual).
  - `"preview"` → muestra un catálogo de muestra **sin flujo de compra**.

El catálogo incluido (20 referencias AVC-COF-001…020) es **provisional**: reemplaza nombres, precios, descripciones e imágenes antes de publicar. Las variables `NEXT_PUBLIC_*` pueden sobrescribir marca y región por despliegue.

## Pagos

Los métodos se resuelven dinámicamente desde Spree (`resolveGatewayId` en `src/lib/utils/payment-gateway.ts`):

- **Stripe** — `StripePaymentForm` (Payment Element + tarjetas guardadas)
- **PayPal** — `PayPalPaymentForm`
- **Adyen** — `AdyenPaymentForm` (Drop-in + redirect)
- **Métodos directos** (contra reembolso, transferencia) cuando la sesión no es requerida
- **Pedidos de importe cero** se completan sin pasarela

El gateway debe existir y estar activo en **Spree Admin**. Razorpay aparece en el mapa de gateways pero **no tiene formulario implementado**: si se activa, el checkout muestra “método no soportado”.

## Emails transaccionales

1. Expón el storefront con un túnel HTTPS (por ejemplo `cloudflared tunnel --url http://localhost:3001`).
2. En **Spree Admin → Settings → Developers → Webhooks**, crea un endpoint hacia `https://<tu-túnel>/api/webhooks/spree`.
3. Eventos: `order.placed`, `order.canceled`, `order.fulfilled`.
4. Copia el secreto en `SPREE_WEBHOOK_SECRET`.
5. En desarrollo los HTML se guardan en `.next/emails/`; en producción define `RESEND_API_KEY` y `EMAIL_FROM`.

El webhook valida la firma HMAC y responde **503** si falta el secreto.

## Pruebas

```bash
pnpm test               # Vitest (unitarias e integración)
pnpm run test:watch     # modo watch
pnpm run check:locales  # paridad entre los 5 idiomas
pnpm run lint           # Biome
pnpm run check          # lint + formato
```

E2E con Playwright contra un backend real en Docker:

```bash
pnpm run e2e:up
pnpm run test:e2e
pnpm run e2e:down
```

Los E2E de pago con Stripe se omiten automáticamente si no hay claves de prueba configuradas. El script `scripts/e2e/bootstrap-spree.sh` prepara el backend (semilla, gateway Stripe y marketplace).

## Despliegue

### Docker

```bash
docker build \
  --build-arg SPREE_API_URL=https://tu-api.example.com \
  --build-arg SPREE_PUBLISHABLE_KEY=tu_clave \
  -t avecafe-storefront .

docker run -p 3001:3001 --env-file .env.local avecafe-storefront
```

> El build **requiere** `SPREE_API_URL` y `SPREE_PUBLISHABLE_KEY` porque las páginas se prerenderizan contra la API.

### Vercel / Render

- Importa el repositorio y define las variables de entorno del apartado anterior.
- `vercel.json` ya incluye la configuración de build.
- `render.yaml` (en el backend) describe un servicio Docker + Postgres para Spree.

## Estado del proyecto

- ✅ Código de tienda completo: catálogo, carrito, checkout, pagos, cuenta, emails y SEO.
- ✅ Flujo DTC operativo en código y cubierto por pruebas unitarias y E2E.
- ⚠️ **Pendiente de operación:** backend Spree con mercado `co/es/COP`, catálogo real cargado y gateway de pago configurado.
- ⚠️ Catálogo e imágenes actuales son provisionales.
- ⚠️ Las variables `NEXT_PUBLIC_PAYPAL_CLIENT_ID` y `NEXT_PUBLIC_ADYEN_*` aún no están documentadas en `.env.example`.

Checklist de puesta en marcha:

1. Backend Spree accesible con mercado Colombia (COP) y método de envío.
2. Catálogo real importado y slugs verificados.
3. Gateway de pago activo y su clave publicable en `.env.local`.
4. Webhook configurado con `SPREE_WEBHOOK_SECRET`.
5. `NEXT_PUBLIC_SITE_URL`, soporte y redes sociales definidos.
6. `pnpm test` y `pnpm run test:e2e` en verde.

## Licencia y atribución

Este proyecto es una obra derivada de [Spree Storefront](https://github.com/spree/storefront), © 2026 Vendo Connect Inc., Vendo Sp. z o.o., distribuido bajo licencia **MIT** (ver [LICENSE](./LICENSE)).

Las modificaciones y el trabajo de marca de AveCafé se describen en [NOTICE.md](./NOTICE.md). El aviso de copyright original se conserva conforme a la licencia MIT.
