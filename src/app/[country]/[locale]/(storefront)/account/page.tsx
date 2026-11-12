"use client";

import { CreditCard, MapPin, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { AccountShell } from "@/components/account/AccountShell";
import { AveCafeLogin } from "@/components/account/AveCafeLogin";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { extractBasePath } from "@/lib/utils/path";

export default function AccountPage() {
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const t = useTranslations("account");
  const { isAuthenticated, loading: authLoading } = useAuth();
  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <AveCafeLogin />;
  }

  // Show account dashboard if authenticated
  return (
    <AccountShell>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t("accountOverview")}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href={`${basePath}/account/orders`}>
            <Card className="hover:border-gray-300 transition-colors h-full">
              <CardContent className="flex items-center gap-4 py-0">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {t("orderHistory")}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {t("orderHistoryDescription")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`${basePath}/account/addresses`}>
            <Card className="hover:border-gray-300 transition-colors h-full">
              <CardContent className="flex items-center gap-4 py-0">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {t("addresses")}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {t("addressesDescription")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`${basePath}/account/credit-cards`}>
            <Card className="hover:border-gray-300 transition-colors h-full">
              <CardContent className="flex items-center gap-4 py-0">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {t("paymentMethods")}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {t("paymentMethodsDescription")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`${basePath}/account/profile`}>
            <Card className="hover:border-gray-300 transition-colors h-full">
              <CardContent className="flex items-center gap-4 py-0">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    {t("profile")}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {t("profileDescription")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AccountShell>
  );
}
