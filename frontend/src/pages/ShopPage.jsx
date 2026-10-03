import React, { useState, useEffect } from 'react';
import api from '../api';
import { ShoppingBag, AlertTriangle, Plus, Minus, ShoppingCart, RefreshCw, CheckCircle2, Truck, Store, Tag, Download } from 'lucide-react';
import { downloadReceiptPDF } from '../utils/pdfGenerator';

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [channel, setChannel] = useState('COUNTER'); // COUNTER or ONLINE

  // Cart State
  const [cart, setCart] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchMembers();
  }, [categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/shop/products?category=${encodeURIComponent(categoryFilter)}`);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get('/members');
      setMembers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(c => c.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.stockQuantity) {
        alert(`Cannot add more. Only ${product.stockQuantity} items in stock!`);
        return;
      }
      setCart(cart.map(c => c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      if (product.stockQuantity < 1) {
        alert('Product out of stock!');
        return;
      }
      setCart([...cart, { productId: product.id, name: product.name, price: product.price, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setErrorMsg('');
    try {
      const res = await api.post('/shop/checkout', {
        items: cart.map(c => ({ productId: c.productId, quantity: c.quantity })),
        memberId: selectedMemberId || null,
        channel
      });
      setCheckoutResult(res.data.receipt);
      if (res.data.receipt) {
        downloadReceiptPDF(res.data.receipt);
      }
      setCart([]);
      fetchProducts();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Checkout failed.');
    }
  };

  const handleRestock = async (productId) => {
    const qty = prompt('Enter restock quantity:', '10');
    if (!qty) return;
    try {
      await api.post(`/shop/products/${productId}/restock`, { quantity: parseInt(qty, 10) });
      fetchProducts();
    } catch (err) {
      alert('Failed to restock product.');
    }
  };

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const memberDiscountPercent = selectedMember && selectedMember.tier ? selectedMember.tier.shopDiscountPercent : 0;

  const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const discountAmount = (subtotal * memberDiscountPercent) / 100;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-sky-600" /> Gear Shop & Unified Stock POS
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Shared shelf inventory sync across front desk counter POS and online member orders.
          </p>
        </div>

        {/* Channel Switcher Toggle */}
        <div className="bg-slate-200 p-1 rounded-xl flex items-center gap-1 self-start">
          <button
            onClick={() => setChannel('COUNTER')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${
              channel === 'COUNTER' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4" /> Front Desk POS Counter
          </button>
          <button
            onClick={() => setChannel('ONLINE')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${
              channel === 'ONLINE' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" /> Member Sofa / Delivery Order
          </button>
        </div>
      </div>

      {/* Grid: Catalog on left, Cart on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Product Catalog */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200">
            {['', 'RACKET', 'BALLS', 'SHOES', 'ACCESSORIES', 'APPAREL'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  categoryFilter === cat ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat || 'All Items'}
              </button>
            ))}
          </div>

          {/* Products Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map(p => (
              <div
                key={p.id}
                className={`bg-white p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  p.isLowStock ? 'border-amber-300 ring-2 ring-amber-50' : 'border-slate-200 hover:border-sky-300'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {p.category}
                    </span>
                    {p.isLowStock && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" /> Low Stock ({p.stockQuantity} left)
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mt-2">{p.name}</h3>
                  <div className="text-xl font-extrabold text-slate-900 mt-2">${p.price.toFixed(2)}</div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    In Stock: <strong className={p.stockQuantity === 0 ? 'text-rose-600 font-extrabold' : 'text-slate-800'}>{p.stockQuantity}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestock(p.id)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg text-xs"
                      title="Restock inventory"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => addToCart(p)}
                      disabled={p.stockQuantity === 0}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                        p.stockQuantity === 0
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Checkout Cart Pane */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <ShoppingCart className="w-5 h-5 text-sky-600" /> Checkout Cart ({channel})
            </h3>

            {/* Select Member for Tier Discount */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Member (Apply Tier Discount)</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Guest Walk-in (0% Discount)</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.tier?.name} - {m.tier?.shopDiscountPercent}% Off)
                  </option>
                ))}
              </select>
            </div>

            {memberDiscountPercent > 0 && (
              <div className="bg-emerald-50 text-emerald-800 text-xs p-2.5 rounded-xl border border-emerald-200 mb-4 flex items-center gap-1.5 font-semibold">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>{selectedMember?.tier?.name} Discount: <strong>{memberDiscountPercent}% OFF applied!</strong></span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-xl border border-rose-200 mb-4">
                {errorMsg}
              </div>
            )}

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs italic">
                Cart is empty. Click items from catalog to add.
              </div>
            ) : (
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="text-slate-400">${item.price.toFixed(2)} each</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg">
                        <button onClick={() => updateCartQuantity(item.productId, -1)} className="px-2 py-1 text-slate-600 hover:bg-slate-100">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-bold text-slate-800">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.productId, 1)} className="px-2 py-1 text-slate-600 hover:bg-slate-100">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-bold text-slate-900 min-w-[50px] text-right">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total Calculation */}
            <div className="space-y-2 pt-4 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">${subtotal.toFixed(2)}</span>
              </div>
              {memberDiscountPercent > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Tier Discount ({memberDiscountPercent}%):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Due:</span>
                <span className="text-sky-600">${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full mt-6 py-3 rounded-xl font-bold text-sm shadow-md transition ${
                cart.length === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20'
              }`}
            >
              Complete Sale & Print Receipt
            </button>

            {/* Receipt Modal Result */}
            {checkoutResult && (
              <div className="mt-6 bg-slate-900 text-white p-4 rounded-2xl text-xs space-y-2 font-mono border border-slate-800 shadow-xl">
                <div className="text-center font-bold text-sky-400 pb-2 border-b border-slate-800 text-sm">
                  CLUBORA OFFICIAL RECEIPT
                </div>
                <div className="flex justify-between">
                  <span>Receipt #:</span>
                  <span className="font-bold text-sky-300">{checkoutResult.receiptNumber || 'REC-CONFIRMED'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{checkoutResult.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Channel:</span>
                  <span>{checkoutResult.channel}</span>
                </div>
                {checkoutResult.items && (
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    {checkoutResult.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-[11px] text-slate-300">
                        <span>{it.quantity}x {it.productName}</span>
                        <span>${(it.totalPrice || (it.unitPrice * it.quantity)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between font-bold text-emerald-400 pt-2 border-t border-slate-800">
                  <span>Total Paid:</span>
                  <span>${checkoutResult.finalTotal.toFixed(2)}</span>
                </div>
                <div className="pt-2 flex gap-2 font-sans">
                  <button
                    onClick={() => downloadReceiptPDF(checkoutResult)}
                    className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/30 transition active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" /> Print / Download PDF Receipt
                  </button>
                  <button
                    onClick={() => setCheckoutResult(null)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-300 transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
