"use client";

import type { Cart } from "@spree/sdk";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  addToCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/lib/data/cart";
import type { Surface } from "@/lib/spree/surface";

export const MAX_QUANTITY = 50;

type Result =
  | { success: true; cart?: Cart | null }
  | { success: false; error: string };

type Queue = { chain: Promise<boolean>; count: number; snapshot: Cart | null };

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  updating: boolean;
  itemCount: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (lineItemId: string, quantity: number) => Promise<void>;
  removeItem: (lineItemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function send(action: () => Promise<Result>): Promise<Result> {
  return action().catch(() => ({ success: false, error: "" }));
}

export function withQuantity(
  cart: Cart | null,
  lineItemId: string,
  quantity: number,
): Cart | null {
  if (!cart) return cart;
  const items = cart.items
    .map((item) =>
      item.id === lineItemId
        ? {
            ...item,
            quantity,
            total: String(Number(item.price ?? 0) * quantity),
          }
        : item,
    )
    .filter((item) => item.quantity > 0);
  const itemTotal = items.reduce(
    (sum, item) => sum + Number(item.price ?? 0) * item.quantity,
    0,
  );
  const rest = Number(cart.total ?? 0) - Number(cart.item_total ?? 0);
  return {
    ...cart,
    items,
    total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    item_total: String(itemTotal),
    total: String(itemTotal + rest),
  };
}

export function CartProvider({
  children,
  surface = "dtc",
}: {
  children: ReactNode;
  surface?: Surface;
}) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const cartRef = useRef<Cart | null>(null);
  const queues = useRef(new Map<string, Queue>());
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("cart");

  const apply = useCallback((next: Cart | null) => {
    cartRef.current = next;
    setCart(next);
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const refreshCart = useCallback(async () => {
    apply(await getCart(undefined, surface).catch(() => cartRef.current));
    setLoading(false);
  }, [apply, surface]);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      setUpdating(true);
      const result = await send(() => addToCart(variantId, quantity, surface));
      if (result.success) {
        apply(result.cart ?? null);
        setIsOpen(true);
        router.refresh();
      } else {
        toast.error(result.error || t("failedToAddItem"));
      }
      setUpdating(false);
    },
    [apply, router, surface, t],
  );

  const changeLine = useCallback(
    (
      lineItemId: string,
      quantity: number,
      action: () => Promise<Result>,
      message: string,
    ) => {
      const queue = queues.current.get(lineItemId) ?? {
        chain: Promise.resolve(true),
        count: 0,
        snapshot: cartRef.current,
      };
      queues.current.set(lineItemId, queue);
      queue.count += 1;
      apply(withQuantity(cartRef.current, lineItemId, quantity));
      setUpdating(true);

      queue.chain = queue.chain.then(async (ok) => {
        const result = ok ? await send(action) : null;
        queue.count -= 1;
        if (result && !result.success) {
          apply(queue.snapshot);
          toast.error(result.error || message);
          await refreshCart();
        } else if (result && queue.count === 0) {
          apply(result.cart ?? null);
          router.refresh();
        }
        if (queue.count === 0) {
          queues.current.delete(lineItemId);
          setUpdating(queues.current.size > 0);
        }
        return result?.success ?? false;
      });

      return queue.chain.then(() => undefined);
    },
    [apply, refreshCart, router],
  );

  const updateItem = useCallback(
    async (lineItemId: string, quantity: number) => {
      if (quantity > MAX_QUANTITY) {
        toast.error(t("notEnoughStock", { max: MAX_QUANTITY }));
        return;
      }
      await changeLine(
        lineItemId,
        quantity,
        () => updateCartItem(lineItemId, quantity, surface),
        t("failedToUpdateItem"),
      );
    },
    [changeLine, surface, t],
  );

  const removeItem = useCallback(
    (lineItemId: string) =>
      changeLine(
        lineItemId,
        0,
        () => removeCartItem(lineItemId, surface),
        t("failedToRemoveItem"),
      ),
    [changeLine, surface, t],
  );

  useEffect(() => {
    if (pathname.includes("/order-placed/")) {
      apply(null);
      setLoading(false);
      return;
    }
    refreshCart();
  }, [apply, refreshCart, pathname]);

  const itemCount =
    cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const value = useMemo<CartContextType>(
    () => ({
      cart,
      loading,
      updating,
      itemCount,
      isOpen,
      openCart,
      closeCart,
      addItem,
      updateItem,
      removeItem,
      refreshCart,
    }),
    [
      cart,
      loading,
      updating,
      itemCount,
      isOpen,
      openCart,
      closeCart,
      addItem,
      updateItem,
      removeItem,
      refreshCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
