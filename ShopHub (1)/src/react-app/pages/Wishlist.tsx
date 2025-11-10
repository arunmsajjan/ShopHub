import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Heart, ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react';
import Header from '@/react-app/components/Header';
import AuthGuard from '@/react-app/components/AuthGuard';
import { useCart } from '@/react-app/contexts/CartContext';
import type { Product } from '@/shared/types';

interface WishlistItem {
  id: number;
  created_at: string;
  product: Product;
}

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await fetch('/api/wishlist');
      if (response.ok) {
        const data = await response.json();
        setWishlistItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWishlist = async (itemId: number) => {
    try {
      const response = await fetch(`/api/wishlist/${itemId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setWishlistItems(items => items.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product.id, 1);
      // Optionally remove from wishlist after adding to cart
      // removeFromWishlist(wishlistItems.find(item => item.product.id === product.id)?.id || 0);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert(error instanceof Error ? error.message : 'Failed to add to cart');
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
          <Header />
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Header />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Continue shopping
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <Heart className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">My Wishlist</h1>
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
              {wishlistItems.length} items
            </span>
          </div>

          {wishlistItems.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-24 h-24 mx-auto text-gray-300 mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
              <p className="text-gray-600 mb-8">Save items you love for later</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <Link to={`/products/${item.product.id}`}>
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </Link>
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-500 hover:text-red-700 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-5">
                    <Link to={`/products/${item.product.id}`}>
                      <h3 className="font-semibold text-lg text-gray-900 hover:text-purple-600 transition-colors line-clamp-1 mb-2">
                        {item.product.name}
                      </h3>
                    </Link>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.product.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          ${item.product.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.product.stock} in stock
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddToCart(item.product)}
                      disabled={item.product.stock === 0}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
