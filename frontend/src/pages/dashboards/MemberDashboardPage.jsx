import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import MemberBarCafeOrdering from '../../components/MemberBarCafeOrdering';
import { User, Calendar, ShieldCheck, Star, Award, CheckCircle, Clock, ShoppingBag, Coffee, Utensils } from 'lucide-react';

export default function MemberDashboardPage({ user }) {
  const [memberInfo, setMemberInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemberProfile();
  }, []);

  const fetchMemberProfile = async () => {
    try {
      setLoading(true);
      // Fetch current member details
      const res = await api.get('/members');
      const currentUserMember = res.data.find(m => m.email.toLowerCase() === user?.email?.toLowerCase()) || res.data[0];
      setMemberInfo(currentUserMember);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 bg-zinc-950 min-h-screen text-zinc-100">
      
      {/* Member Header Banner */}
      <div className="bg-zinc-900 text-zinc-100 p-4 sm:p-6 lg:p-8 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-lime-400 text-zinc-950 font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg shadow-lime-400/20 flex-shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-lime-400 bg-zinc-950 px-2.5 py-0.5 rounded border border-lime-400/30">
                {memberInfo?.memberCode || 'MEM-001'}
              </span>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                ACTIVE MEMBER
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white mt-1">Welcome back, {user?.name}!</h1>
            <p className="text-zinc-400 text-xs mt-0.5 font-medium">Champions Club OS Member Portal</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Link
            to="/bookings"
            className="px-5 py-2.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black rounded-xl text-xs shadow-lg shadow-lime-400/20 transition flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Calendar className="w-4 h-4" /> Book a Court
          </Link>
          <a
            href="#bar-cafe-section"
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold rounded-xl text-xs border border-zinc-700 transition flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Coffee className="w-4 h-4 fill-amber-400" /> Order Bar & Cafe
          </a>
          <Link
            to="/shop"
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-xl text-xs border border-zinc-700 transition flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <ShoppingBag className="w-4 h-4 text-purple-400" /> Order Gear Online
          </Link>
        </div>
      </div>

      {/* Grid: Tier Perks & Quick Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Tier Benefits */}
        <div className="lg:col-span-1 bg-zinc-900/90 p-6 rounded-3xl border border-zinc-800 shadow-xl">
          <div className="flex justify-between items-start pb-4 border-b border-zinc-800">
            <div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Your Plan</span>
              <h3 className="text-xl font-black text-white mt-0.5">{memberInfo?.tier?.name || 'Gold Tier'}</h3>
            </div>
            <span className="bg-lime-400/10 text-lime-400 border border-lime-400/30 font-black px-3 py-1 rounded-full text-xs flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-lime-400 text-lime-400" /> Premium Member
            </span>
          </div>

          <div className="py-4 space-y-3 text-xs text-zinc-300">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle className="w-4 h-4 text-lime-400" /> Court Booking Discount: <strong>{memberInfo?.tier?.courtDiscountPercent || 100}% OFF</strong>
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle className="w-4 h-4 text-lime-400" /> Gear Shop Discount: <strong>{memberInfo?.tier?.shopDiscountPercent || 20}% OFF</strong>
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle className="w-4 h-4 text-lime-400" /> Bar & Cafeteria Discount: <strong>{memberInfo?.tier?.barDiscountPercent || 20}% OFF</strong>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 text-xs text-zinc-400">
            Membership expires on: <strong className="text-white">{memberInfo?.expiresAt ? new Date(memberInfo.expiresAt).toLocaleDateString() : 'Active (1 Year)'}</strong>
          </div>
        </div>

        {/* Quick Launcher & Activity Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/90 p-6 rounded-3xl border border-zinc-800 shadow-xl">
            <h3 className="text-lg font-black text-white mb-4 pb-3 border-b border-zinc-800 flex items-center justify-between">
              <span>Member Services & Instant Court Access</span>
              <Calendar className="w-5 h-5 text-lime-400" />
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link to="/bookings" className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-lime-400/60 transition duration-300 group">
                <div className="text-[10px] font-black text-lime-400 uppercase tracking-wider">Court Scheduler</div>
                <div className="text-white font-black text-sm mt-1 group-hover:text-lime-400 transition-colors">Reserve Courts</div>
                <div className="text-[11px] text-zinc-400 mt-1">1-hour sessions starting every 30m</div>
              </Link>

              <a href="#bar-cafe-section" className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-amber-400/60 transition duration-300 group">
                <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Cafeteria Bar</div>
                <div className="text-white font-black text-sm mt-1 group-hover:text-amber-400 transition-colors">Order Food & Drinks</div>
                <div className="text-[11px] text-zinc-400 mt-1">Auto {memberInfo?.tier?.barDiscountPercent || 20}% member discount</div>
              </a>

              <Link to="/shop" className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-purple-400/60 transition duration-300 group">
                <div className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Gear Pro Shop</div>
                <div className="text-white font-black text-sm mt-1 group-hover:text-purple-400 transition-colors">Buy Equipment</div>
                <div className="text-[11px] text-zinc-400 mt-1">Auto {memberInfo?.tier?.shopDiscountPercent || 20}% member discount</div>
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Dynamic Member Bar & Cafe Ordering Section */}
      <div id="bar-cafe-section">
        <MemberBarCafeOrdering user={user} memberInfo={memberInfo} />
      </div>

    </div>
  );
}
