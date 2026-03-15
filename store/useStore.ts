import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";
import type { Product, CartItem, Bill } from "@/types";

interface StoreState {
  inventory: Product[];
  cart: CartItem[];
  bills: Bill[];

  // Inventory actions
  addProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;

  // Cart actions
  addToCartByBarcode: (barcode: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Billing actions
  saveBill: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      inventory: [],
      cart: [],
      bills: [],

      addProduct: (product) =>
        set((state) => ({
          inventory: [...state.inventory, product],
        })),

      removeProduct: (productId) =>
        set((state) => ({
          inventory: state.inventory.filter((p) => p.id !== productId),
        })),

      addToCartByBarcode: (barcode) => {
        const { inventory, cart } = get();

        const product = inventory.find((p) => p.barcode === barcode);

        if (!product) {
          toast.error(`No product found with barcode: ${barcode}`);
          return;
        }

        const existingItem = cart.find((item) => item.product.id === product.id);

        if (existingItem) {
          set((state) => ({
            cart: state.cart.map((item) =>
              item.product.id === product.id
                ? {
                  ...item,
                  quantity: item.quantity + 1,
                  subtotal: (item.quantity + 1) * item.product.price,
                }
                : item
            ),
          }));
        } else {
          set((state) => ({
            cart: [
              ...state.cart,
              {
                product,
                quantity: 1,
                subtotal: product.price,
              },
            ],
          }));
        }
      },

      updateCartQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          // Remove item if quantity drops to 0 or below
          set((state) => ({
            cart: state.cart.filter((item) => item.product.id !== productId),
          }));
          return;
        }

        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === productId
              ? {
                ...item,
                quantity,
                subtotal: quantity * item.product.price,
              }
              : item
          ),
        }));
      },

      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.product.id !== productId),
        })),

      clearCart: () => set({ cart: [] }),

      saveBill: () => {
        const { cart } = get();
        if (cart.length === 0) return;

        const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

        const bill: Bill = {
          id: crypto.randomUUID(),
          items: [...cart],
          total,
          tax: 0, // extend later (e.g. GST)
          grandTotal: total,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          bills: [...state.bills, bill],
          cart: [],
        }));
      },
    }),
    {
      name: "billing-store", // localStorage key
      partialize: (state) => ({
        inventory: state.inventory,
        cart: state.cart,
        bills: state.bills,
      }),
    }
  )
);
