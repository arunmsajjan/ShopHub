import z from "zod";

export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  image: z.string(),
  category: z.string(),
  stock: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Product = z.infer<typeof ProductSchema>;

export const CartItemSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  quantity: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

export const CartItemWithProductSchema = CartItemSchema.extend({
  product: ProductSchema,
});

export type CartItemWithProduct = z.infer<typeof CartItemWithProductSchema>;

export const AddToCartRequestSchema = z.object({
  product_id: z.number(),
  quantity: z.number().min(1),
});

export type AddToCartRequest = z.infer<typeof AddToCartRequestSchema>;

export const WishlistItemSchema = z.object({
  id: z.number(),
  created_at: z.string(),
  product: ProductSchema,
});

export type WishlistItem = z.infer<typeof WishlistItemSchema>;

export const ReviewSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  product_id: z.number(),
  rating: z.number().min(1).max(5),
  title: z.string().nullable(),
  comment: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Review = z.infer<typeof ReviewSchema>;

export const UserProfileSchema = z.object({
  id: z.number().optional(),
  user_id: z.string().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address_line1: z.string().nullable().optional(),
  address_line2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zip_code: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
