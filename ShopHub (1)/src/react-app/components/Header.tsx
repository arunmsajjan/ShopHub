import { Link } from 'react-router';
import { ShoppingCart, Store, User, LogOut } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useCart } from '@/react-app/contexts/CartContext';

export default function Header() {
  const { user, redirectToLogin, logout } = useAuth();
  const { cartCount } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            <Store className="w-6 h-6 text-purple-600" />
            ShopHub
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
            >
              Products
            </Link>
            
            {user && (
              <>
                <Link 
                  to="/wishlist" 
                  className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>Wishlist</span>
                </Link>
                <Link 
                  to="/cart" 
                  className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors font-medium relative"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-gray-200 hover:border-purple-300 transition-all"
                >
                  {user.google_user_data.picture ? (
                    <img 
                      src={user.google_user_data.picture} 
                      alt={user.google_user_data.name || user.email}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-600" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {user.google_user_data.given_name || user.email}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors font-medium px-3 py-2 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={redirectToLogin}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
