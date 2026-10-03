import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { 
  Trophy, ShieldCheck, Calendar, ShoppingBag, Coffee, Users, Target, LayoutDashboard, 
  CheckCircle2, Star, ArrowRight, Shield, Award, Zap, Phone, Mail, MapPin, Clock, Info, Crown
} from 'lucide-react';

export default function PublicLandingPage({ user }) {
  const [tiers, setTiers] = useState([]);
  const [selectedPlanName, setSelectedPlanName] = useState('Gold');

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
    <div className="bg-zinc-950 text-zinc-100 min-h-screen font-sans">
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-zinc-900/90 text-lime-400 border border-lime-400/30 px-4 py-1.5 rounded-full text-xs font-bold mb-6 backdrop-blur-sm shadow-lg shadow-lime-400/5">
          <Trophy className="w-4 h-4 text-lime-400" />
          <span>The Champions Club OS & Management Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
          The Digital Backbone of Your <span className="text-lime-400 underline decoration-lime-400/40 underline-offset-8">Sports Club</span>
        </h1>

        <p className="mt-6 text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
          Clubora solves the operational headaches of modern sports clubs. Unifying member tiers, staggered court bookings, gear shop inventory, post-match bar POS, staff shifts, and executive owner analytics in one platform.
        </p>

        {/* Hero CTA Buttons */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
          <Link
            to="/auth/member/signup"
            className="px-8 py-4 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black rounded-2xl text-sm shadow-xl shadow-lime-400/20 transition transform hover:-translate-y-0.5 flex items-center gap-2.5"
          >
            <span>Become a Member</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/bookings"
            className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold rounded-2xl text-sm border border-zinc-800 transition"
          >
            Book a Court Session
          </Link>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-16 px-4 max-w-7xl mx-auto border-t border-zinc-800/80">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Unified Modules for Club Operations
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
            Built for seamless day-to-day coordination between front desk staff, bar staff, and members.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-zinc-900/90 p-6 rounded-3xl border border-zinc-800/80 hover:border-lime-400/50 transition duration-300 shadow-xl group">
            <div className="w-12 h-12 rounded-2xl bg-lime-400/10 text-lime-400 flex items-center justify-center mb-4 font-bold group-hover:scale-110 transition-transform border border-lime-400/20">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Membership Management</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Gold, Silver, and Junior tier entitlements, automatic expiration tracking, auto-renewals, and member activity history.
            </p>
          </div>

          <div className="bg-zinc-900/90 p-6 rounded-3xl border border-zinc-800/80 hover:border-lime-400/50 transition duration-300 shadow-xl group">
            <div className="w-12 h-12 rounded-2xl bg-sky-400/10 text-sky-400 flex items-center justify-center mb-4 font-bold group-hover:scale-110 transition-transform border border-sky-400/20">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Court Booking Engine</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Tennis, Cricket, and Padel courts with 1-hour sessions starting every 30 mins. Anti-double booking and 2 bookings/day cap.
            </p>
          </div>

          <div className="bg-zinc-900/90 p-6 rounded-3xl border border-zinc-800/80 hover:border-lime-400/50 transition duration-300 shadow-xl group">
            <div className="w-12 h-12 rounded-2xl bg-purple-400/10 text-purple-400 flex items-center justify-center mb-4 font-bold group-hover:scale-110 transition-transform border border-purple-400/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Gear Shop & Unified Stock</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Counter POS & member sofa orders pulling from the same shelf inventory. Real-time low stock alerts.
            </p>
          </div>

          <div className="bg-zinc-900/90 p-6 rounded-3xl border border-zinc-800/80 hover:border-lime-400/50 transition duration-300 shadow-xl group">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mb-4 font-bold group-hover:scale-110 transition-transform border border-amber-400/20">
              <Coffee className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Bar & Cafeteria POS</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Fast post-match ordering, running table tabs, auto-discount for Gold/Silver members, and UPI/Cash/Card payments.
            </p>
          </div>

          <div className="bg-zinc-900/90 p-6 rounded-3xl border border-zinc-800/80 hover:border-lime-400/50 transition duration-300 shadow-xl group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 text-emerald-400 flex items-center justify-center mb-4 font-bold group-hover:scale-110 transition-transform border border-emerald-400/20">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">CRM & Enquiry Pipeline</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Visitor lead capture from website, quote proposals, follow-up status, and 1-click member conversion.
            </p>
          </div>

          <div className="bg-zinc-900/90 p-6 rounded-3xl border border-zinc-800/80 hover:border-lime-400/50 transition duration-300 shadow-xl group">
            <div className="w-12 h-12 rounded-2xl bg-lime-400/10 text-lime-400 flex items-center justify-center mb-4 font-bold group-hover:scale-110 transition-transform border border-lime-400/20">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Owner Executive Dashboard</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              End-of-month consolidated revenue across courts, shop, bar, and corporate invoices. Shift scheduling & reports.
            </p>
          </div>

        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-zinc-900/60 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-zinc-950 text-lime-400 border border-lime-400/30 px-3 py-1 rounded-full text-xs font-bold">
                <Info className="w-3.5 h-3.5" /> About Champions Club
              </div>
              <h2 className="text-3xl font-black text-white leading-snug">
                Built to solve the operational headaches of modern sports clubs.
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                The Champions Club is a thriving multi-sport facility featuring tennis, padel, badminton courts, and cricket nets. Outgrowing WhatsApp messages, paper receipts, and fragmented spreadsheets, Clubora provides a unified platform to manage every scene of club life.
              </p>
              
              <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                  <div className="text-lime-400 font-black text-2xl">3 Tiers</div>
                  <div className="text-zinc-400 mt-0.5">Gold, Silver & Junior Plans</div>
                </div>
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                  <div className="text-sky-400 font-black text-2xl">30 Min</div>
                  <div className="text-zinc-400 mt-0.5">Staggered Slot Opening</div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 space-y-4 shadow-2xl">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-lime-400" /> Operational Backbone Features
              </h3>
              <ul className="space-y-3.5 text-xs text-zinc-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lime-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Member Recognition:</strong> Automatic tier discounts applied at counter POS & bar tabs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lime-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Anti-Double Booking:</strong> Strict conflict resolution algorithm for 1-hour sessions.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lime-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Unified Gear Inventory:</strong> Counter sales & sofa orders share single shelf stock.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-lime-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Shift & Tab Settlement:</strong> Fast bar POS supporting Cash, Card, and UPI.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Role Access Portals Section */}
      <section className="py-12 bg-zinc-950 border-y border-zinc-800 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <h2 className="text-xl sm:text-2xl font-black text-white">Staff & Portal Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Link to="/auth/member/login" className="p-4 bg-zinc-900 border border-zinc-800 hover:border-lime-400/80 rounded-2xl flex flex-col items-center gap-2 group transition">
              <Users className="w-6 h-6 text-lime-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-zinc-200">Member Portal</span>
            </Link>

            <Link to="/auth/front-desk/login" className="p-4 bg-zinc-900 border border-zinc-800 hover:border-sky-400/80 rounded-2xl flex flex-col items-center gap-2 group transition">
              <Shield className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-zinc-200">Front Desk</span>
            </Link>

            <Link to="/auth/bar-shop/login" className="p-4 bg-zinc-900 border border-zinc-800 hover:border-amber-400/80 rounded-2xl flex flex-col items-center gap-2 group transition">
              <Coffee className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-zinc-200">Bar Staff</span>
            </Link>

            <Link to="/auth/bar-shop/login" className="p-4 bg-zinc-900 border border-zinc-800 hover:border-purple-400/80 rounded-2xl flex flex-col items-center gap-2 group transition">
              <ShoppingBag className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-zinc-200">Shop Staff</span>
            </Link>

            <Link to="/auth/owner/login" className="p-4 bg-zinc-900 border border-zinc-800 hover:border-emerald-400/80 rounded-2xl flex flex-col items-center gap-2 group transition">
              <Award className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-zinc-200">Club Owner</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Membership Plans Section */}
      <section id="membership" className="py-16 bg-zinc-900/60 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-black text-white">Membership Plans & Tiers</h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-2">Select the membership plan that best suits your play frequency.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {tiers.map(t => {
              const isSelected = selectedPlanName === t.name;

              if (t.name === 'Gold') {
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedPlanName(t.name)}
                    className={`bg-gradient-to-b from-amber-950/40 via-zinc-900 to-zinc-900 p-8 rounded-3xl border-2 flex flex-col justify-between transition-all duration-300 shadow-2xl relative cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 ring-4 ring-amber-400/30 scale-[1.02]'
                        : 'border-amber-500/50 hover:border-amber-400'
                    }`}
                  >
                    <div>
                      {isSelected && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-zinc-950 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-amber-400/30">
                          <CheckCircle2 className="w-3.5 h-3.5" /> SELECTED PLAN
                        </div>
                      )}

                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <Crown className="w-5 h-5 text-amber-400" />
                          <h3 className="text-2xl font-black text-white">{t.name} Tier</h3>
                        </div>
                        <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md shadow-amber-400/20">
                          FLAGSHIP
                        </span>
                      </div>

                      <div className="text-4xl font-black text-amber-400 mt-4">${t.monthlyFee}<span className="text-xs font-normal text-zinc-400">/mo</span></div>
                      <p className="text-xs text-zinc-300 mt-2 font-medium">{t.description || 'All-access flagship membership with free court sessions and top discounts.'}</p>

                      <div className="mt-6 space-y-3 text-xs text-zinc-200 border-t border-amber-500/20 pt-4">
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" /> Court Bookings: <strong className="text-white">{t.courtDiscountPercent}% OFF (Free Courts)</strong></div>
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" /> Gear Shop Discount: <strong className="text-white">{t.shopDiscountPercent}% OFF</strong></div>
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" /> Bar & Cafeteria: <strong className="text-white">{t.barDiscountPercent}% OFF</strong></div>
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" /> Priority Peak-Hour Reservation</div>
                      </div>
                    </div>

                    <Link
                      to="/auth/member/signup"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlanName(t.name);
                      }}
                      className={`mt-8 block text-center py-3.5 font-black rounded-xl text-xs transition shadow-lg ${
                        isSelected
                          ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-amber-400/30'
                          : 'bg-amber-500/20 hover:bg-amber-400 hover:text-zinc-950 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      {isSelected ? '✓ Gold Plan Selected — Join Now' : 'Select Gold Plan'}
                    </Link>
                  </div>
                );
              }

              if (t.name === 'Silver') {
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedPlanName(t.name)}
                    className={`bg-gradient-to-b from-zinc-800/40 via-zinc-900 to-zinc-900 p-8 rounded-3xl border flex flex-col justify-between transition-all duration-300 shadow-xl relative cursor-pointer ${
                      isSelected
                        ? 'border-zinc-200 ring-4 ring-zinc-300/30 scale-[1.02]'
                        : 'border-zinc-700/80 hover:border-zinc-400'
                    }`}
                  >
                    <div>
                      {isSelected && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-zinc-200 text-zinc-950 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-zinc-200/30">
                          <CheckCircle2 className="w-3.5 h-3.5" /> SELECTED PLAN
                        </div>
                      )}

                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-zinc-300" />
                          <h3 className="text-2xl font-black text-white">{t.name} Tier</h3>
                        </div>
                        <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                          VALUE CHOICE
                        </span>
                      </div>

                      <div className="text-4xl font-black text-zinc-200 mt-4">${t.monthlyFee}<span className="text-xs font-normal text-zinc-400">/mo</span></div>
                      <p className="text-xs text-zinc-400 mt-2 font-medium">{t.description || 'Standard membership with 50% court discount and gear perks.'}</p>

                      <div className="mt-6 space-y-3 text-xs text-zinc-300 border-t border-zinc-800 pt-4">
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-zinc-300 flex-shrink-0" /> Court Bookings: <strong className="text-white">{t.courtDiscountPercent}% OFF</strong></div>
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-zinc-300 flex-shrink-0" /> Gear Shop Discount: <strong className="text-white">{t.shopDiscountPercent}% OFF</strong></div>
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-zinc-300 flex-shrink-0" /> Bar & Cafeteria: <strong className="text-white">{t.barDiscountPercent}% OFF</strong></div>
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-zinc-300 flex-shrink-0" /> Flexible Session Scheduling</div>
                      </div>
                    </div>

                    <Link
                      to="/auth/member/signup"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlanName(t.name);
                      }}
                      className={`mt-8 block text-center py-3.5 font-black rounded-xl text-xs transition shadow-md ${
                        isSelected
                          ? 'bg-zinc-200 hover:bg-white text-zinc-950 shadow-zinc-200/30'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                      }`}
                    >
                      {isSelected ? '✓ Silver Plan Selected — Join Now' : 'Select Silver Plan'}
                    </Link>
                  </div>
                );
              }

              // Junior Tier
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedPlanName(t.name)}
                  className={`bg-gradient-to-b from-sky-950/20 via-zinc-900 to-zinc-900 p-8 rounded-3xl border flex flex-col justify-between transition-all duration-300 shadow-xl relative cursor-pointer ${
                    isSelected
                      ? 'border-sky-400 ring-4 ring-sky-400/30 scale-[1.02]'
                      : 'border-sky-500/40 hover:border-sky-400'
                  }`}
                >
                  <div>
                    {isSelected && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-sky-400 text-zinc-950 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-sky-400/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> SELECTED PLAN
                      </div>
                    )}

                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-sky-400" />
                        <h3 className="text-2xl font-black text-white">{t.name} Tier</h3>
                      </div>
                      <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                        UNDER-18 ATHLETE
                      </span>
                    </div>

                    <div className="text-4xl font-black text-sky-400 mt-4">${t.monthlyFee}<span className="text-xs font-normal text-zinc-400">/mo</span></div>
                    <p className="text-xs text-zinc-400 mt-2 font-medium">{t.description || 'Youth & junior membership (under-18) for developing young athletes.'}</p>

                    <div className="mt-6 space-y-3 text-xs text-zinc-300 border-t border-sky-500/20 pt-4">
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" /> Court Bookings: <strong className="text-white">{t.courtDiscountPercent}% OFF (Junior Rate)</strong></div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" /> Shop Discount: <strong className="text-white">{t.shopDiscountPercent}% OFF Junior Gear</strong></div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" /> Bar & Cafeteria: <strong className="text-white">{t.barDiscountPercent}% OFF Healthy Snacks</strong></div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" /> Academy & Coaching Access</div>
                    </div>
                  </div>

                  <Link
                    to="/auth/member/signup"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlanName(t.name);
                    }}
                    className={`mt-8 block text-center py-3.5 font-black rounded-xl text-xs transition shadow-md ${
                      isSelected
                        ? 'bg-sky-400 hover:bg-sky-300 text-zinc-950 shadow-sky-400/30'
                        : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-white border border-sky-500/30'
                    }`}
                  >
                    {isSelected ? '✓ Junior Plan Selected — Join Now' : 'Select Junior Plan'}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-zinc-950 border-t border-zinc-800 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-lime-400 text-zinc-950 font-black flex items-center justify-center text-sm">
              C
            </div>
            <span className="font-black text-white text-sm">CLUBORA</span>
            <span className="text-zinc-600">| Champions Club OS</span>
          </div>

          <div className="flex flex-wrap gap-6 text-zinc-400 font-semibold">
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
