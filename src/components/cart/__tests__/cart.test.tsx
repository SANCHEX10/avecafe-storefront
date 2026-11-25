import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { type ReactNode, useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/data/cart", () => ({
  getCart: vi.fn(),
  addToCart: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "es",
}));

vi.mock("next/dynamic", () => ({ default: () => () => null }));

vi.mock("@/lib/analytics/gtm", () => ({
  trackViewCart: vi.fn(),
  trackRemoveFromCart: vi.fn(),
}));

import { toast } from "sonner";
import CartPage from "@/app/[country]/[locale]/(storefront)/cart/page";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { formatCOP } from "@/components/cart/useCartMoney";
import { CartProvider, useCart } from "@/contexts/CartContext";
import {
  addToCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/lib/data/cart";

const prices: Record<string, number> = {
  "AVC-COF-001": 34000,
  "AVC-ACC-010": 78000,
};

let lines: { id: string; variant_id: string; quantity: number }[] = [];

function spreeCart() {
  const items = lines.map((line) => ({
    ...line,
    name: line.variant_id,
    slug: line.variant_id,
    options_text: "",
    thumbnail_url: null,
    currency: "COP",
    price: String(prices[line.variant_id]),
    total: String(prices[line.variant_id] * line.quantity),
  }));
  const total = String(
    items.reduce((sum, item) => sum + Number(item.total), 0),
  );
  return {
    id: "cart-1",
    currency: "COP",
    items,
    item_total: total,
    total,
    total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
  } as never;
}

function setQuantity(id: string, quantity: number) {
  lines = lines
    .map((line) => (line.id === id ? { ...line, quantity } : line))
    .filter((line) => line.quantity > 0);
}

function start(...items: [string, number][]) {
  lines = items.map(([variant_id, quantity]) => ({
    id: `li-${variant_id}`,
    variant_id,
    quantity,
  }));
}

function wrapper({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

function OpenDrawer() {
  const { openCart } = useCart();
  useEffect(() => openCart(), [openCart]);
  return <CartDrawer />;
}

async function loadedHook() {
  const hook = renderHook(() => useCart(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook.result;
}

describe("Módulo 6: Carrito de compras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lines = [];
    vi.mocked(getCart).mockImplementation(async () =>
      lines.length ? spreeCart() : null,
    );
    vi.mocked(addToCart).mockImplementation(async (variantId, quantity) => {
      lines.push({ id: `li-${variantId}`, variant_id: variantId, quantity });
      return { success: true, cart: spreeCart() };
    });
    vi.mocked(updateCartItem).mockImplementation(async (id, quantity) => {
      setQuantity(id, quantity);
      return { success: true, cart: spreeCart() };
    });
    vi.mocked(removeCartItem).mockImplementation(async (id) => {
      setQuantity(id, 0);
      return { success: true, cart: spreeCart() };
    });
  });

  it("UT-CAR-01: agregar AVC-COF-001 y AVC-ACC-010 da itemCount 2 y total $112.000", async () => {
    const cart = await loadedHook();

    await act(() => cart.current.addItem("AVC-COF-001", 1));
    await act(() => cart.current.addItem("AVC-ACC-010", 1));

    expect(cart.current.itemCount).toBe(2);
    expect(Number(cart.current.cart?.total)).toBe(112000);
  });

  it("UT-CAR-02: cambiar AVC-COF-001 de 3 a 2 da subtotal $68.000 y recalcula el total", async () => {
    start(["AVC-COF-001", 3], ["AVC-ACC-010", 1]);
    const cart = await loadedHook();

    await act(() => cart.current.updateItem("li-AVC-COF-001", 2));

    expect(Number(cart.current.cart?.items[0].total)).toBe(68000);
    expect(Number(cart.current.cart?.total)).toBe(146000);
  });

  it("UT-CAR-03: eliminar una línea la quita y recalcula el total", async () => {
    start(["AVC-COF-001", 1], ["AVC-ACC-010", 1]);
    const cart = await loadedHook();

    await act(() => cart.current.removeItem("li-AVC-ACC-010"));

    expect(cart.current.cart?.items.map((item) => item.id)).toEqual([
      "li-AVC-COF-001",
    ]);
    expect(Number(cart.current.cart?.total)).toBe(34000);
  });

  it("UT-CAR-04: 5 clics rápidos en + dejan cantidad inicial + 5 con peticiones en orden", async () => {
    start(["AVC-COF-001", 1]);
    const sent: number[] = [];
    let inFlight = 0;
    let maxInFlight = 0;
    vi.mocked(updateCartItem).mockImplementation(async (id, quantity) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      sent.push(quantity);
      setQuantity(id, quantity);
      inFlight -= 1;
      return { success: true, cart: spreeCart() };
    });

    render(<CartPage />, { wrapper });
    const plus = await screen.findByLabelText("increaseQuantity");
    for (let i = 0; i < 5; i++) fireEvent.click(plus);

    expect(screen.getByLabelText("quantity")).toHaveValue("6");
    await waitFor(() => expect(sent).toHaveLength(5));
    expect(sent).toEqual([2, 3, 4, 5, 6]);
    expect(maxInFlight).toBe(1);
    await waitFor(() =>
      expect(screen.getByLabelText("quantity")).toHaveValue("6"),
    );
  });

  it("UT-CAR-05: un error de red en updateItem revierte al snapshot y muestra el aviso", async () => {
    start(["AVC-COF-001", 3]);
    vi.mocked(updateCartItem).mockRejectedValue(new Error("Network error"));
    const cart = await loadedHook();

    await act(() => cart.current.updateItem("li-AVC-COF-001", 4));

    expect(cart.current.cart?.items[0].quantity).toBe(3);
    expect(Number(cart.current.cart?.total)).toBe(102000);
    expect(toast.error).toHaveBeenCalledWith("failedToUpdateItem");
    expect(getCart).toHaveBeenCalledTimes(2);
  });

  it("UT-CAR-06: el carrito vacío muestra el mensaje y el botón de pagar deshabilitado", async () => {
    render(<OpenDrawer />, { wrapper });

    expect(await screen.findByText("emptyCart")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "checkout" })).toBeDisabled();
  });

  it("UT-CAR-07: intentar 51 unidades con stock de 50 se bloquea", async () => {
    start(["AVC-COF-001", 50]);
    render(<CartPage />, { wrapper });

    expect(await screen.findByLabelText("increaseQuantity")).toBeDisabled();
    expect(screen.getByText("soldOut")).toBeInTheDocument();

    const input = screen.getByLabelText("quantity");
    fireEvent.change(input, { target: { value: "51" } });
    fireEvent.blur(input);

    expect(updateCartItem).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("notEnoughStock");
    expect(input).toHaveValue("50");
  });

  it("UT-CAR-08: el formato COP es idéntico en el drawer y en /cart", async () => {
    start(["AVC-COF-001", 1], ["AVC-ACC-010", 1]);
    render(
      <>
        <OpenDrawer />
        <CartPage />
      </>,
      { wrapper },
    );

    const drawer = await screen.findByRole("dialog");
    const drawerTotal = await within(drawer).findByTestId("cart-total");
    const totals = await screen.findAllByTestId("cart-total");
    const pageTotal = totals.find((node) => node !== drawerTotal);

    expect(drawerTotal.textContent).toBe(formatCOP(112000));
    expect(pageTotal?.textContent).toBe(drawerTotal.textContent);
    expect(formatCOP(112000)).toMatch(/^\$\s?112\.000/);
  });
});
