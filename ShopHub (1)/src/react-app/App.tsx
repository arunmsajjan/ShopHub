import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import { CartProvider } from "@/react-app/contexts/CartContext";
import HomePage from "@/react-app/pages/Home";
import ProductDetail from "@/react-app/pages/ProductDetail";
import Cart from "@/react-app/pages/Cart";
import Profile from "@/react-app/pages/Profile";
import Wishlist from "@/react-app/pages/Wishlist";
import AuthCallback from "@/react-app/pages/AuthCallback";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
