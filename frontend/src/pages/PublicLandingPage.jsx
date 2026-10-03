import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { 
  Trophy, ShieldCheck, Calendar, ShoppingBag, Coffee, Users, Target, LayoutDashboard, 
  CheckCircle2, Star, ArrowRight, Shield, Award, Zap, Phone, Mail, MapPin, Clock, Info
} from 'lucide-react';

export default function PublicLandingPage({ user }) {
  const [tiers, setTiers] = useState([]);

  useEffect(() => {
    fetchPublicTiers();
  }, []);

  const fetchPublicTiers = async () => {
    try {
      const tiersRes = await api.get('/public/tiers');
      setTiers(tiersRes.data.filter(t => t.name !== 'Walk-in'));
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
            to="/bookings"
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

<<<<<<< ours
      {/* About Section */}
      <section id="about" className="py-16 bg-slate-900 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-sky-950 text-sky-400 border border-sky-800 px-3 py-1 rounded-full text-xs font-bold">
                <Info className="w-3.5 h-3.5" /> About Champions Club
              </div>
              <h2 className="text-3xl font-extrabold text-white">
                Built to solve the operational headaches of modern sports clubs.
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                The Champions Club is a thriving multi-sport facility featuring tennis, padel, badminton courts, and cricket nets. Outgrowing WhatsApp messages, paper receipts, and fragmented spreadsheets, Clubora provides a unified platform to manage every scene of club life.
              </p>
              
              <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-sky-400 font-extrabold text-xl">3 Tiers</div>
                  <div className="text-slate-400 mt-0.5">Gold, Silver & Junior Plans</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-indigo-400 font-extrabold text-xl">30 Min</div>
                  <div className="text-slate-400 mt-0.5">Staggered Slot Opening</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-400" /> Operational Backbone Features
              </h3>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Member Recognition:</strong> Automatic tier discounts applied at counter POS & bar tabs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Anti-Double Booking:</strong> Strict conflict resolution algorithm for 1-hour sessions.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Unified Gear Inventory:</strong> Counter sales & sofa orders share single shelf stock.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Shift & Tab Settlement:</strong> Fast bar POS supporting Cash, Card, and UPI.</span>
                </li>
              </ul>
            </div>

=======
      {/* Role Access Portals Section */}
      <section className="py-12 bg-slate-900/50 border-y border-slate-800 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Staff & Portal Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Link to="/auth/member/login" className="p-4 bg-slate-900 border border-slate-800 hover:border-indigo-500/80 rounded-2xl flex flex-col items-center gap-2 group transition">
              <Users className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-200">Member Portal</span>
            </Link>

            <Link to="/auth/front-desk/login" className="p-4 bg-slate-900 border border-slate-800 hover:border-sky-500/80 rounded-2xl flex flex-col items-center gap-2 group transition">
              <Shield className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-200">Front Desk</span>
            </Link>

            <Link to="/auth/bar/login" className="p-4 bg-slate-900 border border-slate-800 hover:border-amber-500/80 rounded-2xl flex flex-col items-center gap-2 group transition">
              <Coffee className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-200">Bar Staff</span>
            </Link>

            <Link to="/auth/shop/login" className="p-4 bg-slate-900 border border-slate-800 hover:border-purple-500/80 rounded-2xl flex flex-col items-center gap-2 group transition">
              <ShoppingBag className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-200">Shop Staff</span>
            </Link>

            <Link to="/auth/owner/login" className="p-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/80 rounded-2xl flex flex-col items-center gap-2 group transition">
              <Award className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-200">Club Owner</span>
            </Link>
>>>>>>> theirs
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
            <Link to="/bookings" className="hover:text-white">Courts</Link>
            <Link to="/shop" className="hover:text-white">Shop</Link>
            <a href="#about" className="hover:text-white">About</a>
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
