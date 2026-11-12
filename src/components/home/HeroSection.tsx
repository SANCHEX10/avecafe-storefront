import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { BUSINESS_CONFIG } from "@/config/business";

interface HeroSectionProps {
  basePath: string;
  locale: string;
}

export async function HeroSection({ basePath, locale }: HeroSectionProps) {
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "home",
  });
  return (
    <section className="flex min-h-[620px] items-center border-b border-stone-200 bg-[var(--brand-hero)] md:min-h-0">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            {BUSINESS_CONFIG.brand.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-stone-900 md:text-6xl">
            {BUSINESS_CONFIG.brand.tagline}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-stone-600">
            {BUSINESS_CONFIG.brand.description}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href={`${basePath}/products`}>{t("shopNow")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
