import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  ShoppingBag, AlertTriangle, Plus, Minus, ShoppingCart, RefreshCw, 
  CheckCircle2, Truck, Store, Tag, Download, CreditCard, Banknote, ShieldAlert,
  Send, PackageCheck, Clock, FileText, X, Search, Check, XCircle, ArrowUpRight, Filter, Layers, Inbox
} from 'lucide-react';
import { downloadReceiptPDF } from '../utils/pdfGenerator';

export default function ShopPage({ user, isEmbedded = false }) {
  const [products, setProducts] = useState([]);
  const [members, setMembers] = useState([]);
  const [inventoryRequests, setInventoryRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [channel, setChannel] = useState('COUNTER');

  // Staff Sub-tab Switcher: 'INVENTORY' or 'REQUESTS'
  const [activeStaffTab, setActiveStaffTab] = useState('INVENTORY');

  // Member Cart State (USED ONLY FOR MEMBER ROLE)
  const [cart, setCart] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState('ONLINE');

  // Modal States for Staff & Owner
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedProductForAddStock, setSelectedProductForAddStock] = useState(null);
  const [addStockQty, setAddStockQty] = useState(10);
  const [addStockNotes, setAddStockNotes] = useState('');

  const [showRequestStockModal, setShowRequestStockModal] = useState(false);
  const [selectedProductForRequest, setSelectedProductForRequest] = useState(null);
  const [requestQty, setRequestQty] = useState(20);
  const [requestReason, setRequestReason] = useState('Low/Out of stock replenishment');

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedRequestForReceive, setSelectedRequestForReceive] = useState(null);
  const [receiveQty, setReceiveQty] = useState(10);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequestForReject, setSelectedRequestForReject] = useState(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('Supplier unavailable');

  const [submittingAction, setSubmittingAction] = useState(false);

  const isMember = user?.role === 'MEMBER';
  const isStaffOrOwner = !isMember && Boolean(user?.role);
  const isOwner = user?.role === 'OWNER';

  useEffect(() => {
    fetchProducts();
    fetchMembers();
    fetchInventoryRequests();
  }, [categoryFilter]);

  // Lock member ID for Member role
  useEffect(() => {
    if (user?.role === 'MEMBER' && members.length > 0) {
      const myMem = members.find(m => m.email?.toLowerCase() === user.email?.toLowerCase());
      if (myMem && selectedMemberId !== myMem.id) {
        setSelectedMemberId(myMem.id);
      }
    }
  }, [user, members, selectedMemberId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/shop/products?category=${encodeURIComponent(categoryFilter)}`);
      setProducts(res.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await api.get('/members');
      const allMembers = res.data || [];
      setMembers(allMembers);
      if (user?.role === 'MEMBER') {
        const myMem = allMembers.find(m => m.email?.toLowerCase() === user.email?.toLowerCase());
        if (myMem) {
          setSelectedMemberId(myMem.id);
        }
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const fetchInventoryRequests = async () => {
    try {
      const res = await api.get('/shop/inventory-requests');
      setInventoryRequests(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch inventory requests:', err);
    }
  };

  // ==========================================
  // MEMBER CART HANDLERS (STRICTLY FOR MEMBERS)
  // ==========================================
  const addToCart = (product) => {
    const existing = cart.find(c => c.productId === product.id);
    const available = product.stockQuantity || 0;

    if (available <= 0) {
      alert(`"${product.name}" is currently OUT OF STOCK.`);
      return;
    }

    if (existing) {
      if (existing.quantity >= available) {
        alert(`Cannot add more. Requested quantity (${existing.quantity + 1}) exceeds available inventory (${available}).`);
        return;
      }
      setCart(cart.map(c => c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { productId: product.id, name: product.name, price: product.price, quantity: 1, availableStock: available }]);
    }
  };

  const updateCartQuantity = (productId, delta) => {
    const targetProduct = products.find(p => p.id === productId);
    const available = targetProduct ? targetProduct.stockQuantity : 999;

    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (newQty > available) {
          alert(`Cannot increase quantity. Requested (${newQty}) exceeds available inventory (${available}).`);
          return item;
        }
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setErrorMsg('');

    // Cash path
    if (paymentMode === 'CASH') {
      try {
        setProcessing(true);
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
        setErrorMsg(err.response?.data?.error || 'Cash checkout failed.');
      } finally {
        setProcessing(false);
      }
      return;
    }

    // Razorpay Online Payment path
    if (typeof window.Razorpay === 'undefined') {
      setErrorMsg('Razorpay SDK failed to load. Please refresh the page.');
      return;
    }

    try {
      setProcessing(true);
      const orderRes = await api.post('/payments/razorpay/shop-order', {
        items: cart.map(c => ({ productId: c.productId, quantity: c.quantity })),
        memberId: selectedMemberId || null,
        channel
      });

      const { orderId, amount, currency, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'Clubora Gear Pro Shop',
        description: `Pro Shop Purchase (${cart.length} item${cart.length > 1 ? 's' : ''})`,
        order_id: orderId,
        prefill: {
          name: selectedMember?.name || user?.name || '',
          email: selectedMember?.email || user?.email || '',
          contact: selectedMember?.phone || ''
        },
        theme: { color: '#a3e635' },
        handler: async function (response) {
          try {
            setProcessing(true);
            const verifyRes = await api.post('/payments/razorpay/verify-shop', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              items: cart.map(c => ({ productId: c.productId, quantity: c.quantity })),
              memberId: selectedMemberId || null,
              channel
            });

            setCheckoutResult(verifyRes.data.receipt);
            if (verifyRes.data.receipt) {
              downloadReceiptPDF(verifyRes.data.receipt);
            }
            setCart([]);
            fetchProducts();
          } catch (verifyErr) {
            console.error('Verify Shop Error:', verifyErr);
            setErrorMsg(verifyErr.response?.data?.error || 'Payment signature verification failed.');
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            setErrorMsg('Payment cancelled. Your cart items are preserved.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('Shop Order Error:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to initialize payment.');
      setProcessing(false);
    }
  };

  // ==========================================
  // STAFF & OWNER INVENTORY ACTIONS
  // ==========================================

  // 1. Instant Add Stock (Physical Stock Arrived)
  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductForAddStock) return;
    try {
      setSubmittingAction(true);
      await api.post(`/shop/products/${selectedProductForAddStock.id}/add-stock`, {
        quantity: parseInt(addStockQty, 10),
        notes: addStockNotes
      });
      alert(`Added ${addStockQty} units to "${selectedProductForAddStock.name}". Current stock updated!`);
      setShowAddStockModal(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add stock.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // 2. Request Stock from Owner (Status: PENDING)
  const handleRequestStockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductForRequest) return;
    try {
      setSubmittingAction(true);
      await api.post('/shop/inventory-requests', {
        productId: selectedProductForRequest.id,
        itemName: selectedProductForRequest.name,
        category: selectedProductForRequest.category,
        requestedQuantity: parseInt(requestQty, 10),
        reason: requestReason,
        requestedBy: user?.name || 'Shop Staff'
      });
      alert(`Inventory Request for ${requestQty} units of "${selectedProductForRequest.name}" sent to Owner (Status: PENDING)!`);
      setShowRequestStockModal(false);
      fetchInventoryRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit inventory request.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // 3. Mark Stock Received (Status: RECEIVED -> Inventory Increases Now!)
  const handleReceiveStockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequestForReceive) return;
    try {
      setSubmittingAction(true);
      await api.put(`/shop/inventory-requests/${selectedRequestForReceive.id}/receive`, {
        quantity: parseInt(receiveQty, 10),
        receivedBy: user?.name || 'Shop Staff'
      });
      alert(`Physical stock received! Updated inventory with +${receiveQty} units.`);
      setShowReceiveModal(false);
      fetchInventoryRequests();
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record received stock.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Owner Approve Request
  const handleApproveRequest = async (reqId) => {
    try {
      await api.put(`/shop/inventory-requests/${reqId}/approve`);
      alert('Request Approved! Status is now APPROVED. Staff can mark as RECEIVED when physical stock arrives.');
      fetchInventoryRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve request.');
    }
  };

  // Owner Mark Ordered
  const handleOrderedRequest = async (reqId) => {
    try {
      await api.put(`/shop/inventory-requests/${reqId}/ordered`);
      alert('Request marked as ORDERED.');
      fetchInventoryRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark request as ordered.');
    }
  };

  // Owner Reject Request
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequestForReject) return;
    try {
      setSubmittingAction(true);
      await api.put(`/shop/inventory-requests/${selectedRequestForReject.id}/reject`, {
        rejectionReason: rejectionReasonText,
        approvedBy: user?.name || 'Club Owner'
      });
      alert('Request marked as REJECTED.');
      setShowRejectModal(false);
      fetchInventoryRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject request.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Computations
  const selectedMember = members.find(m => m.id === selectedMemberId);
  const memberDiscountPercent = selectedMember?.tier ? selectedMember.tier.shopDiscountPercent : 0;
  const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const discountAmount = (subtotal * memberDiscountPercent) / 100;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  // Filtered Products for Staff/Member
  const filteredProducts = products.filter(p => {
    if (searchQuery.trim() && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (stockStatusFilter === 'IN_STOCK' && p.stockQuantity <= (p.lowStockThreshold || 5)) return false;
    if (stockStatusFilter === 'LOW_STOCK' && (p.stockQuantity === 0 || p.stockQuantity > (p.lowStockThreshold || 5))) return false;
    if (stockStatusFilter === 'OUT_OF_STOCK' && p.stockQuantity > 0) return false;
    return true;
  });

  const inStockCount = products.filter(p => p.stockQuantity > (p.lowStockThreshold || 5)).length;
  const lowStockCount = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= (p.lowStockThreshold || 5)).length;
  const outOfStockCount = products.filter(p => p.stockQuantity === 0).length;
  const pendingRequestsCount = inventoryRequests.filter(r => r.status === 'PENDING').length;

  return (
    <div className={isEmbedded ? 'w-full min-w-0 text-zinc-900' : 'max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-zinc-950 min-h-screen text-zinc-100'}>
      
      {/* Page Header */}
      <div className={isEmbedded ? 'owner-tab-actions flex justify-end' : 'flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6'}>
        {!isEmbedded && <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-lime-400" />
            {isStaffOrOwner ? 'Shop Inventory & Stock Management' : 'Gear Shop & Pro Equipment'}
          </h1>
          <p className="text-zinc-400 text-xs mt-0.5 font-medium">
            {isStaffOrOwner 
              ? 'Operational inventory tracking, stock adjustments, and Owner purchase request workflow.'
              : 'Browse rackets, balls, apparel and gear. Member discounts applied automatically at checkout.'}
          </p>
        </div>}

        {/* Refresh & Quick Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => { fetchProducts(); fetchInventoryRequests(); }}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-lime-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          WORKFLOW 1: SHOP STAFF & OWNER INVENTORY MANAGEMENT INTERFACE
          (NO MEMBER CART, NO ADD TO CART, NO CHECKOUT UI FOR STAFF)
          ========================================================================= */}
      {isStaffOrOwner ? (
        <div className="space-y-6">
          
          {/* Staff Metric KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-lg">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Total Products</span>
              <div className="text-2xl font-black text-white mt-1">{products.length}</div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-lg">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">In Stock</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{inStockCount}</div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-lg">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Low Stock Alert</span>
              <div className="text-2xl font-black text-amber-400 mt-1">{lowStockCount}</div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-lg">
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Out of Stock</span>
              <div className="text-2xl font-black text-rose-400 mt-1">{outOfStockCount}</div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-lg col-span-2 lg:col-span-1">
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider">Pending Requests</span>
              <div className="text-2xl font-black text-sky-400 mt-1">{pendingRequestsCount}</div>
            </div>
          </div>

          {/* Navigation Tabs for Staff: Stock Inventory vs Requests Tracker */}
          <div className="flex border-b border-zinc-800 gap-2 overflow-x-auto pb-px">
            <button
              onClick={() => setActiveStaffTab('INVENTORY')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
                activeStaffTab === 'INVENTORY'
                  ? 'border-lime-400 text-lime-400 font-black'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" /> Current Inventory Stock ({filteredProducts.length})
            </button>

            <button
              onClick={() => setActiveStaffTab('REQUESTS')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
                activeStaffTab === 'REQUESTS'
                  ? 'border-lime-400 text-lime-400 font-black'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Inbox className="w-4 h-4" /> Inventory Requests Tracker ({inventoryRequests.length})
              {pendingRequestsCount > 0 && (
                <span className="bg-amber-400 text-zinc-950 font-black px-1.5 py-0.5 rounded-full text-[10px]">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: CURRENT INVENTORY STOCK MANAGEMENT */}
          {activeStaffTab === 'INVENTORY' && (
            <div className="space-y-4">
              
              {/* Category & Status Filter Bar */}
              <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                
                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none">
                  {['', 'Rackets', 'Balls', 'Apparel', 'Grips & String', 'Accessories'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                        categoryFilter === cat
                          ? 'bg-lime-400 text-zinc-950 font-black shadow-md'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {cat || 'All Gear'}
                    </button>
                  ))}
                </div>

                {/* Search & Stock Status */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-48">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search product..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-lime-400"
                    />
                  </div>

                  <select
                    value={stockStatusFilter}
                    onChange={(e) => setStockStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white font-bold focus:ring-1 focus:ring-lime-400"
                  >
                    <option value="ALL">All Stock Status</option>
                    <option value="IN_STOCK">In Stock Only</option>
                    <option value="LOW_STOCK">Low Stock Alert</option>
                    <option value="OUT_OF_STOCK">Out of Stock Only</option>
                  </select>
                </div>

              </div>

              {/* Staff Inventory Stock Table */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                {filteredProducts.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-500 italic">
                    No products found matching filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-zinc-300">
                      <thead className="bg-zinc-950 text-zinc-400 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-800">
                        <tr>
                          <th className="px-4 py-3">Product Name</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Price</th>
                          <th className="px-4 py-3 text-center">Current Stock</th>
                          <th className="px-4 py-3 text-center">Low Threshold</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {filteredProducts.map((p) => {
                          const isOut = p.stockQuantity === 0;
                          const isLow = p.stockQuantity > 0 && p.stockQuantity <= (p.lowStockThreshold || 5);
                          return (
                            <tr key={p.id} className="hover:bg-zinc-800/40 transition">
                              <td className="px-4 py-3.5 font-bold text-white">
                                {p.name}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="bg-zinc-950 text-zinc-300 px-2 py-0.5 rounded-md border border-zinc-800 text-[10px] font-bold">
                                  {p.category}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 font-mono text-white font-bold">
                                ₹{p.price.toFixed(2)}
                              </td>
                              <td className="px-4 py-3.5 text-center font-mono font-black text-sm">
                                <span className={isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}>
                                  {p.stockQuantity}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center font-mono text-zinc-400">
                                {p.lowStockThreshold || 5}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                  isOut ? 'bg-rose-950/80 text-rose-300 border-rose-800' :
                                  isLow ? 'bg-amber-950/80 text-amber-300 border-amber-800' :
                                  'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                }`}>
                                  {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  
                                  {/* Action 1: Add Stock (Instant Stock In-house) */}
                                  <button
                                    onClick={() => {
                                      setSelectedProductForAddStock(p);
                                      setAddStockQty(10);
                                      setAddStockNotes('');
                                      setShowAddStockModal(true);
                                    }}
                                    className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-lime-400 text-xs font-bold rounded-xl border border-zinc-800 transition flex items-center gap-1 cursor-pointer"
                                    title="Add physical stock received directly"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> Add Stock
                                  </button>

                                  {/* Action 2: Request Stock from Owner */}
                                  <button
                                    onClick={() => {
                                      setSelectedProductForRequest(p);
                                      setRequestQty(20);
                                      setRequestReason(isOut ? 'Out of stock' : 'Low stock replenishment');
                                      setShowRequestStockModal(true);
                                    }}
                                    className="px-3 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 text-xs font-bold rounded-xl border border-amber-400/30 transition flex items-center gap-1 cursor-pointer"
                                    title="Submit purchase request to Owner"
                                  >
                                    <Send className="w-3.5 h-3.5" /> Request Stock
                                  </button>

                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: INVENTORY REQUESTS TRACKER */}
          {activeStaffTab === 'REQUESTS' && (
            <div className="space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Inbox className="w-4 h-4 text-lime-400" /> Inventory Purchase Order Requests Log
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Track status: PENDING → APPROVED → ORDERED → RECEIVED (or REJECTED)</p>
                  </div>
                  <button
                    onClick={fetchInventoryRequests}
                    className="p-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {inventoryRequests.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-500 italic">
                    No inventory requests logged yet. Use "Request Stock" from the inventory list to submit requests to Owner.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inventoryRequests.map(r => (
                      <div key={r.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{r.itemName || r.productName}</span>
                            <span className="text-xs text-zinc-400 font-mono">({r.requestedQuantity} units requested)</span>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                              r.status === 'PENDING' ? 'bg-amber-400/10 text-amber-400 border-amber-400/30' :
                              r.status === 'APPROVED' ? 'bg-sky-400/10 text-sky-400 border-sky-400/30' :
                              r.status === 'ORDERED' ? 'bg-purple-400/10 text-purple-400 border-purple-400/30' :
                              r.status === 'RECEIVED' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30' :
                              'bg-rose-400/10 text-rose-400 border-rose-400/30'
                            }`}>
                              {r.status}
                            </span>
                          </div>

                          <div className="text-zinc-400">
                            Requested by <strong className="text-zinc-200">{r.requestedBy}</strong> &bull; Current Stock: <strong className="text-white">{r.currentStock ?? 0}</strong> &bull; Category: {r.category}
                            {(r.reason || r.notes) && <span className="text-zinc-300 italic"> &bull; "{r.reason || r.notes}"</span>}
                          </div>

                          {r.rejectionReason && (
                            <div className="text-xs text-rose-400 font-medium italic">
                              Rejection Reason: {r.rejectionReason}
                            </div>
                          )}
                        </div>

                        {/* Status Actions */}
                        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                          
                          {/* Owner Approval/Rejection Actions */}
                          {isOwner && r.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApproveRequest(r.id)}
                                className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-md cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequestForReject(r);
                                  setRejectionReasonText('Supplier unavailable');
                                  setShowRejectModal(true);
                                }}
                                className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold rounded-xl text-xs border border-rose-800 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-400" /> Reject
                              </button>
                            </>
                          )}

                          {isOwner && r.status === 'APPROVED' && (
                            <button
                              onClick={() => handleOrderedRequest(r.id)}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md cursor-pointer"
                            >
                              Mark Ordered
                            </button>
                          )}

                          {/* Staff/Owner Mark Received Action (Increases Inventory!) */}
                          {(r.status === 'APPROVED' || r.status === 'ORDERED') && (
                            <button
                              onClick={() => {
                                setSelectedRequestForReceive(r);
                                setReceiveQty(r.requestedQuantity || 10);
                                setShowReceiveModal(true);
                              }}
                              className="px-3.5 py-1.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-md shadow-lime-400/20 cursor-pointer"
                            >
                              <PackageCheck className="w-4 h-4" /> Mark Stock Received (+Stock)
                            </button>
                          )}

                          {r.status === 'RECEIVED' && (
                            <span className="text-xs font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-xl border border-emerald-400/30">
                              RECEIVED (+{r.receivedQuantity || r.requestedQuantity} Added)
                            </span>
                          )}

                          {r.status === 'REJECTED' && (
                            <span className="text-xs font-bold text-rose-400 bg-rose-400/10 px-3 py-1 rounded-xl border border-rose-400/30">
                              REJECTED
                            </span>
                          )}

                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* =========================================================================
            WORKFLOW 2: MEMBER SHOPPING & CART INTERFACE (STRICTLY FOR MEMBERS)
            ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Products Grid Pane */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-5">
            
            {/* Categories Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {['', 'Rackets', 'Balls', 'Apparel', 'Grips & String', 'Accessories'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-lime-400 text-zinc-950 font-black shadow-md shadow-lime-400/20'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
                  }`}
                >
                  {cat || 'All Gear'}
                </button>
              ))}
            </div>

            {/* Products Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => {
                const isOut = p.stockQuantity === 0;
                const isLow = p.stockQuantity > 0 && p.stockQuantity <= (p.lowStockThreshold || 5);
                const itemInCart = cart.find(c => c.productId === p.id);
                const cartQty = itemInCart ? itemInCart.quantity : 0;
                const canAdd = p.stockQuantity > 0 && cartQty < p.stockQuantity;

                return (
                  <div 
                    key={p.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition relative overflow-hidden group shadow-xl"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                          {p.category}
                        </span>
                        {isOut ? (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full border border-rose-400/20">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                            <AlertTriangle className="w-3 h-3" /> Low Stock ({p.stockQuantity})
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                            In Stock ({p.stockQuantity})
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-white text-base mt-3">{p.name}</h3>
                      <div className="text-2xl font-black text-white mt-2 font-mono">₹{p.price.toFixed(2)}</div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                      <div className="text-xs text-zinc-400">
                        Available Stock: <strong className={isOut ? 'text-rose-400 font-black' : 'text-zinc-200'}>{p.stockQuantity}</strong>
                      </div>

                      {/* Add to Cart Button for Member */}
                      <button
                        onClick={() => addToCart(p)}
                        disabled={!canAdd}
                        className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          !canAdd
                            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-800'
                            : 'bg-lime-400 hover:bg-lime-300 text-zinc-950 shadow-md shadow-lime-400/20'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{isOut ? 'Out of Stock' : cartQty >= p.stockQuantity ? 'Max Stock Reached' : 'Add to Cart'}</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

          {/* Member Checkout Cart Pane */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-zinc-900 p-5 sm:p-6 rounded-2xl border border-zinc-800 shadow-2xl sticky top-24">
              <h3 className="text-base font-black text-white flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800">
                <ShoppingCart className="w-4 h-4 text-lime-400" /> Member Shopping Cart
              </h3>

              {/* Member Tier Account Box */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Member Profile (Tier Discount Applied)
                </label>

                <div className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs flex items-center justify-between shadow-inner">
                  <div className="font-bold text-white flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></div>
                    <span>{selectedMember?.name || user?.name || 'Club Member'}</span>
                  </div>
                  <span className="text-[10px] font-black text-lime-400 bg-lime-400/10 px-2.5 py-1 rounded-lg border border-lime-400/30">
                    {selectedMember?.tier?.name || 'Gold'} Tier ({memberDiscountPercent}% OFF)
                  </span>
                </div>
              </div>

              {memberDiscountPercent > 0 && (
                <div className="bg-lime-400/10 text-lime-400 text-xs p-2.5 rounded-xl border border-lime-400/30 mb-4 flex items-center gap-1.5 font-bold">
                  <Tag className="w-4 h-4 text-lime-400" />
                  <span>{selectedMember?.tier?.name} Discount: <strong>{memberDiscountPercent}% OFF applied!</strong></span>
                </div>
              )}

              {errorMsg && (
                <div className="bg-rose-950/80 text-rose-200 text-xs p-3 rounded-xl border border-rose-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Cart Items List */}
              {cart.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs italic">
                  Your cart is empty. Browse gear on the left to add.
                </div>
              ) : (
                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.productId} className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl text-xs border border-zinc-800">
                      <div>
                        <div className="font-bold text-white">{item.name}</div>
                        <div className="text-zinc-400 font-mono">₹{item.price.toFixed(2)} each</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg">
                          <button onClick={() => updateCartQuantity(item.productId, -1)} className="px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-bold text-white">{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.productId, 1)} className="px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-black text-lime-400 min-w-[50px] text-right font-mono">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Payment Method Selector */}
              <div className="mb-4 pt-3 border-t border-zinc-800">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('ONLINE')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition cursor-pointer ${
                      paymentMode === 'ONLINE'
                        ? 'border-lime-400 bg-lime-400/10 text-lime-400 ring-2 ring-lime-400/20'
                        : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-lime-400" />
                    <span>Razorpay Online</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CASH')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition cursor-pointer ${
                      paymentMode === 'CASH'
                        ? 'border-lime-400 bg-lime-400/10 text-lime-400 ring-2 ring-lime-400/20'
                        : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-400" />
                    <span>Cash Counter POS</span>
                  </button>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="space-y-2 pt-3 border-t border-zinc-800 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal:</span>
                  <span className="font-bold text-zinc-200 font-mono">₹{subtotal.toFixed(2)}</span>
                </div>
                {memberDiscountPercent > 0 && (
                  <div className="flex justify-between text-lime-400 font-bold">
                    <span>Tier Discount ({memberDiscountPercent}%):</span>
                    <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-zinc-800">
                  <span>Total Due:</span>
                  <span className="text-lime-400 font-mono">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || processing}
                className={`w-full mt-5 py-3 rounded-xl font-black text-xs shadow-lg transition cursor-pointer flex items-center justify-center gap-2 ${
                  cart.length === 0 || processing
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-800'
                    : 'bg-lime-400 hover:bg-lime-300 text-zinc-950 shadow-lime-400/20'
                }`}
              >
                {processing ? (
                  <span>Processing...</span>
                ) : paymentMode === 'ONLINE' ? (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ₹{finalTotal.toFixed(2)} with Razorpay</span>
                  </>
                ) : (
                  <>
                    <Banknote className="w-4 h-4" />
                    <span>Complete Order (Cash Counter)</span>
                  </>
                )}
              </button>

              {/* Receipt Result */}
              {checkoutResult && (
                <div className="mt-5 bg-zinc-950 text-white p-4 rounded-xl text-xs space-y-2 font-mono border border-zinc-800 shadow-xl">
                  <div className="text-center font-black text-lime-400 pb-2 border-b border-zinc-800 text-xs">
                    RECEIPT #{checkoutResult.receiptNumber || 'CONFIRMED'}
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Total Paid:</span>
                    <span className="font-black text-lime-400">₹{checkoutResult.finalTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => downloadReceiptPDF(checkoutResult)}
                    className="w-full mt-2 py-2 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF Receipt
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          MODALS FOR STAFF & OWNER WORKFLOW
          ========================================================================= */}

      {/* Modal 1: Add Stock (Instant Stock In-house) */}
      {showAddStockModal && selectedProductForAddStock && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-lime-400" /> Add In-House Physical Stock
              </h3>
              <button onClick={() => setShowAddStockModal(false)} className="text-zinc-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-xs space-y-1">
              <div className="font-bold text-white text-sm">{selectedProductForAddStock.name}</div>
              <div className="text-zinc-400">Category: {selectedProductForAddStock.category} &bull; Current Stock: <strong className="text-lime-400 font-bold">{selectedProductForAddStock.stockQuantity}</strong></div>
            </div>

            <form onSubmit={handleAddStockSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Quantity Received / Added</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={addStockQty}
                  onChange={(e) => setAddStockQty(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono font-bold focus:ring-2 focus:ring-lime-400"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Stock Note / Invoice Ref (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Received from main warehouse"
                  value={addStockNotes}
                  onChange={(e) => setAddStockNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:ring-2 focus:ring-lime-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="flex-1 py-2.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black rounded-xl text-xs flex items-center justify-center gap-1 shadow-md shadow-lime-400/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Add Stock to Inventory
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Request Stock from Owner (Status: PENDING) */}
      {showRequestStockModal && selectedProductForRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-400" /> Send Inventory Request to Owner
              </h3>
              <button onClick={() => setShowRequestStockModal(false)} className="text-zinc-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-xs space-y-1">
              <div className="font-bold text-white text-sm">{selectedProductForRequest.name}</div>
              <div className="text-zinc-400">Category: {selectedProductForRequest.category} &bull; Current Stock: <strong className="text-rose-400 font-bold">{selectedProductForRequest.stockQuantity}</strong></div>
            </div>

            <form onSubmit={handleRequestStockSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Requested Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={requestQty}
                  onChange={(e) => setRequestQty(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono font-bold focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Reason for Request</label>
                <textarea
                  rows="3"
                  required
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="e.g. Out of stock, high demand for weekend tournament..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:ring-2 focus:ring-amber-400"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Submit Request (PENDING)
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestStockModal(false)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Mark Stock Received (Status: RECEIVED -> Inventory Increases Now!) */}
      {showReceiveModal && selectedRequestForReceive && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-400" /> Record Physical Stock Received
              </h3>
              <button onClick={() => setShowReceiveModal(false)} className="text-zinc-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-xs space-y-1">
              <div className="font-bold text-white text-sm">{selectedRequestForReceive.itemName || selectedRequestForReceive.productName}</div>
              <div className="text-zinc-400">Requested Quantity: <strong className="text-white font-bold">{selectedRequestForReceive.requestedQuantity}</strong></div>
            </div>

            <form onSubmit={handleReceiveStockSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Physical Units Received</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={receiveQty}
                  onChange={(e) => setReceiveQty(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono font-bold focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="flex-1 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-400/20 cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" /> Confirm Received (+Stock)
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Owner Reject Request Modal */}
      {showRejectModal && selectedRequestForReject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" /> Reject Inventory Request
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-zinc-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-xs space-y-1">
              <div className="font-bold text-white text-sm">{selectedRequestForReject.itemName || selectedRequestForReject.productName}</div>
              <div className="text-zinc-400">Requested: {selectedRequestForReject.requestedQuantity} units by {selectedRequestForReject.requestedBy}</div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Rejection Reason</label>
                <input
                  type="text"
                  required
                  value={rejectionReasonText}
                  onChange={(e) => setRejectionReasonText(e.target.value)}
                  placeholder="e.g. Supplier unavailable, budget allocation exceeded..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <XCircle className="w-4 h-4" /> Reject Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
