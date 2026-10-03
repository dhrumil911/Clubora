import React, { useState } from 'react';
import ShopPage from '../ShopPage';
import BarPOSPage from '../BarPOSPage';
import { ShoppingBag, Coffee, ShieldCheck } from 'lucide-react';

export default function BarShopDashboardPage({ user }) {
  const [activeTab, setActiveTab] = useState('bar');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Bar/Shop Staff Header */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Bar & Shop Staff Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">Bar POS & Gear Inventory</h1>
          <p className="text-xs text-slate-400 mt-0.5">Logged in as <strong>{user?.name}</strong></p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-950 p-1.5 rounded-2xl flex gap-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('bar')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'bar' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" /> Bar & Cafeteria POS
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'shop' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Gear Shop POS & Stock
          </button>
        </div>
      </div>

      {/* Active Tab View */}
      <div>
        {activeTab === 'bar' && <BarPOSPage />}
        {activeTab === 'shop' && <ShopPage />}
      </div>

    </div>
  );
}
