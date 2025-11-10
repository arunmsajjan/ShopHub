import { useState, useEffect } from 'react';
import { X, CreditCard, Smartphone, Building2, MapPin, Check, Truck, Store } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import type { CartItemWithProduct } from '@/shared/types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItemWithProduct[];
  subtotal: number;
  tax: number;
  total: number;
  onOrderComplete: () => void;
}

interface UserProfile {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

const PAYMENT_METHODS = [
  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, description: 'Visa, Mastercard, American Express' },
  { id: 'apple', name: 'Apple Pay', icon: Smartphone, description: 'Pay with Touch ID or Face ID' },
  { id: 'google', name: 'Google Pay', icon: Smartphone, description: 'Pay with your Google account' },
  { id: 'bank', name: 'Bank Transfer', icon: Building2, description: 'Direct bank transfer' },
];

const SHOP_INFO = {
  name: 'ShopHub Store',
  address: '123 Commerce Street, Business District',
  city: 'San Francisco, CA 94105',
  phone: '+1 (555) 123-4567',
  email: 'support@shophub.com',
  hours: 'Mon-Fri: 9AM-6PM, Sat-Sun: 10AM-5PM'
};

export default function CheckoutModal({ isOpen, onClose, cartItems, subtotal, tax, total, onOrderComplete }: CheckoutModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({});
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchProfile();
    }
  }, [isOpen, user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleCardInputChange = (field: string, value: string) => {
    if (field === 'number') {
      // Format card number with spaces
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (value.length > 19) value = value.substring(0, 19);
    } else if (field === 'expiry') {
      // Format expiry as MM/YY
      value = value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2');
      if (value.length > 5) value = value.substring(0, 5);
    } else if (field === 'cvv') {
      value = value.replace(/\D/g, '');
      if (value.length > 4) value = value.substring(0, 4);
    }
    
    setCardDetails(prev => ({ ...prev, [field]: value }));
  };

  const processPayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setOrderPlaced(true);
    setIsProcessing(false);
    
    // Auto-close and complete order after 3 seconds
    setTimeout(() => {
      onOrderComplete();
      onClose();
      setCurrentStep(1);
      setOrderPlaced(false);
    }, 3000);
  };

  const isAddressComplete = () => {
    return profile.address_line1 && profile.city && profile.state && profile.zip_code && profile.country;
  };

  const isPaymentComplete = () => {
    if (selectedPayment === 'card') {
      return cardDetails.number.length >= 19 && cardDetails.expiry.length === 5 && 
             cardDetails.cvv.length >= 3 && cardDetails.name.length > 0;
    }
    return true; // For other payment methods
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Secure Checkout</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-4 mt-6">
            {[
              { step: 1, title: 'Address' },
              { step: 2, title: 'Payment' },
              { step: 3, title: 'Review' }
            ].map(({ step, title }) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step ? 'bg-white text-purple-600' : 'bg-white/30 text-white'
                }`}>
                  {currentStep > step ? <Check className="w-5 h-5" /> : step}
                </div>
                <span className="text-sm font-medium">{title}</span>
                {step < 3 && <div className="w-8 h-0.5 bg-white/30 mx-2"></div>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex max-h-[calc(90vh-140px)]">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-semibold">Delivery Address</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      value={profile.first_name || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={profile.last_name || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                    <input
                      type="text"
                      value={profile.country || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 *</label>
                    <input
                      type="text"
                      value={profile.address_line1 || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, address_line1: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                    <input
                      type="text"
                      value={profile.address_line2 || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, address_line2: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                    <input
                      type="text"
                      value={profile.city || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State/Province *</label>
                    <input
                      type="text"
                      value={profile.state || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP/Postal Code *</label>
                    <input
                      type="text"
                      value={profile.zip_code || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, zip_code: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>

                {/* Delivery Options */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-purple-600" />
                    Delivery Options
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="delivery" defaultChecked className="text-purple-600" />
                      <div>
                        <div className="font-medium">Standard Delivery (5-7 days)</div>
                        <div className="text-sm text-gray-600">Free shipping on orders over $50</div>
                      </div>
                      <div className="ml-auto font-semibold text-green-600">Free</div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="delivery" className="text-purple-600" />
                      <div>
                        <div className="font-medium">Express Delivery (2-3 days)</div>
                        <div className="text-sm text-gray-600">Fast shipping</div>
                      </div>
                      <div className="ml-auto font-semibold">$9.99</div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="delivery" className="text-purple-600" />
                      <div>
                        <div className="font-medium">Next Day Delivery</div>
                        <div className="text-sm text-gray-600">Overnight shipping</div>
                      </div>
                      <div className="ml-auto font-semibold">$19.99</div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!isAddressComplete()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-semibold">Payment Method</h3>
                </div>

                {/* Payment Methods */}
                <div className="space-y-4">
                  {PAYMENT_METHODS.map((method) => (
                    <label key={method.id} className="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer hover:border-purple-300 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={selectedPayment === method.id}
                        onChange={(e) => setSelectedPayment(e.target.value)}
                        className="text-purple-600"
                      />
                      <method.icon className="w-6 h-6 text-gray-600" />
                      <div className="flex-1">
                        <div className="font-medium">{method.name}</div>
                        <div className="text-sm text-gray-600">{method.description}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Card Details */}
                {selectedPayment === 'card' && (
                  <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                    <h4 className="font-semibold">Card Details</h4>
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                        <input
                          type="text"
                          value={cardDetails.name}
                          onChange={(e) => handleCardInputChange('name', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                        <input
                          type="text"
                          value={cardDetails.number}
                          onChange={(e) => handleCardInputChange('number', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                          placeholder="1234 5678 9012 3456"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                          <input
                            type="text"
                            value={cardDetails.expiry}
                            onChange={(e) => handleCardInputChange('expiry', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                            placeholder="MM/YY"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                          <input
                            type="text"
                            value={cardDetails.cvv}
                            onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                            placeholder="123"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    disabled={!isPaymentComplete()}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                {orderPlaced ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h3>
                    <p className="text-gray-600 mb-6">Your order has been confirmed and will be processed shortly.</p>
                    <div className="bg-gray-50 rounded-xl p-4 text-left max-w-md mx-auto">
                      <div className="font-semibold text-sm text-gray-700">Order Details:</div>
                      <div className="text-sm text-gray-600 mt-2">
                        <div>Order #: ORD-{Date.now().toString().slice(-6)}</div>
                        <div>Items: {cartItems.length}</div>
                        <div>Total: ${total.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <Check className="w-6 h-6 text-purple-600" />
                      <h3 className="text-xl font-semibold">Order Review</h3>
                    </div>

                    {/* Delivery Address */}
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <h4 className="font-semibold text-lg mb-4">Delivery Address</h4>
                      <div className="text-gray-700">
                        <div className="font-medium">{profile.first_name} {profile.last_name}</div>
                        <div>{profile.address_line1}</div>
                        {profile.address_line2 && <div>{profile.address_line2}</div>}
                        <div>{profile.city}, {profile.state} {profile.zip_code}</div>
                        <div>{profile.country}</div>
                        {profile.phone && <div className="mt-2">Phone: {profile.phone}</div>}
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <h4 className="font-semibold text-lg mb-4">Payment Method</h4>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const selectedMethod = PAYMENT_METHODS.find(m => m.id === selectedPayment);
                          if (selectedMethod) {
                            const IconComponent = selectedMethod.icon;
                            return <IconComponent className="w-6 h-6 text-gray-600" />;
                          }
                          return null;
                        })()}
                        <span className="font-medium">
                          {PAYMENT_METHODS.find(m => m.id === selectedPayment)?.name}
                        </span>
                        {selectedPayment === 'card' && cardDetails.number && (
                          <span className="text-gray-600 ml-auto">
                            **** **** **** {cardDetails.number.replace(/\s/g, '').slice(-4)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <h4 className="font-semibold text-lg mb-4">Order Items</h4>
                      <div className="space-y-4">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex gap-4">
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h5 className="font-medium">{item.product.name}</h5>
                              <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={processPayment}
                        disabled={isProcessing}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {isProcessing ? 'Processing...' : `Place Order - $${total.toFixed(2)}`}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Order Summary & Shop Info */}
          <div className="w-80 bg-gray-50 p-6 border-l border-gray-200">
            {/* Shop Information */}
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Store className="w-6 h-6 text-purple-600" />
                <h4 className="font-semibold">Shop Information</h4>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium">{SHOP_INFO.name}</div>
                  <div className="text-gray-600">{SHOP_INFO.address}</div>
                  <div className="text-gray-600">{SHOP_INFO.city}</div>
                </div>
                <div>
                  <div className="font-medium">Contact</div>
                  <div className="text-gray-600">{SHOP_INFO.phone}</div>
                  <div className="text-gray-600">{SHOP_INFO.email}</div>
                </div>
                <div>
                  <div className="font-medium">Business Hours</div>
                  <div className="text-gray-600">{SHOP_INFO.hours}</div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-6">
              <h4 className="font-semibold text-lg mb-4">Order Summary</h4>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-purple-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 text-center">
                <p>🔒 Secure checkout guaranteed</p>
                <p>SSL encrypted payment processing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
