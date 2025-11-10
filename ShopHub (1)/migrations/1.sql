
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL,
  image TEXT NOT NULL,
  category TEXT NOT NULL,
  stock INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);

INSERT INTO products (name, description, price, image, category, stock) VALUES
('Wireless Headphones', 'Premium noise-cancelling wireless headphones with 30-hour battery life', 199.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 'Electronics', 50),
('Smart Watch', 'Feature-rich smartwatch with health tracking and notifications', 299.99, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', 'Electronics', 35),
('Leather Backpack', 'Stylish genuine leather backpack with laptop compartment', 149.99, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', 'Accessories', 25),
('Running Shoes', 'Lightweight running shoes with advanced cushioning technology', 129.99, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', 'Footwear', 60),
('Sunglasses', 'Classic polarized sunglasses with UV protection', 89.99, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800', 'Accessories', 40),
('Coffee Maker', 'Programmable coffee maker with thermal carafe', 79.99, 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800', 'Home', 30),
('Yoga Mat', 'Non-slip eco-friendly yoga mat with carrying strap', 49.99, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800', 'Fitness', 45),
('Desk Lamp', 'LED desk lamp with adjustable brightness and color temperature', 59.99, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800', 'Home', 55);
