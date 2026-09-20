import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const updateCartItemSchema = z.object({
  cartItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const removeCartItemSchema = z.object({
  cartItemId: z.string().uuid(),
});
