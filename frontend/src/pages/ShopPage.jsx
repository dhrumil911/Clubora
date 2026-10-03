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
    <div className="max-w-7xl mx-auto px-4 py-8 bg-zinc-950 min-h-screen text-zinc-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-lime-400" /> Gear Shop & Unified Stock POS
          </h1>
          <p className="text-zinc-400 text-xs mt-1 font-medium">
            Shared shelf inventory sync across front desk counter POS and online member orders.
          </p>
        </div>

        {/* Channel Switcher Toggle */}
        <div className="bg-zinc-900 p-1.5 rounded-2xl flex items-center gap-1 self-start border border-zinc-800">
          <button
            onClick={() => setChannel('COUNTER')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              channel === 'COUNTER' ? 'bg-lime-400 text-zinc-950 font-black shadow-lg shadow-lime-400/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" /> Front Desk POS Counter
          </button>
          <button
            onClick={() => setChannel('ONLINE')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              channel === 'ONLINE' ? 'bg-lime-400 text-zinc-950 font-black shadow-lg shadow-lime-400/20' : 'text-zinc-400 hover:text-white'
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
          <div className="flex flex-wrap items-center gap-2 bg-zinc-900 p-3 rounded-2xl border border-zinc-800 shadow-xl">
            {['', 'RACKET', 'BALLS', 'SHOES', 'ACCESSORIES', 'APPAREL'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  categoryFilter === cat ? 'bg-lime-400 text-zinc-950 font-black shadow-md shadow-lime-400/20' : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700/60'
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
                className={`bg-zinc-900 p-5 rounded-3xl border transition-all flex flex-col justify-between shadow-xl ${
                  p.isLowStock ? 'border-amber-400/50 ring-2 ring-amber-400/20' : 'border-zinc-800 hover:border-lime-400/50'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-black text-lime-400 bg-lime-400/10 border border-lime-400/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {p.category}
                    </span>
                    {p.isLowStock && (
                      <span className="text-[10px] font-black text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" /> Low Stock ({p.stockQuantity} left)
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-base mt-3">{p.name}</h3>
                  <div className="text-2xl font-black text-white mt-2">${p.price.toFixed(2)}</div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <div className="text-xs text-zinc-400">
                    In Stock: <strong className={p.stockQuantity === 0 ? 'text-rose-400 font-black' : 'text-zinc-200'}>{p.stockQuantity}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestock(p.id)}
                      className="p-1.5 text-zinc-500 hover:text-lime-400 hover:bg-zinc-800 rounded-xl transition"
                      title="Restock inventory"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => addToCart(p)}
                      disabled={p.stockQuantity === 0}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
                        p.stockQuantity === 0
                          ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-800'
                          : 'bg-lime-400 hover:bg-lime-300 text-zinc-950 shadow-md shadow-lime-400/20'
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
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl sticky top-24">
            <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800">
              <ShoppingCart className="w-5 h-5 text-lime-400" /> Checkout Cart ({channel})
            </h3>

            {/* Select Member for Tier Discount */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">Select Member (Apply Tier Discount)</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-lime-400"
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
              <div className="bg-lime-400/10 text-lime-400 text-xs p-2.5 rounded-xl border border-lime-400/30 mb-4 flex items-center gap-1.5 font-bold">
                <Tag className="w-4 h-4 text-lime-400" />
                <span>{selectedMember?.tier?.name} Discount: <strong>{memberDiscountPercent}% OFF applied!</strong></span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-950/80 text-rose-200 text-xs p-3 rounded-xl border border-rose-800 mb-4">
                {errorMsg}
              </div>
            )}

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs italic">
                Cart is empty. Click items from catalog to add.
              </div>
            ) : (
              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl text-xs border border-zinc-800">
                    <div>
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="text-zinc-400">${item.price.toFixed(2)} each</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg">
                        <button onClick={() => updateCartQuantity(item.productId, -1)} className="px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-bold text-white">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.productId, 1)} className="px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-black text-lime-400 min-w-[50px] text-right">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total Calculation */}
            <div className="space-y-2 pt-4 border-t border-zinc-800 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal:</span>
                <span className="font-bold text-zinc-200">${subtotal.toFixed(2)}</span>
              </div>
              {memberDiscountPercent > 0 && (
                <div className="flex justify-between text-lime-400 font-bold">
                  <span>Tier Discount ({memberDiscountPercent}%):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-zinc-800">
                <span>Total Due:</span>
                <span className="text-lime-400">${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full mt-6 py-3 rounded-xl font-black text-xs shadow-lg transition ${
                cart.length === 0
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-800'
                  : 'bg-lime-400 hover:bg-lime-300 text-zinc-950 shadow-lime-400/20'
              }`}
            >
              Complete Sale & Print Receipt
            </button>

            {/* Receipt Modal Result */}
            {checkoutResult && (
              <div className="mt-6 bg-zinc-950 text-white p-4 rounded-2xl text-xs space-y-2 font-mono border border-zinc-800 shadow-2xl">
                <div className="text-center font-black text-lime-400 pb-2 border-b border-zinc-800 text-sm">
                  CLUBORA OFFICIAL RECEIPT
                </div>
                <div className="flex justify-between">
                  <span>Receipt #:</span>
                  <span className="font-bold text-lime-400">{checkoutResult.receiptNumber || 'REC-CONFIRMED'}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Customer:</span>
                  <span>{checkoutResult.customerName}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Channel:</span>
                  <span>{checkoutResult.channel}</span>
                </div>
                {checkoutResult.items && (
                  <div className="pt-2 border-t border-zinc-800 space-y-1">
                    {checkoutResult.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-[11px] text-zinc-300">
                        <span>{it.quantity}x {it.productName}</span>
                        <span>${(it.totalPrice || (it.unitPrice * it.quantity)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between font-black text-lime-400 pt-2 border-t border-zinc-800">
                  <span>Total Paid:</span>
                  <span>${checkoutResult.finalTotal.toFixed(2)}</span>
                </div>
                <div className="pt-2 flex gap-2 font-sans">
                  <button
                    onClick={() => downloadReceiptPDF(checkoutResult)}
                    className="flex-1 py-2 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-lime-400/20 transition active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF Receipt
                  </button>
                  <button
                    onClick={() => setCheckoutResult(null)}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs text-zinc-300 transition font-bold"
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
