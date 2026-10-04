import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import DailyBarExpenseTracker from '../components/DailyBarExpenseTracker';
import { 
  Coffee, Plus, CheckCircle, CreditCard, DollarSign, QrCode, Tag, 
  AlertCircle, X, ShieldAlert, Receipt, Utensils, PackageCheck, AlertOctagon, CheckCircle2, MapPin
} from 'lucide-react';

const CAFETERIA_TABLES = [
  'Table 1', 'Table 2', 'Table 3', 'Table 4', 
  'Table 5', 'Table 6', 'Patio Table A', 'Patio Table B', 
  'Bar Counter'
];

export default function BarPOSPage({ user }) {
  const orderBuilderRef = useRef(null);
  const [activeTabMode, setActiveTabMode] = useState('pos'); // 'pos' | 'expenses'
  const [menuItems, setMenuItems] = useState([]);
  const [openTabs, setOpenTabs] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Tab Order Cart State
  const [selectedTab, setSelectedTab] = useState(null);
  const [orderCart, setOrderCart] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [tableNumber, setTableNumber] = useState('Table 1');
  const [orderType, setOrderType] = useState('DINE_IN'); // 'DINE_IN' | 'TAKEAWAY'
  const [formError, setFormError] = useState('');

  // Payment Settlement Modal
  const [settleModalTab, setSettleModalTab] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  useEffect(() => {
    fetchBarData();
  }, []);

  const fetchBarData = async () => {
    try {
      setLoading(true);
      const [menuRes, tabsRes, membersRes] = await Promise.all([
        api.get('/bar/menu'),
        api.get('/bar/tabs?status=OPEN'),
        api.get('/members')
      ]);
      setMenuItems(menuRes.data);
      setOpenTabs(tabsRes.data);
      const allMembers = membersRes.data || [];
      setMembers(allMembers);
      if (user?.role === 'MEMBER') {
        const myMem = allMembers.find(m => m.email?.toLowerCase() === user.email?.toLowerCase());
        if (myMem) setSelectedMemberId(myMem.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to check if a table is currently occupied by an open tab
  const getOccupyingTab = (tableName) => {
    if (!tableName) return null;
    return openTabs.find(t => 
      t.tableNumber && 
      t.tableNumber.toLowerCase().trim() === tableName.toLowerCase().trim() &&
      (!selectedTab || t.id !== selectedTab.id)
    );
  };

  const addToOrderCart = (item) => {
    const existing = orderCart.find(c => c.barItemId === item.id);
    if (existing) {
      setOrderCart(orderCart.map(c => c.barItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setOrderCart([...orderCart, { barItemId: item.id, name: item.name, price: item.price, quantity: 1 }]);
    }
  };

  const handleSaveTabOrder = async () => {
    setFormError('');
    if (orderCart.length === 0) return;

    const finalTable = orderType === 'TAKEAWAY' ? 'Packed / Takeaway (Parcel)' : tableNumber;

    // Check Table Occupancy before submitting
    if (orderType === 'DINE_IN') {
      const occupiedBy = getOccupyingTab(finalTable);
      if (occupiedBy) {
        setFormError(`${finalTable} is currently IN USE by ${occupiedBy.customerName} (${occupiedBy.tabNumber}). Another customer cannot be seated here until settled.`);
        return;
      }
    }

    try {
      await api.post('/bar/tabs', {
        tabId: selectedTab ? selectedTab.id : null,
        memberId: selectedMemberId || null,
        tableNumber: finalTable,
        items: orderCart
      });
      setOrderCart([]);
      setSelectedTab(null);
      setTableNumber('Table 1');
      setFormError('');
      fetchBarData();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to update tab.');
    }
  };

  const handleSettleTab = async () => {
    if (!settleModalTab) return;

    if (paymentMethod === 'CASH') {
      try {
        await api.post(`/bar/tabs/${settleModalTab.id}/settle`, { paymentMethod: 'CASH' });
        setSettleModalTab(null);
        fetchBarData();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to settle tab.');
      }
      return;
    }

    // Online Razorpay Payment for CARD or UPI
    if (typeof window.Razorpay === 'undefined') {
      alert('Razorpay SDK failed to load. Please refresh and try again.');
      return;
    }

    try {
      const orderRes = await api.post('/payments/razorpay/bar-order', { tabId: settleModalTab.id });
      const { orderId, amount, currency, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'Clubora Cafeteria & Bar',
        description: `Settle Tab #${settleModalTab.tabNumber} (${settleModalTab.tableNumber})`,
        order_id: orderId,
        prefill: {
          name: settleModalTab.customerName || '',
          email: '',
          contact: ''
        },
        theme: { color: '#a3e635' },
        handler: async function (response) {
          try {
            await api.post('/payments/razorpay/verify-bar', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              tabId: settleModalTab.id
            });
            setSettleModalTab(null);
            fetchBarData();
          } catch (vErr) {
            alert(vErr.response?.data?.error || 'Payment signature verification failed.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      alert(err.response?.data?.error || 'Failed to initiate online tab settlement.');
    }
  };

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const memberDiscountPercent = selectedMember && selectedMember.tier ? selectedMember.tier.barDiscountPercent : 0;

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-white">
      
      {/* Header & Sub-Nav Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <Coffee className="w-7 h-7 sm:w-8 sm:h-8 text-lime-400" /> Bar & Cafeteria Staff Portal
          </h1>
          <p className="text-zinc-400 text-sm mt-1 font-medium">
            Manage cafeteria orders, dine-in table status, takeaway packaging, and per-day bar expenses.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="bg-zinc-900 p-1.5 rounded-2xl flex gap-1 border border-zinc-800 shadow-xl">
          <button
            onClick={() => setActiveTabMode('pos')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTabMode === 'pos'
                ? 'bg-lime-400 text-zinc-950 shadow-lg shadow-lime-400/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>Bar POS & Tables</span>
          </button>

          <button
            onClick={() => setActiveTabMode('expenses')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTabMode === 'expenses'
                ? 'bg-lime-400 text-zinc-950 shadow-lg shadow-lime-400/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Per-Day Bar Expenses</span>
          </button>
        </div>
      </div>

      {activeTabMode === 'expenses' ? (
        <DailyBarExpenseTracker userRole={user?.role} />
      ) : (
        <div className="space-y-8">
          
          {/* Cafeteria Table Occupancy & Packaging Status Floor Map */}
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-lime-400" /> Cafeteria Table Occupancy & Status Map
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                  Live table status indicator. Tables in use are blocked for other customers until settled.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Empty / Available</span>
                </span>

                <span className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span>In Use / Occupied</span>
                </span>
              </div>
            </div>

            {/* Table Floor Cards Grid (Increased size for maximum visibility) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {CAFETERIA_TABLES.map(tblName => {
                const occTab = getOccupyingTab(tblName);
                const isOccupied = !!occTab;

                return (
                  <div
                    key={tblName}
                    className={`p-6 rounded-3xl border flex flex-col justify-between transition-all min-h-[160px] ${
                      isOccupied 
                        ? 'bg-rose-950/20 border-rose-800/40 shadow-md' 
                        : 'bg-zinc-900 border-zinc-800 hover:border-lime-400/60 shadow-lg'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-black text-sm text-white flex items-center gap-1.5">
                          <MapPin className={`w-4 h-4 ${isOccupied ? 'text-rose-400' : 'text-lime-400'}`} />
                          {tblName}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                          isOccupied 
                            ? 'bg-rose-500 text-white shadow-xs' 
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isOccupied ? 'In Use' : 'Empty'}
                        </span>
                      </div>

                      {isOccupied ? (
                        <div className="text-xs text-zinc-300 space-y-1 mt-3">
                          <div className="font-bold text-white text-sm truncate">{occTab.customerName}</div>
                          <div className="text-xs text-zinc-400 font-mono font-bold">{occTab.tabNumber}</div>
                          <div className="font-black text-lime-400 text-base mt-2 font-mono">₹{occTab.finalAmount.toFixed(2)}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-400 font-medium italic mt-3">Available for customers</div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-zinc-800">
                      {isOccupied ? (
                        <button
                          onClick={() => setSettleModalTab(occTab)}
                          className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-2xl transition shadow-md"
                        >
                          Settle & Free Table
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setOrderType('DINE_IN');
                            setTableNumber(tblName);
                            setSelectedTab(null);
                            setFormError('');
                            requestAnimationFrame(() => {
                              orderBuilderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            });
                          }}
                          className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-extrabold text-xs rounded-2xl transition border border-zinc-700/50"
                        >
                          + Assign Order
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Menu Grid (Catalog on Left) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 pb-3 border-b border-zinc-800 flex items-center justify-between">
              <span>Bar & Kitchen Menu</span>
              <span className="text-xs text-zinc-400 font-medium">Click items to add to current order</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {menuItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => addToOrderCart(item)}
                  className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 hover:border-lime-400/60 hover:bg-zinc-800/40 cursor-pointer transition flex flex-col justify-between group"
                >
                  <div>
                    <span className="text-[10px] font-black text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-full uppercase border border-lime-400/20">
                      {item.category}
                    </span>
                    <h4 className="font-bold text-white text-sm mt-2">{item.name}</h4>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/80">
                    <span className="font-black text-white text-base font-mono">₹{item.price.toFixed(2)}</span>
                    <span className="w-7 h-7 rounded-xl bg-lime-400 text-zinc-950 flex items-center justify-center font-black text-xs shadow-md shadow-lime-400/20 group-hover:scale-105 transition-transform">
                      +
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Open Tabs List */}
          <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 pb-3 border-b border-zinc-800 flex items-center justify-between">
              <span>Active Open Tabs ({openTabs.length})</span>
              <span className="text-xs text-zinc-400 font-medium">Tabs can run until settled before leaving</span>
            </h3>

            {openTabs.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 italic">No open tabs right now.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {openTabs.map(tab => (
                  <div key={tab.id} className="bg-zinc-950 border border-zinc-800 text-white p-5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-lime-400 uppercase tracking-wider">{tab.tabNumber}</span>
                        <h4 className="font-black text-base text-white mt-0.5">{tab.customerName}</h4>
                        <div className="text-xs text-zinc-400">{tab.tableNumber || 'Patio Table'}</div>
                      </div>
                      <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                        {tab.discountPercent}% OFF Tier
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 text-zinc-300 pt-3 border-t border-zinc-800">
                      {tab.items?.map(i => (
                        <div key={i.id} className="flex justify-between">
                          <span className="text-zinc-300">{i.quantity}x {i.barItem?.name}</span>
                          <span className="font-mono text-zinc-400">₹{i.totalPrice.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-zinc-800 font-bold">
                      <span className="text-xs text-zinc-400">Total:</span>
                      <span className="text-xl font-black text-lime-400 font-mono">₹{tab.finalAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setSelectedTab(tab);
                          setSelectedMemberId(tab.memberId || '');
                          setTableNumber(tab.tableNumber || '');
                        }}
                        className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold rounded-xl text-zinc-200 border border-zinc-700/50"
                      >
                        Add Items
                      </button>
                      <button
                        onClick={() => setSettleModalTab(tab)}
                        className="flex-1 py-2 bg-lime-400 hover:bg-lime-300 text-xs font-black rounded-xl text-zinc-950 shadow-md shadow-lime-400/20"
                      >
                        Settle Tab
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Current Order Builder */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div ref={orderBuilderRef} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl sticky top-24 space-y-4 scroll-mt-24">
            <h3 className="text-lg font-bold text-white pb-3 border-b border-zinc-800 flex items-center justify-between">
              <span>{selectedTab ? `Adding to ${selectedTab.tabNumber}` : `New Bar Order / ${orderType === 'TAKEAWAY' ? 'Takeaway' : tableNumber}`}</span>
              {selectedTab && (
                <button onClick={() => setSelectedTab(null)} className="text-xs text-rose-400 font-bold hover:underline">
                  Cancel Edit
                </button>
              )}
            </h3>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
                <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{formError}</span>
              </div>
            )}

            {/* Order Type Toggle: Dine-in vs Takeaway */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Dining & Packaging Type</label>
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-zinc-950 rounded-2xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setOrderType('DINE_IN');
                    setFormError('');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                    orderType === 'DINE_IN'
                      ? 'bg-lime-400 text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Dine-In (Table)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrderType('TAKEAWAY');
                    setFormError('');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                    orderType === 'TAKEAWAY'
                      ? 'bg-amber-400 text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Packed / Takeaway</span>
                </button>
              </div>
            </div>

            {/* Select Member for Discount */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  {user?.role === 'MEMBER' ? 'Member Account (Automatic Discount)' : 'Select Member (Automatic Discount)'}
                </label>
                {user?.role === 'MEMBER' ? (
                  <div className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs flex items-center justify-between shadow-inner">
                    <div className="font-bold text-white flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></div>
                      <span>{selectedMember?.name || user?.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-lime-400 bg-lime-400/10 px-2.5 py-1 rounded-lg border border-lime-400/30">
                      {selectedMember?.tier?.name || 'Member'} Tier ({memberDiscountPercent}% Off)
                    </span>
                  </div>
                ) : (
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium text-white focus:ring-1 focus:ring-lime-400 focus:border-lime-400"
                  >
                    <option value="">Guest Customer (0% Discount)</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.tier?.name} - {m.tier?.barDiscountPercent}% Off)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Table Selection (Shown for Dine-In) */}
              {orderType === 'DINE_IN' ? (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Select Cafeteria Table</label>
                  <select
                    value={tableNumber}
                    onChange={(e) => {
                      setTableNumber(e.target.value);
                      setFormError('');
                    }}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold text-white focus:ring-1 focus:ring-lime-400 focus:border-lime-400"
                  >
                    {CAFETERIA_TABLES.map(tbl => {
                      const occ = getOccupyingTab(tbl);
                      return (
                        <option key={tbl} value={tbl} disabled={!!occ}>
                          {tbl} {occ ? `🔴 (IN USE by ${occ.customerName})` : '🟢 (Empty / Available)'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : (
                <div className="bg-amber-400/10 border border-amber-400/20 p-3 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Order marked as <strong>Packed / Parcel Takeaway</strong>. No dining table assigned.</span>
                </div>
              )}
            </div>

            {memberDiscountPercent > 0 && (
              <div className="bg-lime-400/10 text-lime-300 text-xs p-3 rounded-xl border border-lime-400/20 mb-4 flex items-center gap-2 font-bold">
                <Tag className="w-4 h-4 text-lime-400" />
                <span>{selectedMember?.tier?.name} Member Discount: <strong>{memberDiscountPercent}% OFF</strong></span>
              </div>
            )}

            {/* Cart Items */}
            {orderCart.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 italic">
                Click menu items on left to build order.
              </div>
            ) : (
              <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
                {orderCart.map(i => (
                  <div key={i.barItemId} className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl text-xs border border-zinc-800/80">
                    <div>
                      <div className="font-bold text-white">{i.name}</div>
                      <div className="text-zinc-500 font-mono">{i.quantity}x @ ₹{i.price.toFixed(2)}</div>
                    </div>
                    <span className="font-black text-lime-400 text-sm font-mono">₹{(i.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleSaveTabOrder}
              disabled={orderCart.length === 0}
              className={`w-full py-3.5 rounded-xl font-black text-sm shadow-xl transition ${
                orderCart.length === 0
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700/50'
                  : 'bg-lime-400 hover:bg-lime-300 text-zinc-950 shadow-lime-400/20'
              }`}
            >
              Send to Open Tab
            </button>
          </div>
        </div>

      </div>

      {/* Settle Tab Modal (Cash / Card / UPI) */}
      {settleModalTab && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-zinc-800 text-white">
            <h3 className="text-2xl font-black text-white mb-1">Settle Tab #{settleModalTab.tabNumber}</h3>
            <p className="text-xs text-zinc-400 mb-6">Customer: <strong className="text-white">{settleModalTab.customerName}</strong></p>

            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 mb-6 space-y-2.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal:</span>
                <span className="font-mono">₹{settleModalTab.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lime-400 font-bold">
                <span>Tier Discount ({settleModalTab.discountPercent}%):</span>
                <span className="font-mono">-₹{settleModalTab.discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-3 border-t border-zinc-800">
                <span>Final Due Amount:</span>
                <span className="text-lime-400 text-xl font-black font-mono">₹{settleModalTab.finalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Select Payment Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                  { id: 'CARD', label: 'Card Swipe', icon: CreditCard },
                  { id: 'CASH', label: 'Cash', icon: DollarSign }
                ].map(mode => {
                  const Icon = mode.icon;
                  const isSelected = paymentMethod === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMethod(mode.id)}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 text-xs font-bold transition ${
                        isSelected
                          ? 'border-lime-400 bg-lime-400/10 text-lime-400 ring-2 ring-lime-400/20'
                          : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setSettleModalTab(null)}
                className="px-5 py-2.5 text-zinc-400 hover:bg-zinc-800 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSettleTab}
                className="px-6 py-2.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-xl text-xs font-black shadow-lg shadow-lime-400/20"
              >
                Confirm Payment & Close Tab
              </button>
            </div>
          </div>
        </div>
      )}

        </div>
      )}

    </div>
  );
}
