import React, { useState, useEffect } from 'react';
import api from '../../api';
import MemberBarCafeOrdering from '../../components/MemberBarCafeOrdering';
import { Crown, Shield, Trophy, Sparkles, CheckCircle2, CreditCard, ArrowRight, X, AlertTriangle, Calendar, Tag } from 'lucide-react';

export default function MemberDashboardPage({ user }) {
  const [memberInfo, setMemberInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState('Gold');
  const [durationMonths, setDurationMonths] = useState(12);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const plans = {
    Gold: {
      name: 'Gold',
      baseMonthlyFee: 2499,
      icon: Crown,
      badge: 'FLAGSHIP TIER',
      borderColor: 'border-amber-400',
      textColor: 'text-amber-400',
      benefits: ['Free Courts (100% OFF)', '20% OFF Gear Shop', '20% OFF Bar & Cafe']
    },
    Silver: {
      name: 'Silver',
      baseMonthlyFee: 1299,
      icon: Shield,
      badge: 'VALUE CHOICE',
      borderColor: 'border-zinc-400',
      textColor: 'text-zinc-300',
      benefits: ['50% OFF Courts', '10% OFF Gear Shop', '10% OFF Bar & Cafe']
    },
    Junior: {
      name: 'Junior',
      baseMonthlyFee: 699,
      icon: Trophy,
      badge: 'UNDER-18 ATHLETE',
      borderColor: 'border-sky-400',
      textColor: 'text-sky-400',
      benefits: ['50% OFF Courts', '15% OFF Junior Gear', '15% OFF Bar & Cafe']
    }
  };

  const durationDiscounts = { 3: 0, 6: 5, 12: 10 };

  const calculateTotal = (tierName, duration) => {
    const base = plans[tierName]?.baseMonthlyFee || 100;
    const disc = durationDiscounts[duration] || 0;
    const monthly = base * (1 - disc / 100);
    return monthly * duration;
  };

  useEffect(() => {
    fetchMemberProfile();
  }, []);

  const fetchMemberProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/members');
      const currentUserMember = res.data.find(m => m.email.toLowerCase() === user?.email?.toLowerCase()) || res.data[0];
      setMemberInfo(currentUserMember);
      if (currentUserMember?.tier?.name) {
        setSelectedTier(currentUserMember.tier.name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlanRazorpay = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (typeof window.Razorpay === 'undefined') {
      setErrorMsg('Razorpay SDK failed to load. Please refresh and try again.');
      return;
    }

    try {
      setPaymentLoading(true);

      const orderRes = await api.post('/payments/razorpay/plan-order', {
        memberId: memberInfo?.id,
        email: user?.email,
        name: user?.name,
        tierName: selectedTier,
        durationMonths: durationMonths
      });

      const { orderId, planRefId, amount, currency, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'Clubora Champions Club',
        description: `Upgrade to ${selectedTier} Plan (${durationMonths} Months)`,
        order_id: orderId,
        prefill: {
          name: user?.name || memberInfo?.name || '',
          email: user?.email || memberInfo?.email || '',
          contact: memberInfo?.phone || ''
        },
        theme: { color: '#a3e635' },
        handler: async function (response) {
          try {
            setPaymentLoading(true);
            const verifyRes = await api.post('/payments/razorpay/verify-plan', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planRefId,
              memberId: memberInfo?.id,
              tierName: selectedTier,
              durationMonths: durationMonths
            });

            setSuccessMsg(verifyRes.data.message || 'Membership upgraded successfully!');
            setTimeout(() => {
              setShowPlanModal(false);
              fetchMemberProfile();
              setSuccessMsg('');
            }, 1500);
          } catch (vErr) {
            setErrorMsg(vErr.response?.data?.error || 'Payment verification failed.');
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setPaymentLoading(false);
        setErrorMsg(`Payment failed: ${resp.error.description}`);
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to initiate plan upgrade.');
      setPaymentLoading(false);
    }
  };

  const currentTierName = memberInfo?.tier?.name || 'Gold';
  const CurrentIcon = plans[currentTierName]?.icon || Crown;

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-zinc-950 min-h-screen text-zinc-100 space-y-6">
      
      {/* Member Plan Status Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 shadow-lg">
            <CurrentIcon className={`w-8 h-8 ${plans[currentTierName]?.textColor || 'text-lime-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">{memberInfo?.name || user?.name || 'Club Member'}</h2>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border bg-zinc-950 ${plans[currentTierName]?.borderColor || 'border-lime-400'} ${plans[currentTierName]?.textColor || 'text-lime-400'}`}>
                {currentTierName} Member
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Member Code: <strong className="text-zinc-200 font-mono">{memberInfo?.memberCode || 'MEM-001'}</strong> • Valid Until: <strong className="text-lime-400">{memberInfo?.expiresAt ? new Date(memberInfo.expiresAt).toLocaleDateString() : 'Active Season'}</strong>
            </p>
          </div>
        </div>

        {/* Upgrade / Renew Plan Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPlanModal(true)}
            className="px-5 py-3 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black rounded-2xl text-xs shadow-lg shadow-lime-400/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-zinc-950" />
            <span>Renew / Upgrade Plan (Gold, Silver, Junior)</span>
          </button>
        </div>
      </div>

      {/* Sofa & Patio Food & Drink Ordering */}
      <MemberBarCafeOrdering user={user} memberInfo={memberInfo} />

      {/* Plan Upgrade / Renewal Razorpay Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-zinc-800 text-white space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-lime-400" /> Renew or Upgrade Membership
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">Select a membership tier and duration to pay securely via Razorpay.</p>
              </div>
              <button
                onClick={() => setShowPlanModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-rose-950/80 border border-rose-800 text-rose-200 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Duration Selector */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Select Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { months: 3, label: '3 Months', badge: 'Standard' },
                  { months: 6, label: '6 Months', badge: '5% OFF' },
                  { months: 12, label: '12 Months', badge: '10% OFF Best' }
                ].map(opt => (
                  <button
                    key={opt.months}
                    type="button"
                    onClick={() => setDurationMonths(opt.months)}
                    className={`p-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                      durationMonths === opt.months
                        ? 'bg-lime-400 text-zinc-950 font-black shadow-md'
                        : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] opacity-80 mt-0.5">{opt.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tier Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.keys(plans).map(key => {
                const plan = plans[key];
                const Icon = plan.icon;
                const isSel = selectedTier === plan.name;
                const total = calculateTotal(plan.name, durationMonths);

                return (
                  <div
                    key={plan.name}
                    onClick={() => setSelectedTier(plan.name)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                      isSel
                        ? `${plan.borderColor} bg-zinc-950 ring-2 ring-lime-400/40 shadow-xl`
                        : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-5 h-5 ${plan.textColor}`} />
                        <span className="text-[9px] font-black uppercase text-zinc-400">{plan.badge}</span>
                      </div>
                      <h4 className="text-base font-black text-white">{plan.name}</h4>
                      <div className="text-lime-400 font-black text-lg mt-1 font-mono">₹{total.toFixed(2)}</div>
                      <div className="text-[10px] text-zinc-500">for {durationMonths} months</div>

                      <div className="mt-3 space-y-1 text-[11px] text-zinc-300">
                        {plan.benefits.map((b, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <span className="text-lime-400 font-bold">✓</span>
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Test Mode Note & Checkout Action */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Total Due Online:</span>
                <span className="text-lime-400 font-black text-lg font-mono">
                  ₹{calculateTotal(selectedTier, durationMonths).toFixed(2)}
                </span>
              </div>
              <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse"></span>
                <span>Test Mode: UPI <code className="text-zinc-300">success@razorpay</code> or Test Card (OTP: <code className="text-zinc-300">123456</code>)</span>
              </div>

              <button
                type="button"
                disabled={paymentLoading}
                onClick={handleUpgradePlanRazorpay}
                className="w-full py-3.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black rounded-xl text-xs shadow-lg shadow-lime-400/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{paymentLoading ? 'Opening Razorpay...' : `Pay ₹${calculateTotal(selectedTier, durationMonths).toFixed(2)} & Activate ${selectedTier} Plan`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
