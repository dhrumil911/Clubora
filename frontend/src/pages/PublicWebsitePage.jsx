import React, { useState, useEffect } from 'react';
import api from '../api';
import { Globe, Trophy, ShieldCheck, Calendar, ShoppingBag, Send, CheckCircle2, Star, Zap, Crown, Shield, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function PublicWebsitePage() {
  const { theme } = useTheme();
  const [tiers, setTiers] = useState([]);
  const [selectedPlanName, setSelectedPlanName] = useState('Gold');
  const [courts, setCourts] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', interest: 'Membership Enquiry', notes: '' });
  const [submitted, setSubmitted] = useState(false);

  const isLight = theme === 'light';

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

  const handleSubmitEnquiry = async (e) => {
    e.preventDefault();
    try {
      await api.post('/public/enquiry', form);
      setSubmitted(true);
      setForm({ name: '', phone: '', email: '', interest: 'Membership Enquiry', notes: '' });
    } catch (err) {
      alert('Failed to submit enquiry.');
    }
  };

  return (
    <div className={isLight ? "min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300" : "min-h-screen bg-slate-900 text-white transition-colors duration-300"}>
      
      {/* Hero Banner */}
      <div className="relative py-12 sm:py-20 px-4 text-center max-w-5xl mx-auto overflow-hidden">
        <div className={isLight ? "inline-flex items-center gap-2 bg-slate-200 text-sky-700 border border-sky-400/30 px-4 py-1.5 rounded-full text-xs font-bold mb-6" : "inline-flex items-center gap-2 bg-sky-950 text-sky-400 border border-sky-800 px-4 py-1.5 rounded-full text-xs font-bold mb-6"}>
          <Trophy className="w-4 h-4" /> Welcome to The Champions Club
        </div>
        <h1 className={isLight ? "text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900" : "text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent"}>
          The Digital Backbone of Modern Sports Management
        </h1>
        <p className={isLight ? "mt-6 text-slate-600 text-base sm:text-lg max-w-2xl mx-auto" : "mt-6 text-slate-400 text-base sm:text-lg max-w-2xl mx-auto"}>
          Tennis, padel, cricket nets, gear shop, post-match cafeteria, and seamless online booking — all under one unified platform.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a href="#trial" className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-lg shadow-sky-600/30 transition">
            Book a Trial Session
          </a>
          <a href="#plans" className={isLight ? "bg-white hover:bg-slate-50 text-slate-800 font-bold px-6 py-3 rounded-2xl text-sm border border-slate-300 transition shadow-sm" : "bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-6 py-3 rounded-2xl text-sm border border-slate-700 transition"}>
            View Membership Plans
          </a>
        </div>
      </div>

      {/* Membership Tiers Section */}
      <div id="plans" className="py-16 bg-zinc-950 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Membership Tier Plans</h2>
            <p className="text-zinc-400 text-sm mt-1">Unlock court discounts, gear shop offers, and post-match bar perks.</p>
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

                      <div className="text-4xl font-black text-amber-400 mt-4">₹{t.monthlyFee}<span className="text-xs font-normal text-zinc-400">/mo</span></div>
                      <p className="text-xs text-zinc-300 mt-2 font-medium">{t.description || 'All-access flagship membership with free court sessions and top discounts.'}</p>

                      <div className="mt-6 space-y-3 text-xs text-zinc-200 border-t border-amber-500/20 pt-4">
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" /> Court Bookings: <strong className="text-white">{t.courtDiscountPercent}% OFF (Free Courts)</strong></div>
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" /> Gear Shop Discount: <strong className="text-white">{t.shopDiscountPercent}% OFF</strong></div>
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" /> Bar & Cafeteria: <strong className="text-white">{t.barDiscountPercent}% OFF</strong></div>
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" /> Priority Peak-Hour Reservation</div>
                      </div>
                    </div>

                    <a
                      href="#trial"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlanName(t.name);
                        setForm(f => ({ ...f, interest: `${t.name} Membership` }));
                      }}
                      className={`mt-8 block text-center py-3.5 font-black rounded-xl text-xs transition shadow-lg ${
                        isSelected
                          ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-amber-400/30'
                          : 'bg-amber-500/20 hover:bg-amber-400 hover:text-zinc-950 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      {isSelected ? '✓ Gold Plan Selected — Apply Now' : 'Select Gold Plan'}
                    </a>
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

                      <div className="text-4xl font-black text-zinc-200 mt-4">₹{t.monthlyFee}<span className="text-xs font-normal text-zinc-400">/mo</span></div>
                      <p className="text-xs text-zinc-400 mt-2 font-medium">{t.description || 'Standard membership with 50% court discount and gear perks.'}</p>

                      <div className="mt-6 space-y-3 text-xs text-zinc-300 border-t border-zinc-800 pt-4">
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-zinc-300 flex-shrink-0" /> Court Bookings: <strong className="text-white">{t.courtDiscountPercent}% OFF</strong></div>
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-zinc-300 flex-shrink-0" /> Gear Shop Discount: <strong className="text-white">{t.shopDiscountPercent}% OFF</strong></div>
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-zinc-300 flex-shrink-0" /> Bar & Cafeteria: <strong className="text-white">{t.barDiscountPercent}% OFF</strong></div>
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-zinc-300 flex-shrink-0" /> Flexible Session Scheduling</div>
                      </div>
                    </div>

                    <a
                      href="#trial"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlanName(t.name);
                        setForm(f => ({ ...f, interest: `${t.name} Membership` }));
                      }}
                      className={`mt-8 block text-center py-3.5 font-black rounded-xl text-xs transition shadow-md ${
                        isSelected
                          ? 'bg-zinc-200 hover:bg-white text-zinc-950 shadow-zinc-200/30'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                      }`}
                    >
                      {isSelected ? '✓ Silver Plan Selected — Apply Now' : 'Select Silver Plan'}
                    </a>
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

                    <div className="text-4xl font-black text-sky-400 mt-4">₹{t.monthlyFee}<span className="text-xs font-normal text-zinc-400">/mo</span></div>
                    <p className="text-xs text-zinc-400 mt-2 font-medium">{t.description || 'Youth & junior membership (under-18) for developing young athletes.'}</p>

                    <div className="mt-6 space-y-3 text-xs text-zinc-300 border-t border-sky-500/20 pt-4">
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" /> Court Bookings: <strong className="text-white">{t.courtDiscountPercent}% OFF (Junior Rate)</strong></div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" /> Shop Discount: <strong className="text-white">{t.shopDiscountPercent}% OFF Junior Gear</strong></div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" /> Bar & Cafeteria: <strong className="text-white">{t.barDiscountPercent}% OFF Healthy Snacks</strong></div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" /> Academy & Coaching Access</div>
                    </div>
                  </div>

                  <a
                    href="#trial"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlanName(t.name);
                      setForm(f => ({ ...f, interest: `${t.name} Membership` }));
                    }}
                    className={`mt-8 block text-center py-3.5 font-black rounded-xl text-xs transition shadow-md ${
                      isSelected
                        ? 'bg-sky-400 hover:bg-sky-300 text-zinc-950 shadow-sky-400/30'
                        : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-white border border-sky-500/30'
                    }`}
                  >
                    {isSelected ? '✓ Junior Plan Selected — Apply Now' : 'Select Junior Plan'}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Courts & Rates Section */}
      <div className="py-16 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold">World-Class Courts & Facilities</h2>
          <p className="text-slate-400 text-sm mt-1">Book 1-hour sessions starting every 30 minutes with live availability.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {courts.map(c => (
            <div key={c.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-white text-base">{c.name}</h4>
                <div className="text-xs text-sky-400 font-semibold">{c.sport}</div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-white text-lg">₹{c.hourlyRate}/hr</div>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">Available</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trial Booking & Visitor Enquiry Form */}
      <div id="trial" className="py-16 bg-slate-950 border-t border-slate-800">
        <div className="max-w-xl mx-auto px-4 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold">Book a Trial Session or Enquiry</h3>
            <p className="text-slate-400 text-xs mt-1">Reach out directly and our front desk will send you a quote!</p>
          </div>

          {submitted ? (
            <div className="bg-emerald-950 text-emerald-300 p-6 rounded-2xl border border-emerald-800 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-base">Enquiry Received!</h4>
              <p className="text-xs">Someone at the club will follow up with you shortly with your trial quote.</p>
              <button onClick={() => setSubmitted(false)} className="mt-4 text-xs font-bold text-emerald-400 underline">
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitEnquiry} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Smith"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+1 555-0199"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Interest</label>
                <select
                  value={form.interest}
                  onChange={(e) => setForm({ ...form, interest: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Membership Enquiry">Membership Plan (Gold/Silver/Junior)</option>
                  <option value="Court Booking Trial">Court Trial Session</option>
                  <option value="Corporate Event">Corporate Event / Group Booking</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Message / Preferred Date</label>
                <textarea
                  rows={3}
                  placeholder="I'd like to try Tennis Court 1 this Friday..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-sky-600/30 transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Submit Enquiry & Get Quote
              </button>
            </form>
          )}
        </div>
      </div>

    </div>
  );
}
