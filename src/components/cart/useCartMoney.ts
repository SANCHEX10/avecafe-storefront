import { useFormatMoney } from "@/hooks/useFormatMoney";

const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
});

export function formatCOP(amount: string | number | null | undefined) {
  return cop.format(Number(amount ?? 0));
}

export function useCartMoney() {
  const formatMoney = useFormatMoney();
  return (
    amount: string | null | undefined,
    currency: string | null | undefined,
  ) => (currency === "COP" ? formatCOP(amount) : formatMoney(amount, currency));
}
