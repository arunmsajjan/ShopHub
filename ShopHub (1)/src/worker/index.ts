import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { ProductSchema, CartItemWithProductSchema, AddToCartRequestSchema } from "@/shared/types";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { getCookie, setCookie } from "hono/cookie";

// Extend the Env interface to include the auth service environment variables
interface ExtendedEnv extends Env {
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
}

const app = new Hono<{ Bindings: ExtendedEnv }>();

app.use("*", cors());

// Authentication endpoints
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Get all products
app.get("/api/products", async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
  const products = result.results.map((row) => ProductSchema.parse(row));
  return c.json(products);
});

// Get product by ID
app.get("/api/products/:id", async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param("id"));
  
  const result = await db.prepare("SELECT * FROM products WHERE id = ?").bind(id).first();
  
  if (!result) {
    return c.json({ error: "Product not found" }, 404);
  }
  
  const product = ProductSchema.parse(result);
  return c.json(product);
});

// Get suggested products for a product
app.get("/api/products/:id/suggestions", async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param("id"));
  
  // First get the current product to know its category
  const currentProduct = await db.prepare("SELECT * FROM products WHERE id = ?").bind(id).first();
  
  if (!currentProduct) {
    return c.json({ error: "Product not found" }, 404);
  }
  
  // Get products from the same category, excluding the current product
  const result = await db.prepare(`
    SELECT * FROM products 
    WHERE category = ? AND id != ? 
    ORDER BY RANDOM() 
    LIMIT 8
  `).bind(currentProduct.category, id).all();
  
  const suggestions = result.results.map((row) => ProductSchema.parse(row));
  return c.json(suggestions);
});

// Get cart items with product details
app.get("/api/cart", authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  
  const result = await db.prepare(`
    SELECT 
      c.id,
      c.product_id,
      c.quantity,
      c.created_at,
      c.updated_at,
      p.id as 'product.id',
      p.name as 'product.name',
      p.description as 'product.description',
      p.price as 'product.price',
      p.image as 'product.image',
      p.category as 'product.category',
      p.stock as 'product.stock',
      p.created_at as 'product.created_at',
      p.updated_at as 'product.updated_at'
    FROM cart c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `).bind(user!.id).all();
  
  const cartItems = result.results.map((row: any) => {
    return {
      id: row.id,
      product_id: row.product_id,
      quantity: row.quantity,
      created_at: row.created_at,
      updated_at: row.updated_at,
      product: {
        id: row['product.id'],
        name: row['product.name'],
        description: row['product.description'],
        price: row['product.price'],
        image: row['product.image'],
        category: row['product.category'],
        stock: row['product.stock'],
        created_at: row['product.created_at'],
        updated_at: row['product.updated_at'],
      }
    };
  });
  
  return c.json(cartItems.map(item => CartItemWithProductSchema.parse(item)));
});

// Add item to cart
app.post("/api/cart", authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const body = await c.req.json();
  const { product_id, quantity } = AddToCartRequestSchema.parse(body);
  
  // Check if product exists and has enough stock
  const product = await db.prepare("SELECT * FROM products WHERE id = ?").bind(product_id).first();
  
  if (!product) {
    return c.json({ error: "Product not found" }, 404);
  }
  
  if ((product.stock as number) < quantity) {
    return c.json({ error: "Not enough stock" }, 400);
  }
  
  // Check if item already exists in cart for this user
  const existingItem = await db.prepare("SELECT * FROM cart WHERE product_id = ? AND user_id = ?").bind(product_id, user!.id).first();
  
  if (existingItem) {
    // Update quantity
    const newQuantity = (existingItem.quantity as number) + quantity;
    if ((product.stock as number) < newQuantity) {
      return c.json({ error: "Not enough stock" }, 400);
    }
    
    await db.prepare("UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(newQuantity, existingItem.id)
      .run();
      
    return c.json({ message: "Cart updated", id: existingItem.id });
  } else {
    // Insert new item
    const result = await db.prepare(
      "INSERT INTO cart (product_id, quantity, user_id) VALUES (?, ?, ?)"
    ).bind(product_id, quantity, user!.id).run();
    
    return c.json({ message: "Item added to cart", id: result.meta.last_row_id }, 201);
  }
});

// Remove item from cart
app.delete("/api/cart/:id", authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const id = parseInt(c.req.param("id"));
  
  const result = await db.prepare("DELETE FROM cart WHERE id = ? AND user_id = ?").bind(id, user!.id).run();
  
  if (result.meta.changes === 0) {
    return c.json({ error: "Cart item not found" }, 404);
  }
  
  return c.json({ message: "Item removed from cart" });
});

// Update cart item quantity
app.patch("/api/cart/:id", authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const quantity = z.number().min(0).parse(body.quantity);
  
  if (quantity === 0) {
    // Remove item if quantity is 0
    await db.prepare("DELETE FROM cart WHERE id = ? AND user_id = ?").bind(id, user!.id).run();
    return c.json({ message: "Item removed from cart" });
  }
  
  // Check stock
  const cartItem = await db.prepare("SELECT * FROM cart WHERE id = ? AND user_id = ?").bind(id, user!.id).first();
  if (!cartItem) {
    return c.json({ error: "Cart item not found" }, 404);
  }
  
  const product = await db.prepare("SELECT * FROM products WHERE id = ?").bind(cartItem.product_id).first();
  if ((product?.stock as number) < quantity) {
    return c.json({ error: "Not enough stock" }, 400);
  }
  
  await db.prepare("UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?")
    .bind(quantity, id, user!.id)
    .run();
    
  return c.json({ message: "Cart updated" });
});

// Search products
app.get("/api/products/search", async (c) => {
  const db = c.env.DB;
  const query = c.req.query("q");
  const category = c.req.query("category");
  
  if (!query && !category) {
    return c.json({ error: "Search query or category required" }, 400);
  }

  let sql = "SELECT * FROM products WHERE 1=1";
  let params: any[] = [];

  if (query) {
    sql += " AND (name LIKE ? OR description LIKE ? OR category LIKE ?)";
    params.push(`%${query}%`, `%${query}%`, `%${query}%`);
  }

  if (category && category !== 'All') {
    sql += " AND category = ?";
    params.push(category);
  }

  sql += " ORDER BY created_at DESC";

  const result = await db.prepare(sql).bind(...params).all();
  const products = result.results.map((row) => ProductSchema.parse(row));
  return c.json(products);
});

// User profile endpoints
app.get("/api/profile", authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  
  const result = await db.prepare("SELECT * FROM user_profiles WHERE user_id = ?").bind(user!.id).first();
  return c.json(result || {});
});

app.post("/api/profile", authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const body = await c.req.json();
  
  const profileData = z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone: z.string().optional(),
    address_line1: z.string().optional(),
    address_line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
    country: z.string().optional(),
  }).parse(body);

  // Check if profile exists
  const existing = await db.prepare("SELECT * FROM user_profiles WHERE user_id = ?").bind(user!.id).first();
  
  if (existing) {
    // Update existing profile
    const fields = Object.keys(profileData).filter(key => profileData[key as keyof typeof profileData] !== undefined);
    if (fields.length > 0) {
      const setClause = fields.map(field => `${field} = ?`).join(", ");
      const values = fields.map(field => profileData[field as keyof typeof profileData]);
      
      await db.prepare(`UPDATE user_profiles SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`)
        .bind(...values, user!.id)
        .run();
    }
  } else {
    // Create new profile
    await db.prepare(`
      INSERT INTO user_profiles (user_id, first_name, last_name, phone, address_line1, address_line2, city, state, zip_code, country)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user!.id,
      profileData.first_name || null,
      profileData.last_name || null,
      profileData.phone || null,
      profileData.address_line1 || null,
      profileData.address_line2 || null,
      profileData.city || null,
      profileData.state || null,
      profileData.zip_code || null,
      profileData.country || null
    ).run();
  }
  
  return c.json({ message: "Profile updated successfully" });
});

// Wishlist endpoints
app.get("/api/wishlist", authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  
  const result = await db.prepare(`
    SELECT 
      w.id,
      w.created_at,
      p.id as 'product.id',
      p.name as 'product.name',
      p.description as 'product.description',
      p.price as 'product.price',
      p.image as 'product.image',
      p.category as 'product.category',
      p.stock as 'product.stock',
      p.created_at as 'product.created_at',
      p.updated_at as 'product.updated_at'
    FROM wishlists w
    JOIN products p ON w.product_id = p.id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
  `).bind(user!.id).all();
  
  const wishlistItems = result.results.map((row: any) => ({
    id: row.id,
    created_at: row.created_at,
    product: {
      id: row['product.id'],
      name: row['product.name'],
      description: row['product.description'],
      price: row['product.price'],
      image: row['product.image'],
      category: row['product.category'],
      stock: row['product.stock'],
      created_at: row['product.created_at'],
      updated_at: row['product.updated_at'],
    }
  }));
  
  return c.json(wishlistItems);
});

app.post("/api/wishlist", authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const body = await c.req.json();
  const { product_id } = z.object({ product_id: z.number() }).parse(body);
  
  // Check if product exists
  const product = await db.prepare("SELECT * FROM products WHERE id = ?").bind(product_id).first();
  if (!product) {
    return c.json({ error: "Product not found" }, 404);
  }
  
  // Check if already in wishlist
  const existing = await db.prepare("SELECT * FROM wishlists WHERE user_id = ? AND product_id = ?")
    .bind(user!.id, product_id).first();
  
  if (existing) {
    return c.json({ error: "Product already in wishlist" }, 400);
  }
  
  const result = await db.prepare("INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)")
    .bind(user!.id, product_id).run();
    
  return c.json({ message: "Added to wishlist", id: result.meta.last_row_id }, 201);
});

app.delete("/api/wishlist/:id", authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const id = parseInt(c.req.param("id"));
  
  const result = await db.prepare("DELETE FROM wishlists WHERE id = ? AND user_id = ?")
    .bind(id, user!.id).run();
  
  if (result.meta.changes === 0) {
    return c.json({ error: "Wishlist item not found" }, 404);
  }
  
  return c.json({ message: "Removed from wishlist" });
});

// Reviews endpoints
app.get("/api/products/:id/reviews", async (c) => {
  const db = c.env.DB;
  const productId = parseInt(c.req.param("id"));
  
  const result = await db.prepare(`
    SELECT r.*, up.first_name, up.last_name
    FROM reviews r
    LEFT JOIN user_profiles up ON r.user_id = up.user_id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `).bind(productId).all();
  
  return c.json(result.results);
});

app.post("/api/products/:id/reviews", authMiddleware, async (c) => {
  const db = c.env.DB;
  const user = c.get("user");
  const productId = parseInt(c.req.param("id"));
  const body = await c.req.json();
  
  const reviewData = z.object({
    rating: z.number().min(1).max(5),
    title: z.string().optional(),
    comment: z.string().optional(),
  }).parse(body);
  
  // Check if product exists
  const product = await db.prepare("SELECT * FROM products WHERE id = ?").bind(productId).first();
  if (!product) {
    return c.json({ error: "Product not found" }, 404);
  }
  
  // Check if user already reviewed this product
  const existing = await db.prepare("SELECT * FROM reviews WHERE user_id = ? AND product_id = ?")
    .bind(user!.id, productId).first();
  
  if (existing) {
    return c.json({ error: "You have already reviewed this product" }, 400);
  }
  
  const result = await db.prepare(`
    INSERT INTO reviews (user_id, product_id, rating, title, comment)
    VALUES (?, ?, ?, ?, ?)
  `).bind(user!.id, productId, reviewData.rating, reviewData.title || null, reviewData.comment || null).run();
  
  return c.json({ message: "Review added successfully", id: result.meta.last_row_id }, 201);
});

export default app;
