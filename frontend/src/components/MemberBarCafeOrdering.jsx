import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Coffee, ShoppingCart, Plus, Minus, Tag, CheckCircle2, AlertCircle, 
  Sparkles, Clock, Utensils, MapPin, Truck, Store, CreditCard, Banknote
} from 'lucide-react';

export default function MemberBarCafeOrdering({ user, memberInfo }) {
  const [menuItems, setMenuItems] = useState([]);
  const [activeTabs, setActiveTabs] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState('Table 1');
  const [channel, setChannel] = useState('DINE_IN'); // 'DINE_IN' | 'SOFA_DELIVERY'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  const barDiscountPercent = memberInfo?.tier?.barDiscountPercent || (memberInfo?.tier?.name === 'Gold' ? 20 : 10);

  useEffect(() => {
    fetchBarData();
  }, []);

  const fetchBarData = async () => {
    try {
      setLoading(true);
      const [menuRes, tabsRes] = await Promise.all([
        api.get('/bar/menu'),
        api.get('/bar/tabs?status=OPEN')
      ]);
      setMenuItems(menuRes.data || []);
      
      // Filter open tabs for this logged in member
      const userTabs = (tabsRes.data || []).filter(t => 
        (t.memberId && memberInfo && t.memberId === memberInfo.id) ||
        (t.customerName && user && t.customerName.toLowerCase().includes(user.name?.toLowerCase()))
      );
      setActiveTabs(userTabs);
    } catch (err) {
      console.error('Failed to fetch bar menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateItemPrice = (originalPrice) => {
    const discount = (originalPrice * barDiscountPercent) / 100;
    return Math.max(0, originalPrice - discount);
  };

  const addToCart = (item) => {
    const discountedPrice = calculateItemPrice(item.price);
    const existing = cart.find(c => c.barItemId === item.id);
    if (existing) {
      setCart(cart.map(c => c.barItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { 
        barItemId: item.id, 
        name: item.name, 
        originalPrice: item.price, 
        discountedPrice: discountedPrice, 
        category: item.category, 
        quantity: 1 
      }]);
    }
  };

  const updateCartQuantity = (barItemId, delta) => {
    setCart(cart.map(c => {
      if (c.barItemId === barItemId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : null;
      }
      return c;
    }).filter(Boolean));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
  const discountAmount = cart.reduce((sum, item) => sum + ((item.originalPrice - item.discountedPrice) * item.quantity), 0);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  // 1. Pay Now with Razorpay (Immediate Online Settlement)
  const handlePayBarOrderRazorpay = async () => {
    if (cart.length === 0) return;
    setFeedback({ type: '', msg: '' });

    if (typeof window.Razorpay === 'undefined') {
      setFeedback({ type: 'error', msg: 'Razorpay SDK failed to load. Please refresh the page.' });
      return;
    }

    try {
      setSubmittingOrder(true);
      const tabItems = cart.map(c => ({
        barItemId: c.barItemId,
        name: c.name,
        price: c.originalPrice,
        category: c.category,
        quantity: c.quantity
      }));

      const orderRes = await api.post('/payments/razorpay/bar-order', {
        memberId: memberInfo?.id || null,
        customerName: user?.name || memberInfo?.name || 'Club Member',
        tableNumber: selectedTable,
        items: tabItems
      });

      const { orderId, amount, currency, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'Clubora Cafeteria & Bar',
        description: `Bar Order for ${selectedTable}`,
        order_id: orderId,
        prefill: {
          name: user?.name || memberInfo?.name || '',
          email: user?.email || memberInfo?.email || '',
          contact: memberInfo?.phone || ''
        },
        theme: { color: '#a3e635' },
        handler: async function (response) {
          try {
            setSubmittingOrder(true);
            const verifyRes = await api.post('/payments/razorpay/verify-bar', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              memberId: memberInfo?.id || null,
              customerName: user?.name || memberInfo?.name || 'Club Member',
              tableNumber: selectedTable,
              items: tabItems
            });

            setFeedback({
              type: 'success',
              msg: verifyRes.data.message || `Payment verified! Order placed and paid for ${selectedTable}.`
            });
            setCart([]);
            fetchBarData();
          } catch (vErr) {
            setFeedback({ type: 'error', msg: vErr.response?.data?.error || 'Payment verification failed.' });
          } finally {
            setSubmittingOrder(false);
          }
        },
        modal: {
          ondismiss: function () {
            setSubmittingOrder(false);
            setFeedback({ type: 'error', msg: 'Payment cancelled. Order was not placed.' });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setSubmittingOrder(false);
        setFeedback({ type: 'error', msg: `Payment failed: ${resp.error.description}` });
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', msg: err.response?.data?.error || 'Failed to initialize payment.' });
      setSubmittingOrder(false);
    }
  };

  // 2. Add to Open Tab (Pay at Counter / Later)
  const handlePlaceBarOrder = async () => {
    if (cart.length === 0) return;
    setFeedback({ type: '', msg: '' });

    try {
      setSubmittingOrder(true);
      const tabItems = cart.map(c => ({
        barItemId: c.barItemId,
        name: c.name,
        price: c.originalPrice,
        category: c.category,
        quantity: c.quantity
      }));

      await api.post('/bar/tabs', {
        memberId: memberInfo?.id || null,
        customerName: user?.name || memberInfo?.name || 'Club Member',
        tableNumber: selectedTable,
        items: tabItems
      });

      setFeedback({ 
        type: 'success', 
        msg: `Order added to Open Tab for ${selectedTable}. You can pay later or settle online below.` 
      });
      setCart([]);
      fetchBarData();
    } catch (err) {
      setFeedback({ 
        type: 'error', 
        msg: err.response?.data?.error || `Failed to submit order for ${selectedTable}. It may be currently occupied.` 
      });
    } finally {
      setSubmittingOrder(false);
    }
  };

  // 3. Pay Running Tab Online with Razorpay
  const handlePayTabOnline = async (tab) => {
    if (!tab) return;
    if (typeof window.Razorpay === 'undefined') {
      alert('Razorpay SDK failed to load. Please refresh and try again.');
      return;
    }

    try {
      setSubmittingOrder(true);
      const orderRes = await api.post('/payments/razorpay/bar-order', { tabId: tab.id });
      const { orderId, amount, currency, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'Clubora Cafeteria & Bar',
        description: `Settle Tab #${tab.tabNumber} (${tab.tableNumber})`,
        order_id: orderId,
        prefill: {
          name: user?.name || memberInfo?.name || '',
          email: user?.email || memberInfo?.email || '',
          contact: memberInfo?.phone || ''
        },
        theme: { color: '#a3e635' },
        handler: async function (response) {
          try {
            setSubmittingOrder(true);
            const verifyRes = await api.post('/payments/razorpay/verify-bar', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              tabId: tab.id
            });

            setFeedback({
              type: 'success',
              msg: verifyRes.data.message || `Tab #${tab.tabNumber} settled successfully via Razorpay!`
            });
            fetchBarData();
          } catch (vErr) {
            setFeedback({ type: 'error', msg: vErr.response?.data?.error || 'Failed to settle tab.' });
          } finally {
            setSubmittingOrder(false);
          }
        },
        modal: {
          ondismiss: function () {
            setSubmittingOrder(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start tab payment.');
      setSubmittingOrder(false);
    }
  };

  const categories = ['ALL', ...new Set(menuItems.map(i => i.category))];
  const filteredItems = selectedCategory === 'ALL' 
    ? menuItems 
    : menuItems.filter(i => i.category === selectedCategory);

  return (
    <div className="space-y-6 sm:space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Coffee className="w-7 h-7 text-lime-400" /> Bar & Cafeteria Menu POS
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 font-medium">
            Order fresh protein shakes, artisanal coffee, meals & craft beers directly to your table or sofa.
          </p>
        </div>

        {/* Channel Switcher Toggle */}
        <div className="bg-zinc-900 p-1.5 rounded-2xl flex items-center gap-1 self-start border border-zinc-800 shadow-xl">
          <button
            type="button"
            onClick={() => {
              setChannel('DINE_IN');
              setSelectedTable('Table 1');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              channel === 'DINE_IN' ? 'bg-lime-400 text-zinc-950 font-black shadow-lg shadow-lime-400/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Utensils className="w-4 h-4" /> Cafeteria Dine-in
          </button>
          <button
            type="button"
            onClick={() => {
              setChannel('SOFA_DELIVERY');
              setSelectedTable('Sofa Lounge A');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              channel === 'SOFA_DELIVERY' ? 'bg-lime-400 text-zinc-950 font-black shadow-lg shadow-lime-400/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" /> Sofa / Patio Delivery
          </button>
        </div>
      </div>

      {feedback.msg && (
        <div className={`p-4 rounded-2xl flex items-center gap-2 text-xs border ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200' 
            : 'bg-rose-950/80 border-rose-800 text-rose-200'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Main Grid: Catalog Left, Cart Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Menu Catalog Pane */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-lime-400 text-zinc-950 font-black shadow-md shadow-lime-400/20'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
                }`}
              >
                {cat === 'ALL' ? 'Full Menu' : cat}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          {loading ? (
            <div className="py-16 text-center text-xs text-zinc-400">
              <div className="w-7 h-7 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading Bar Menu...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredItems.map(item => {
                const discountedPrice = calculateItemPrice(item.price);
                return (
                  <div
                    key={item.id}
                    className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 hover:border-lime-400/50 transition-all flex flex-col justify-between shadow-xl"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-black text-lime-400 bg-lime-400/10 border border-lime-400/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                          {barDiscountPercent}% OFF
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-base mt-3">{item.name}</h3>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-2xl font-black text-white font-mono">₹{discountedPrice.toFixed(2)}</span>
                        {barDiscountPercent > 0 && (
                          <span className="text-xs text-zinc-500 line-through font-mono">₹{item.price.toFixed(2)}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => addToCart(item)}
                        className="w-full px-3.5 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition bg-lime-400 hover:bg-lime-300 text-zinc-950 shadow-md shadow-lime-400/20 cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Add to Order
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Checkout Cart Pane */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl sticky top-24 space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2 pb-3 border-b border-zinc-800">
              <ShoppingCart className="w-5 h-5 text-lime-400" /> Checkout Cart ({channel === 'DINE_IN' ? 'DINE-IN' : 'SOFA'})
            </h3>

            {/* Select Table / Delivery Location */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {channel === 'DINE_IN' ? 'Select Dine-in Table' : 'Select Delivery Location'}
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-lime-400"
              >
                {channel === 'DINE_IN' ? (
                  <>
                    <option value="Table 1">Table 1 (Main Hall)</option>
                    <option value="Table 2">Table 2 (Main Hall)</option>
                    <option value="Table 3">Table 3 (Window View)</option>
                    <option value="Table 4">Table 4 (Window View)</option>
                    <option value="Table 5">Table 5 (Patio Deck)</option>
                    <option value="Table 6">Table 6 (Patio Deck)</option>
                    <option value="Patio Table A">Patio Table A</option>
                    <option value="Patio Table B">Patio Table B</option>
                    <option value="Bar Counter">Bar Counter</option>
                  </>
                ) : (
                  <>
                    <option value="Sofa Lounge A">Sofa Lounge A</option>
                    <option value="Sofa Lounge B">Sofa Lounge B</option>
                    <option value="Court 1 Bench">Court 1 Bench</option>
                    <option value="Court 2 Bench">Court 2 Bench</option>
                    <option value="VIP Balcony">VIP Balcony</option>
                  </>
                )}
              </select>
            </div>

            {/* Member Account Display */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">Member Account</label>
              <div className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs flex items-center justify-between shadow-inner">
                <div className="font-bold text-white flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></div>
                  <span>{user?.name || memberInfo?.name || 'Club Member'}</span>
                </div>
                <span className="text-[10px] font-black text-lime-400 bg-lime-400/10 px-2.5 py-1 rounded-lg border border-lime-400/30">
                  {memberInfo?.tier?.name || 'Member'} Tier ({barDiscountPercent}% OFF)
                </span>
              </div>
            </div>

            {/* Discount Alert */}
            {barDiscountPercent > 0 && (
              <div className="bg-lime-400/10 text-lime-400 text-xs p-2.5 rounded-xl border border-lime-400/30 flex items-center gap-1.5 font-bold">
                <Tag className="w-4 h-4 text-lime-400" />
                <span>{memberInfo?.tier?.name || 'Member'} Discount: <strong>{barDiscountPercent}% OFF applied!</strong></span>
              </div>
            )}

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs italic border-y border-zinc-800">
                Cart is empty. Click items from catalog to add.
              </div>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1 border-y border-zinc-800 py-3">
                {cart.map(item => (
                  <div key={item.barItemId} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl text-xs border border-zinc-800">
                    <div>
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="text-zinc-400 text-[11px] font-mono">₹{item.discountedPrice.toFixed(2)} each</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.barItemId, -1)}
                          className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-white px-1 text-xs">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.barItemId, 1)}
                          className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-white rounded hover:bg-zinc-800 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="font-mono font-bold text-lime-400 w-16 text-right">
                        ₹{(item.discountedPrice * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="space-y-1.5 text-xs pt-1">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal:</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-lime-400 font-semibold">
                  <span>Tier Discount ({barDiscountPercent}%):</span>
                  <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-zinc-800">
                <span>Total Due:</span>
                <span className="font-mono text-lime-400">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons: Razorpay Pay Now vs Send to Tab */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={cart.length === 0 || submittingOrder}
                onClick={handlePayBarOrderRazorpay}
                className={`w-full py-3 rounded-2xl font-black text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                  cart.length === 0 || submittingOrder
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-800'
                    : 'bg-lime-400 hover:bg-lime-300 text-zinc-950 shadow-lime-400/20'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>{submittingOrder ? 'Processing...' : `Pay ₹${finalTotal.toFixed(2)} Now with Razorpay`}</span>
              </button>

              <button
                type="button"
                disabled={cart.length === 0 || submittingOrder}
                onClick={handlePlaceBarOrder}
                className="w-full py-2.5 rounded-2xl font-bold text-xs bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Add to Open Tab (Pay at Counter / Later)</span>
              </button>
            </div>

            {/* Active Running Tabs */}
            {activeTabs.length > 0 && (
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-lime-400" /> Your Active Tabs
                  </span>
                  <span className="text-lime-400 font-mono font-bold">{activeTabs.length} open</span>
                </div>
                {activeTabs.map(tab => (
                  <div key={tab.id} className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-[11px] flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white">{tab.tableNumber}</span>
                      <span className="text-zinc-500 font-mono ml-1.5">({tab.tabNumber})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lime-400 font-mono">₹{tab.finalAmount.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => handlePayTabOnline(tab)}
                        className="px-2 py-1 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-bold rounded-lg text-[10px] transition cursor-pointer shadow-sm"
                      >
                        Pay Online
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
