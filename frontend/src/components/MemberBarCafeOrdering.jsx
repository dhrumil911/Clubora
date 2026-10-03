import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Coffee, ShoppingBag, Plus, Tag, CheckCircle2, AlertCircle, 
  Sparkles, Clock, Utensils, DollarSign, Send
} from 'lucide-react';

export default function MemberBarCafeOrdering({ user, memberInfo }) {
  const [menuItems, setMenuItems] = useState([]);
  const [activeTabs, setActiveTabs] = useState([]);
  const [cart, setCart] = useState([]);
  const [tableLocation, setTableLocation] = useState('Sofa Patio Table 1');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
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

  const addToCart = (item) => {
    const existing = cart.find(c => c.barItemId === item.id);
    if (existing) {
      setCart(cart.map(c => c.barItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { barItemId: item.id, name: item.name, price: item.price, category: item.category, quantity: 1 }]);
    }
  };

  const removeFromCart = (barItemId) => {
    setCart(cart.filter(c => c.barItemId !== barItemId));
  };

  const calculateItemPrice = (originalPrice) => {
    const discount = (originalPrice * barDiscountPercent) / 100;
    return Math.max(0, originalPrice - discount);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartDiscount = (cartSubtotal * barDiscountPercent) / 100;
  const cartFinalTotal = cartSubtotal - cartDiscount;

  const handlePlaceMemberOrder = async () => {
    if (cart.length === 0) return;
    setFeedback({ type: '', msg: '' });

    try {
      setOrdering(true);
      await api.post('/bar/tabs', {
        memberId: memberInfo?.id || null,
        customerName: user?.name || memberInfo?.name || 'Club Member',
        tableNumber: tableLocation || 'Sofa Patio Table 1',
        items: cart
      });

      setFeedback({ 
        type: 'success', 
        msg: `Order placed successfully! Serving to ${tableLocation}. Member discount of ${barDiscountPercent}% applied.` 
      });
      setCart([]);
      fetchBarData();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.error || 'Failed to place bar order.' });
    } finally {
      setOrdering(false);
    }
  };

  const categories = ['ALL', ...new Set(menuItems.map(i => i.category))];
  const filteredItems = selectedCategory === 'ALL' 
    ? menuItems 
    : menuItems.filter(i => i.category === selectedCategory);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Cafeteria & Bar Menu</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">Sofa & Patio Food & Drink Ordering</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Order fresh protein shakes, coffee, artisanal snacks & craft beers directly to your sofa or court.
          </p>
        </div>

        {/* Member Discount Badge */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-4 py-2 rounded-2xl font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2">
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span>{memberInfo?.tier?.name || 'Gold'} Member Special: {barDiscountPercent}% OFF</span>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback.msg && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
          feedback.type === 'error' 
            ? 'bg-rose-50 border-rose-200 text-rose-700' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback({ type: '', msg: '' })} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Active Member Tabs Notification */}
      {activeTabs.length > 0 && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Your Active Open Bar Tabs ({activeTabs.length})
            </span>
            <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">Running Tab</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeTabs.map(tab => (
              <div key={tab.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-white">{tab.tabNumber} ({tab.tableNumber})</span>
                  <span className="text-emerald-400 font-mono">${tab.finalAmount.toFixed(2)}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {tab.items?.map(i => `${i.quantity}x ${i.barItem?.name}`).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full-width Menu Section */}
      <div className="space-y-4">
        
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredItems.length} menu items
          </span>
        </div>

        {/* Menu Items Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading Menu Items...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => {
              const discountedPrice = calculateItemPrice(item.price);
              return (
                <div
                  key={item.id}
                  className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-amber-400 transition flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {barDiscountPercent}% OFF Member Rate
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base mt-2">{item.name}</h4>
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 line-through mr-2">${item.price.toFixed(2)}</span>
                      <span className="font-extrabold text-slate-900 text-lg text-emerald-600">
                        ${discountedPrice.toFixed(2)}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                      Available at Bar
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
