
ALTER TABLE cart ADD COLUMN user_id TEXT;
CREATE INDEX idx_cart_user_id ON cart(user_id);
