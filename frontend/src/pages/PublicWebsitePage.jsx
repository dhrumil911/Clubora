import React, { useState, useEffect } from 'react';
import api from '../api';
import { Globe, Trophy, ShieldCheck, Calendar, ShoppingBag, Send, CheckCircle2, Star, Zap } from 'lucide-react';

export default function PublicWebsitePage() {
  const [tiers, setTiers] = useState([]);
  const [courts, setCourts] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', interest: 'Membership Enquiry', notes: '' });
  const [submitted, setSubmitted] = useState(false);

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
    <div className="min-h-screen bg-slate-900 text-white">
      
      {/* Hero Banner */}
      <div className="relative py-20 px-4 text-center max-w-5xl mx-auto overflow-hidden">
        <div className="inline-flex items-center gap-2 bg-sky-950 text-sky-400 border border-sky-800 px-4 py-1.5 rounded-full text-xs font-bold mb-6">
          <Trophy className="w-4 h-4" /> Welcome to The Champions Club
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
          The Digital Backbone of Modern Sports Management
        </h1>
        <p className="mt-6 text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
          Tennis, padel, cricket nets, gear shop, post-match cafeteria, and seamless online booking — all under one unified platform.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a href="#trial" className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-lg shadow-sky-600/30 transition">
            Book a Trial Session
          </a>
          <a href="#plans" className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-6 py-3 rounded-2xl text-sm border border-slate-700 transition">
            View Membership Plans
          </a>
        </div>
      </div>

      {/* Membership Tiers Section */}
      <div id="plans" className="py-16 bg-slate-950 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">Membership Tier Plans</h2>
            <p className="text-slate-400 text-sm mt-1">Unlock court discounts, gear shop offers, and post-match bar perks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map(t => (
              <div key={t.id} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex flex-col justify-between hover:border-sky-500 transition">
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">{t.name}</h3>
                    {t.name === 'Gold' && <span className="bg-amber-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full">POPULAR</span>}
                  </div>
                  <div className="text-3xl font-extrabold text-sky-400 mt-4">${t.monthlyFee}<span className="text-xs font-normal text-slate-400">/mo</span></div>
                  <p className="text-xs text-slate-400 mt-2">{t.description}</p>

                  <div className="mt-6 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-400" /> Court Discount: <strong>{t.courtDiscountPercent}% OFF</strong></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-400" /> Shop Discount: <strong>{t.shopDiscountPercent}% OFF</strong></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-400" /> Bar & Cafeteria: <strong>{t.barDiscountPercent}% OFF</strong></div>
                  </div>
                </div>

                <a href="#trial" className="mt-8 block text-center py-2.5 bg-slate-800 hover:bg-sky-600 text-white font-bold rounded-xl text-xs transition">
                  Select {t.name} Plan
                </a>
              </div>
            ))}
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
                <div className="font-extrabold text-white text-lg">${c.hourlyRate}/hr</div>
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
