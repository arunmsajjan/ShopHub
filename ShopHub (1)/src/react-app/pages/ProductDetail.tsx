import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Loader2, ArrowLeft, ShoppingCart, Package, CheckCircle, Heart, Star, Zap } from 'lucide-react';
import Header from '@/react-app/components/Header';
import CheckoutModal from '@/react-app/components/CheckoutModal';
import { useCart } from '@/react-app/contexts/CartContext';
import { useAuth } from '@getmocha/users-service/react';
import type { Product, Review } from '@/shared/types';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '' });
  const [showQuickBuy, setShowQuickBuy] = useState(false);
  const { addToCart, cartItems, isLoading: cartLoading } = useCart();

  useEffect(() => {
    if (id) {
      fetchProduct(parseInt(id));
      fetchReviews(parseInt(id));
      fetchSuggestedProducts(parseInt(id));
      if (user) {
        checkWishlistStatus(parseInt(id));
      }
    }
  }, [id, user]);

  const fetchProduct = async (productId: number) => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickBuy = async () => {
    if (!user || !product) {
      alert('Please sign in to buy this product');
      return;
    }
    
    try {
      await addToCart(product.id, quantity);
      setShowQuickBuy(true);
    } catch (error) {
      console.error('Failed to add to cart for quick buy:', error);
      alert(error instanceof Error ? error.message : 'Failed to add to cart');
    }
  };

  const handleQuickBuyComplete = () => {
    setShowQuickBuy(false);
    // The cart will be cleared by the checkout modal
  };

  const fetchReviews = async (productId: number) => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const fetchSuggestedProducts = async (productId: number) => {
    try {
      const response = await fetch(`/api/products/${productId}/suggestions`);
      if (response.ok) {
        const data = await response.json();
        setSuggestedProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch suggested products:', error);
    }
  };

  const checkWishlistStatus = async (productId: number) => {
    try {
      const response = await fetch('/api/wishlist');
      if (response.ok) {
        const wishlistItems = await response.json();
        setIsInWishlist(wishlistItems.some((item: any) => item.product.id === productId));
      }
    } catch (error) {
      console.error('Failed to check wishlist status:', error);
    }
  };

  const toggleWishlist = async () => {
    if (!user || !product) return;
    
    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        // Find and remove from wishlist
        const response = await fetch('/api/wishlist');
        if (response.ok) {
          const wishlistItems = await response.json();
          const item = wishlistItems.find((item: any) => item.product.id === product.id);
          if (item) {
            await fetch(`/api/wishlist/${item.id}`, { method: 'DELETE' });
            setIsInWishlist(false);
          }
        }
      } else {
        // Add to wishlist
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: product.id }),
        });
        if (response.ok) {
          setIsInWishlist(true);
        }
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    } finally {
      setWishlistLoading(false);
    }
  };

  const submitReview = async () => {
    if (!user || !product) return;
    
    try {
      const response = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview),
      });
      
      if (response.ok) {
        setShowReviewForm(false);
        setNewReview({ rating: 5, title: '', comment: '' });
        fetchReviews(product.id);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review');
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      await addToCart(product.id, quantity);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert(error instanceof Error ? error.message : 'Failed to add to cart');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
          <Link to="/" className="text-purple-600 hover:text-purple-700 mt-4 inline-block">
            Return to shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to products
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">
            <div className="aspect-square">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-center">
            <div className="inline-block px-4 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4 w-fit">
              {product.category}
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>
            
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              {product.description}
            </p>

            <div className="flex items-center gap-4 mb-8">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ${product.price.toFixed(2)}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Package className="w-5 h-5" />
                <span className="font-medium">{product.stock} in stock</span>
              </div>
            </div>

            {/* Quantity and Action Buttons */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 hover:bg-gray-100 transition-colors font-semibold"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                  className="w-16 text-center font-semibold outline-none"
                  min="1"
                  max={product.stock}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-4 py-3 hover:bg-gray-100 transition-colors font-semibold"
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading || product.stock === 0}
                  className="flex-1 bg-white text-purple-600 border-2 border-purple-600 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addedToCart ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </>
                  )}
                </button>

                <button
                  onClick={handleQuickBuy}
                  disabled={cartLoading || product.stock === 0 || !user}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Buy Now
                </button>

                {user && (
                  <button
                    onClick={toggleWishlist}
                    disabled={wishlistLoading}
                    className={`px-4 py-3 rounded-xl border-2 transition-all disabled:opacity-50 ${
                      isInWishlist
                        ? 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-red-300 hover:text-red-600'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-current' : ''}`} />
                  </button>
                )}
              </div>

              {!user && (
                <p className="text-sm text-gray-600 text-center">
                  <Link to="/" className="text-purple-600 hover:text-purple-700 font-medium">
                    Sign in
                  </Link>
                  {' '}to buy this product or add to wishlist
                </p>
              )}
            </div>

            {/* Product Features */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Product Features</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600"></div>
                  Premium quality materials
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600"></div>
                  Fast and secure shipping
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600"></div>
                  30-day return policy
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600"></div>
                  Customer satisfaction guaranteed
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Customer Reviews</h2>
              {user && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Write a Review
                </button>
              )}
            </div>

            {showReviewForm && (
              <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-semibold mb-4">Write Your Review</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setNewReview(prev => ({ ...prev, rating }))}
                          className={`w-8 h-8 ${rating <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          <Star className="w-full h-full fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title (optional)</label>
                    <input
                      type="text"
                      value={newReview.title}
                      onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Review title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment (optional)</label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Share your thoughts about this product..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={submitReview}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                      Submit Review
                    </button>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 text-lg">No reviews yet</p>
                <p className="text-gray-500">Be the first to review this product!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold text-gray-900">
                            {review.first_name && review.last_name 
                              ? `${review.first_name} ${review.last_name}`
                              : 'Anonymous User'
                            }
                          </span>
                          <span className="text-gray-500 text-sm">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.title && (
                          <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                        )}
                        {review.comment && (
                          <p className="text-gray-700">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Suggested Products Section */}
        {suggestedProducts.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">You Might Also Like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {suggestedProducts.map((suggestedProduct) => (
                  <Link 
                    key={suggestedProduct.id}
                    to={`/products/${suggestedProduct.id}`}
                    className="group bg-gray-50 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200"
                  >
                    <div className="aspect-square overflow-hidden bg-white">
                      <img
                        src={suggestedProduct.image}
                        alt={suggestedProduct.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2 mb-2">
                        {suggestedProduct.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          ${suggestedProduct.price.toFixed(2)}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                          <ShoppingCart className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Buy Checkout Modal */}
      {showQuickBuy && (
        <CheckoutModal
          isOpen={showQuickBuy}
          onClose={() => setShowQuickBuy(false)}
          cartItems={cartItems.filter(item => item.product.id === product?.id)}
          subtotal={product ? product.price * quantity : 0}
          tax={(product ? product.price * quantity : 0) * 0.1}
          total={(product ? product.price * quantity : 0) * 1.1}
          onOrderComplete={handleQuickBuyComplete}
        />
      )}
    </div>
  );
}
