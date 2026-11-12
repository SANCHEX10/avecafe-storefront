import Link from "next/link";
import { BUSINESS_CONFIG, type BusinessCatalogProduct } from "@/config/business";

interface BusinessCatalogProps {
  basePath: string;
  limit?: number;
  query?: string;
  heading?: string;
  showNotice?: boolean;
}

const priceFormatter = new Intl.NumberFormat(
  BUSINESS_CONFIG.locale.currencyLocale,
  {
    style: "currency",
    currency: BUSINESS_CONFIG.locale.currency,
    maximumFractionDigits: 0,
  },
);

export function BusinessCatalog({
  basePath,
  limit,
  query,
  heading,
  showNotice = false,
}: BusinessCatalogProps) {
  const normalizedQuery = query?.trim().toLocaleLowerCase("es-CO");
  const matches = BUSINESS_CONFIG.catalog.products.filter((product) => {
    if (!normalizedQuery) return true;
    return [
      product.name,
      product.reference,
      product.category,
      product.description,
    ].some((value) => value.toLocaleLowerCase("es-CO").includes(normalizedQuery));
  });
  const visibleProducts = limit ? matches.slice(0, limit) : matches;

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {heading && (
        <h2 className="mb-7 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          {heading}
        </h2>
      )}
      {showNotice && (
        <p className="mb-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {BUSINESS_CONFIG.catalog.provisionalNotice}
        </p>
      )}
      {visibleProducts.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {visibleProducts.map((product) => (
            <li key={product.reference}>
              <CatalogProductCard basePath={basePath} product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-gray-200 px-4 py-8 text-center text-gray-600">
          No encontramos productos que coincidan con “{query}”.
        </p>
      )}
      {limit && matches.length > limit && (
        <div className="mt-8 text-center">
          <Link
            href={`${basePath}/products`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            Ver los {matches.length} productos
          </Link>
        </div>
      )}
    </section>
  );
}

function CatalogProductCard({
  basePath,
  product,
}: {
  basePath: string;
  product: BusinessCatalogProduct;
}) {
  const productPath = `${basePath}/products/${product.reference.toLowerCase()}`;

  return (
    <article className="group overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={productPath} className="block">
        <CatalogProductImage product={product} />
        <div className="p-4">
          <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
            <span>{product.category}</span>
            <span>{product.weight}</span>
          </div>
          <h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold text-stone-900 transition-colors group-hover:text-primary sm:text-base">
            {product.name}
          </h3>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-stone-600">
            {product.description}
          </p>
          <p className="mt-3 text-xs font-medium tracking-wide text-stone-500">
            Ref. {product.reference}
          </p>
          <p className="mt-1 text-lg font-bold text-stone-900">
            {priceFormatter.format(product.price)}
          </p>
        </div>
      </Link>
    </article>
  );
}

export function CatalogProductImage({
  product,
}: {
  product: BusinessCatalogProduct;
}) {
  const columns = BUSINESS_CONFIG.catalog.imageColumns;
  const rows = BUSINESS_CONFIG.catalog.imageRows;
  const column = product.imageIndex % columns;
  const row = Math.floor(product.imageIndex / columns);
  const backgroundPosition = `${(column / Math.max(columns - 1, 1)) * 100}% ${(row / Math.max(rows - 1, 1)) * 100}%`;

  return (
    <div
      role="img"
      aria-label={`Imagen provisional de ${product.name}`}
      className="aspect-[4/5] bg-[var(--brand-product)] bg-no-repeat transition-transform duration-300 group-hover:scale-[1.02]"
      style={{
        backgroundImage: `url(${BUSINESS_CONFIG.catalog.imageSheet})`,
        backgroundSize: `${columns * 100}% ${rows * 100}%`,
        backgroundPosition,
      }}
    />
  );
}
