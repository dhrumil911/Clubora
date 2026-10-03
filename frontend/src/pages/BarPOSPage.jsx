import React, { useState, useEffect } from 'react';
import api from '../api';
import { Coffee, Plus, CheckCircle, CreditCard, DollarSign, QrCode, Tag, AlertCircle, X, ShieldAlert } from 'lucide-react';

export default function BarPOSPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [openTabs, setOpenTabs] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Tab Order Cart State
  const [selectedTab, setSelectedTab] = useState(null);
  const [orderCart, setOrderCart] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [tableNumber, setTableNumber] = useState('');

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
      setMembers(membersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    if (orderCart.length === 0) return;
    try {
      await api.post('/bar/tabs', {
        tabId: selectedTab ? selectedTab.id : null,
        memberId: selectedMemberId || null,
        tableNumber: tableNumber || 'Counter Bar',
        items: orderCart
      });
      setOrderCart([]);
      setSelectedTab(null);
      setTableNumber('');
      fetchBarData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update tab.');
    }
  };

  const handleSettleTab = async () => {
    if (!settleModalTab) return;
    try {
      await api.post(`/bar/tabs/${settleModalTab.id}/settle`, { paymentMethod });
      setSettleModalTab(null);
      fetchBarData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to settle tab.');
    }
  };

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const memberDiscountPercent = selectedMember && selectedMember.tier ? selectedMember.tier.barDiscountPercent : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Coffee className="w-7 h-7 text-sky-600" /> Bar & Cafeteria POS
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Fast post-match ordering, running tab manager, automatic tier discounts, and UPI/Cash/Card settlements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Menu Grid (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Bar & Kitchen Menu</span>
              <span className="text-xs text-slate-400 font-normal">Click items to add to current order</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {menuItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => addToOrderCart(item)}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 cursor-pointer transition flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full uppercase">
                      {item.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-2">{item.name}</h4>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60">
                    <span className="font-extrabold text-slate-900 text-sm">${item.price.toFixed(2)}</span>
                    <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                      +
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Open Tabs List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Active Open Tabs ({openTabs.length})</span>
              <span className="text-xs text-slate-400 font-normal">Tabs can run until settled before leaving</span>
            </h3>

            {openTabs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 italic">No open tabs right now.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {openTabs.map(tab => (
                  <div key={tab.id} className="bg-slate-900 text-white p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">{tab.tabNumber}</span>
                        <h4 className="font-bold text-base text-white mt-0.5">{tab.customerName}</h4>
                        <div className="text-xs text-slate-400">{tab.tableNumber || 'Patio Table'}</div>
                      </div>
                      <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800">
                        {tab.discountPercent}% OFF Tier
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-300 pt-2 border-t border-slate-800">
                      {tab.items?.map(i => (
                        <div key={i.id} className="flex justify-between">
                          <span>{i.quantity}x {i.barItem?.name}</span>
                          <span className="font-mono text-slate-400">${i.totalPrice.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-800 font-bold">
                      <span className="text-xs text-slate-400">Total:</span>
                      <span className="text-lg text-emerald-400">${tab.finalAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setSelectedTab(tab);
                          setSelectedMemberId(tab.memberId || '');
                          setTableNumber(tab.tableNumber || '');
                        }}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200"
                      >
                        Add Items
                      </button>
                      <button
                        onClick={() => setSettleModalTab(tab)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold rounded-xl text-white shadow-sm"
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
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>{selectedTab ? `Adding to ${selectedTab.tabNumber}` : 'New Bar Order / Tab'}</span>
              {selectedTab && (
                <button onClick={() => setSelectedTab(null)} className="text-xs text-rose-600 font-semibold">
                  Cancel Edit
                </button>
              )}
            </h3>

            {/* Select Member for Discount */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Member (Automatic Discount)</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Guest (0% Discount)</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.tier?.name} - {m.tier?.barDiscountPercent}% Off)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Table Number / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Table 4 Patio, Bar Counter"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {memberDiscountPercent > 0 && (
              <div className="bg-emerald-50 text-emerald-800 text-xs p-2.5 rounded-xl border border-emerald-200 mb-4 flex items-center gap-1.5 font-semibold">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>{selectedMember?.tier?.name} Member Discount: <strong>{memberDiscountPercent}% OFF</strong></span>
              </div>
            )}

            {/* Cart Items */}
            {orderCart.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                Click menu items on left to build order.
              </div>
            ) : (
              <div className="space-y-2 mb-4 max-h-56 overflow-y-auto">
                {orderCart.map(i => (
                  <div key={i.barItemId} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{i.name}</div>
                      <div className="text-slate-400">{i.quantity}x @ ${i.price.toFixed(2)}</div>
                    </div>
                    <span className="font-extrabold text-slate-900">${(i.price * i.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleSaveTabOrder}
              disabled={orderCart.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition ${
                orderCart.length === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20'
              }`}
            >
              Send to Open Tab
            </button>
          </div>
        </div>

      </div>

      {/* Settle Tab Modal (Cash / Card / UPI) */}
      {settleModalTab && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-xl font-extrabold text-slate-900 mb-1">Settle Tab #{settleModalTab.tabNumber}</h3>
            <p className="text-xs text-slate-500 mb-4">Customer: <strong>{settleModalTab.customerName}</strong></p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span>${settleModalTab.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Tier Discount ({settleModalTab.discountPercent}%):</span>
                <span>-${settleModalTab.discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Final Due Amount:</span>
                <span className="text-emerald-600">${settleModalTab.finalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <label className="block text-xs font-semibold text-slate-700">Select Payment Mode</label>
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
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-xs font-bold transition ${
                        isSelected
                          ? 'border-sky-600 bg-sky-50 text-sky-700 ring-2 ring-sky-100'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSettleModalTab(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSettleTab}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20"
              >
                Confirm Payment & Close Tab
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
