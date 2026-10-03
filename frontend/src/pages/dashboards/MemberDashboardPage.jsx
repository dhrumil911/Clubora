import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { User, Calendar, ShieldCheck, Star, Award, CheckCircle, Clock, ShoppingBag } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Member Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white p-8 rounded-3xl border border-slate-800 shadow-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-sky-600/30 border border-sky-400/30 text-sky-300 font-extrabold text-2xl flex items-center justify-center shadow-inner">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                {memberInfo?.memberCode || 'MEM-001'}
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                ACTIVE MEMBER
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white mt-1">Welcome back, {user?.name}!</h1>
            <p className="text-slate-400 text-xs mt-0.5">Champions Club Member Portal</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/bookings"
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-sky-600/20 transition flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" /> Book a Court
          </Link>
          <Link
            to="/shop"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" /> Order Gear Online
          </Link>
        </div>
      </div>

      {/* Grid: Tier Perks & Booking History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Tier Benefits */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Plan</span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{memberInfo?.tier?.name || 'Gold Tier'}</h3>
            </div>
            <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Premium Member
            </span>
          </div>

          <div className="py-4 space-y-3 text-xs text-slate-700">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Court Booking Discount: <strong>{memberInfo?.tier?.courtDiscountPercent || 100}% OFF</strong>
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Gear Shop Discount: <strong>{memberInfo?.tier?.shopDiscountPercent || 20}% OFF</strong>
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Bar & Cafeteria Discount: <strong>{memberInfo?.tier?.barDiscountPercent || 20}% OFF</strong>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
            Membership expires on: <strong>{memberInfo?.expiresAt ? new Date(memberInfo.expiresAt).toLocaleDateString() : 'Active (1 Year)'}</strong>
          </div>
        </div>

        {/* Quick Launcher & Activity Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Member Services & Instant Court Access</span>
              <Calendar className="w-5 h-5 text-sky-600" />
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/bookings" className="p-4 bg-sky-50 rounded-2xl border border-sky-100 hover:border-sky-300 transition group">
                <div className="text-xs font-bold text-sky-700 uppercase">Court Scheduler</div>
                <div className="text-slate-900 font-extrabold text-base mt-1 group-hover:text-sky-600">Reserve Tennis, Cricket or Padel</div>
                <div className="text-xs text-slate-500 mt-1">Select 1-hour sessions starting every 30 minutes</div>
              </Link>

              <Link to="/shop" className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 hover:border-indigo-300 transition group">
                <div className="text-xs font-bold text-indigo-700 uppercase">Sofa Gear Ordering</div>
                <div className="text-slate-900 font-extrabold text-base mt-1 group-hover:text-indigo-600">Buy Equipment & Rackets</div>
                <div className="text-xs text-slate-500 mt-1">Automatic {memberInfo?.tier?.shopDiscountPercent || 20}% member discount</div>
              </Link>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
