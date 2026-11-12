import Link from "next/link";
import { CatalogProductImage } from "@/components/products/BusinessCatalog";
import { BUSINESS_CONFIG, type BusinessCatalogProduct } from "@/config/business";

const priceFormatter = new Intl.NumberFormat(
  BUSINESS_CONFIG.locale.currencyLocale,
  {
    style: "currency",
    currency: BUSINESS_CONFIG.locale.currency,
    maximumFractionDigits: 0,
  },
);

export function BusinessProductDetail({
  basePath,
  product,
}: {
  basePath: string;
  product: BusinessCatalogProduct;
}) {
  return (
    <main className="container mx-auto grid gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-16">
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <CatalogProductImage product={product} />
      </div>
      <div className="flex flex-col justify-center">
        <Link
          href={`${basePath}/products`}
          className="mb-6 text-sm font-medium text-stone-500 hover:text-primary"
        >
          ← Volver al catálogo
        </Link>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
          {product.category}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
          {product.name}
        </h1>
        <p className="mt-3 text-sm text-stone-500">
          Ref. {product.reference} · {product.weight}
        </p>
        <p className="mt-6 text-2xl font-bold text-stone-900">
          {priceFormatter.format(product.price)}
        </p>
        <p className="mt-5 max-w-xl leading-7 text-stone-600">
          {product.description}
        </p>
        <div className="mt-8 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {BUSINESS_CONFIG.catalog.provisionalNotice}
        </div>
        <Link
          href={`${basePath}/products`}
          className="mt-8 inline-flex w-fit items-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Seguir explorando
        </Link>
      </div>
    </main>
  );
}
