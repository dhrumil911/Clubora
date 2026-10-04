import React, { useState } from 'react';
import ShopPage from '../ShopPage';
import BarPOSPage from '../BarPOSPage';
import { ShoppingBag, Coffee, ShieldCheck } from 'lucide-react';

export default function BarShopDashboardPage({ user }) {
  const [activeTab, setActiveTab] = useState('bar');

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-zinc-950 min-h-screen">
      
      {/* Bar/Shop Staff Header */}
      <div className="bg-zinc-900 text-zinc-100 p-4 sm:p-6 rounded-3xl border border-zinc-800 shadow-2xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Bar & Shop Staff Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">Bar POS & Gear Inventory</h1>
          <p className="text-xs text-zinc-400 mt-0.5 font-medium">Logged in as <strong className="text-zinc-200">{user?.name}</strong></p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-zinc-950 p-1.5 rounded-2xl flex flex-col sm:flex-row gap-1.5 border border-zinc-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('bar')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition w-full sm:w-auto ${
              activeTab === 'bar' ? 'bg-lime-400 text-zinc-950 font-black shadow-lg shadow-lime-400/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Coffee className="w-4 h-4" /> Bar & Cafeteria POS
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition w-full sm:w-auto ${
              activeTab === 'shop' ? 'bg-lime-400 text-zinc-950 font-black shadow-lg shadow-lime-400/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Gear Shop POS & Stock
          </button>
        </div>
      </div>

      {/* Active Tab View */}
      <div>
        {activeTab === 'bar' && <BarPOSPage user={user} />}
        {activeTab === 'shop' && <ShopPage user={user} />}
      </div>

    </div>
  );
}
