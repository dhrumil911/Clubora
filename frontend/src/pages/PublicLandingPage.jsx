import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { 
  Trophy, ShieldCheck, Calendar, ShoppingBag, Coffee, Users, Target, LayoutDashboard, 
  CheckCircle2, Star, ArrowRight, Shield, Award, Zap, Phone, Mail, MapPin
} from 'lucide-react';

export default function PublicLandingPage() {
  const [tiers, setTiers] = useState([]);
  const [courts, setCourts] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchPublicData();
  }, []);

  const fetchPublicData = async () => {
    try {
      const [tiersRes, courtsRes, shopRes] = await Promise.all([
        api.get('/public/tiers'),
        api.get('/public/courts'),
        api.get('/public/shop')
      ]);
      setTiers(tiersRes.data.filter(t => t.name !== 'Walk-in'));
      setCourts(courtsRes.data);
      setProducts(shopRes.data.slice(0, 4));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-950 text-white min-h-screen font-sans">
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-sky-950/80 text-sky-300 border border-sky-800 px-4 py-1.5 rounded-full text-xs font-bold mb-6 backdrop-blur-sm">
          <Trophy className="w-4 h-4 text-sky-400" />
          <span>The Champions Club Management Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent max-w-4xl mx-auto leading-tight">
          The Digital Backbone of Your Sports Club
        </h1>

        <p className="mt-6 text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Clubora solves the operational headaches of modern sports clubs. Unifying member tiers, staggered court bookings, gear shop inventory, post-match bar POS, staff shifts, and executive owner analytics in one platform.
        </p>

        {/* Hero CTA Buttons */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
          <Link
            to="/auth/member/signup"
            className="px-7 py-3.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-sky-600/30 transition transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <span>Become a Member</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/auth/member/login"
            className="px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-extrabold rounded-2xl text-sm border border-slate-700 transition"
          >
            Book a Court
          </Link>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-16 px-4 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Unified Modules for Club Operations
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Built for seamless day-to-day coordination between front desk staff, bar staff, and members.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 hover:border-sky-500/50 transition">
            <div className="w-12 h-12 rounded-2xl bg-sky-600/20 text-sky-400 flex items-center justify-center mb-4 font-bold">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Membership Management</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Gold, Silver, and Junior tier entitlements, automatic expiration tracking, auto-renewals, and member activity history.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 hover:border-sky-500/50 transition">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4 font-bold">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Court Booking Engine</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Tennis, Cricket, and Padel courts with 1-hour sessions starting every 30 mins. Anti-double booking and 2 bookings/day cap.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 hover:border-sky-500/50 transition">
            <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-4 font-bold">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Gear Shop & Unified Stock</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Counter POS & member sofa orders pulling from the same shelf inventory. Real-time low stock alerts.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 hover:border-sky-500/50 transition">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center mb-4 font-bold">
              <Coffee className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Bar & Cafeteria POS</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Fast post-match ordering, running table tabs, auto-discount for Gold/Silver members, and UPI/Cash/Card payments.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 hover:border-sky-500/50 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4 font-bold">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">CRM & Enquiry Pipeline</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Visitor lead capture from website, quote proposals, follow-up status, and 1-click member conversion.
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 hover:border-sky-500/50 transition">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-4 font-bold">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Owner Executive Dashboard</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              End-of-month consolidated revenue across courts, shop, bar, and corporate invoices. Shift scheduling & reports.
            </p>
          </div>

        </div>
      </section>

      {/* Membership Plans Section */}
      <section id="membership" className="py-16 bg-slate-950 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Membership Plans & Tiers</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">Select the membership plan that best suits your play frequency.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map(t => (
              <div key={t.id} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col justify-between hover:border-sky-500 transition shadow-lg">
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">{t.name} Tier</h3>
                    {t.name === 'Gold' && <span className="bg-amber-400 text-slate-950 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">MOST POPULAR</span>}
                  </div>
                  <div className="text-3xl font-extrabold text-sky-400 mt-4">${t.monthlyFee}<span className="text-xs font-normal text-slate-400">/mo</span></div>
                  <p className="text-xs text-slate-400 mt-2">{t.description}</p>

                  <div className="mt-6 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-400" /> Court Rates: <strong>{t.courtDiscountPercent}% OFF</strong></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-400" /> Shop Discount: <strong>{t.shopDiscountPercent}% OFF</strong></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-400" /> Bar & Cafeteria: <strong>{t.barDiscountPercent}% OFF</strong></div>
                  </div>
                </div>

                <Link
                  to="/auth/member/signup"
                  className="mt-8 block text-center py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-600/20 transition"
                >
                  Join as {t.name} Member
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courts Availability Section */}
      <section id="courts" className="py-16 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Courts & Facility Availability</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Live court rates for Tennis, Cricket Nets, Padel, and Badminton.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {courts.map(c => (
            <div key={c.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-white text-base">{c.name}</h4>
                <div className="text-xs text-sky-400 font-semibold">{c.sport}</div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-white text-lg">${c.hourlyRate}/hr</div>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Available
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 border-t border-slate-800 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center text-sm">
              C
            </div>
            <span className="font-extrabold text-white text-sm">CLUBORA</span>
            <span className="text-slate-600">| Champions Club Management</span>
          </div>

          <div className="flex flex-wrap gap-6 text-slate-400">
            <a href="#membership" className="hover:text-white">Membership</a>
            <a href="#courts" className="hover:text-white">Courts</a>
            <a href="#shop" className="hover:text-white">Gear Shop</a>
            <Link to="/auth/member/login" className="hover:text-white">Member Login</Link>
            <Link to="/auth/owner/login" className="hover:text-white">Owner Portal</Link>
          </div>

          <div>
            © 2026 Clubora Sports Management. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
