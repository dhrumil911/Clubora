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
    <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 shadow-2xl space-y-6 text-white">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-lime-400" />
            <span className="text-xs font-bold text-lime-400 uppercase tracking-wider">Cafeteria & Bar Menu</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Sofa & Patio Food & Drink Ordering</h2>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            Order fresh protein shakes, coffee, artisanal snacks & craft beers directly to your sofa or court.
          </p>
        </div>

        {/* Member Discount Badge */}
        <div className="bg-lime-400 text-zinc-950 px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-lime-400/20 flex items-center gap-2">
          <Sparkles className="w-4 h-4 fill-zinc-950" />
          <span>{memberInfo?.tier?.name || 'Gold'} Member Special: {barDiscountPercent}% OFF</span>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback.msg && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
          feedback.type === 'error' 
            ? 'bg-rose-950/80 border-rose-800 text-rose-200' 
            : 'bg-lime-400/10 border-lime-400/20 text-lime-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedback.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-lime-400" />}
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback({ type: '', msg: '' })} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Active Member Tabs Notification */}
      {activeTabs.length > 0 && (
        <div className="bg-zinc-800/60 text-white p-5 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-lime-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" /> Your Active Open Bar Tabs ({activeTabs.length})
            </span>
            <span className="text-[10px] bg-lime-400/20 text-lime-300 px-2.5 py-0.5 rounded-full font-black border border-lime-400/30">Running Tab</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeTabs.map(tab => (
              <div key={tab.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-xs space-y-1.5">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-white">{tab.tabNumber} ({tab.tableNumber})</span>
                  <span className="text-lime-400 font-mono font-black text-sm">${tab.finalAmount.toFixed(2)}</span>
                </div>
                <div className="text-[11px] text-zinc-400 font-medium">
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
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                  selectedCategory === cat
                    ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20'
                    : 'bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-xs text-zinc-400 font-medium">
            Showing {filteredItems.length} menu items
          </span>
        </div>

        {/* Menu Items Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            <div className="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading Menu Items...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => {
              const discountedPrice = calculateItemPrice(item.price);
              return (
                <div
                  key={item.id}
                  className="bg-zinc-800/60 p-5 rounded-2xl border border-zinc-800 hover:border-lime-400/60 transition flex flex-col justify-between space-y-3 group"
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-lime-400 bg-lime-400/10 px-2.5 py-0.5 rounded-full uppercase border border-lime-400/20">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-extrabold text-lime-400 bg-lime-400/10 px-2.5 py-0.5 rounded-full border border-lime-400/20">
                        {barDiscountPercent}% OFF Member Rate
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-base mt-2.5">{item.name}</h4>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-zinc-500 line-through mr-2 font-mono">${item.price.toFixed(2)}</span>
                      <span className="font-black text-lime-400 text-lg">
                        ${discountedPrice.toFixed(2)}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-zinc-300 bg-zinc-900 px-3 py-1 rounded-xl border border-zinc-800">
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
