import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import { 
  User, Mail, Phone, Lock, CheckCircle2, AlertTriangle, ArrowRight, 
  Crown, Shield, Trophy, Calendar, Sparkles, Check, ArrowLeft, Star
} from 'lucide-react';
import CluboraLogoIcon from '../../components/CluboraLogoIcon';

export default function MemberSignupPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Multi-step signup flow: step 1 (Account Info), step 2 (Plan Selection: Gold, Silver, Junior for 3, 6, 12 months)
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [selectedTier, setSelectedTier] = useState('Gold');
  const [durationMonths, setDurationMonths] = useState(12);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pre-select plan if passed via URL query params (e.g., /signup?plan=Gold)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const planParam = params.get('plan');
    if (planParam) {
      if (['gold', 'silver', 'junior'].includes(planParam.toLowerCase())) {
        setSelectedTier(planParam.charAt(0).toUpperCase() + planParam.slice(1).toLowerCase());
      }
    }
  }, [location.search]);

  // Pricing configuration for 3, 6, and 12 months
  const plansData = {
    Gold: {
      name: 'Gold',
      baseMonthlyFee: 2499,
      badge: 'FLAGSHIP TIER',
      icon: Crown,
      borderColor: 'border-amber-400',
      activeRing: 'ring-4 ring-amber-400/40',
      accentBg: 'bg-amber-400',
      accentText: 'text-amber-400',
      buttonBg: 'bg-amber-400 hover:bg-amber-300 text-zinc-950',
      benefits: [
        'Court Bookings: 100% OFF (Free Courts)',
        'Gear Pro Shop: 20% OFF Member Discount',
        'Cafeteria Bar: 20% OFF Food & Drinks',
        'Priority Peak-Hour Reservation Access',
        'Free Racket Demo & Stringing Service'
      ]
    },
    Silver: {
      name: 'Silver',
      baseMonthlyFee: 1299,
      badge: 'VALUE CHOICE',
      icon: Shield,
      borderColor: 'border-zinc-500',
      activeRing: 'ring-4 ring-zinc-400/40',
      accentBg: 'bg-zinc-300',
      accentText: 'text-zinc-300',
      buttonBg: 'bg-zinc-200 hover:bg-white text-zinc-950',
      benefits: [
        'Court Bookings: 50% OFF Hourly Rates',
        'Gear Pro Shop: 10% OFF Member Discount',
        'Cafeteria Bar: 10% OFF Food & Drinks',
        'Flexible 30-Minute Slot Scheduling',
        'Access to Member Social Tournaments'
      ]
    },
    Junior: {
      name: 'Junior',
      baseMonthlyFee: 699,
      badge: 'UNDER-18 ATHLETE',
      icon: Trophy,
      borderColor: 'border-sky-400',
      activeRing: 'ring-4 ring-sky-400/40',
      accentBg: 'bg-sky-400',
      accentText: 'text-sky-400',
      buttonBg: 'bg-sky-400 hover:bg-sky-300 text-zinc-950',
      benefits: [
        'Court Bookings: 50% OFF (Junior Rate)',
        'Gear Pro Shop: 15% OFF Junior Equipment',
        'Cafeteria Bar: 15% OFF Healthy Shakes',
        'Youth Academy & Coaching Clinic Access',
        'Parental Companion Access Included'
      ]
    }
  };

  // Duration discounts: 3 months = 0%, 6 months = 5% off, 12 months = 10% off
  const durationOptions = [
    { months: 3, label: '3 Months', badge: 'Standard Quarter', discountPercent: 0 },
    { months: 6, label: '6 Months', badge: 'Save 5%', discountPercent: 5 },
    { months: 12, label: '12 Months', badge: 'Save 10% (Best Value)', discountPercent: 10 }
  ];

  const getEffectiveMonthlyRate = (baseRate, duration) => {
    const opt = durationOptions.find(d => d.months === duration) || durationOptions[0];
    const discount = (baseRate * opt.discountPercent) / 100;
    return baseRate - discount;
  };

  const getTotalPlanPrice = (baseRate, duration) => {
    const effectiveMonthly = getEffectiveMonthlyRate(baseRate, duration);
    return effectiveMonthly * duration;
  };

  const getCalculatedExpiryDate = (months) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString();
  };

  const handleStep1Validation = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPassword) {
      setErrorMsg('All account fields are required.');
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(form.email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (form.phone.trim().length < 7) {
      setErrorMsg('Please enter a valid phone number.');
      return;
    }

    if (form.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMsg('Password and Confirm Password do not match.');
      return;
    }

    // Proceed to Step 2: Plan Selection
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSignup = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (typeof window.Razorpay === 'undefined') {
      setErrorMsg('Razorpay SDK failed to load. Please refresh the page and try again.');
      return;
    }

    try {
      setLoading(true);
      setSuccessMsg('Preparing Razorpay checkout...');

      // 1. Create Razorpay Plan Order securely on backend
      const orderRes = await api.post('/payments/razorpay/plan-order', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        tierName: selectedTier,
        durationMonths: parseInt(durationMonths, 10)
      });

      const { orderId, planRefId, amount, currency, keyId, finalFee } = orderRes.data;

      // 2. Open Razorpay Checkout modal
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'Clubora Champions Club',
        description: `${selectedTier} Membership (${durationMonths} Months Plan)`,
        order_id: orderId,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone
        },
        notes: {
          plan: selectedTier,
          durationMonths: durationMonths,
          planRefId: planRefId
        },
        theme: {
          color: '#a3e635'
        },
        handler: async function (response) {
          try {
            setLoading(true);
            setSuccessMsg('Verifying payment signature with Clubora server...');

            const verifyRes = await api.post('/payments/razorpay/verify-plan', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planRefId,
              name: form.name,
              email: form.email,
              phone: form.phone,
              password: form.password,
              tierName: selectedTier,
              durationMonths: parseInt(durationMonths, 10)
            });

            setSuccessMsg(verifyRes.data.message || 'Payment confirmed! Welcome to Clubora.');

            if (verifyRes.data.token && verifyRes.data.user) {
              localStorage.setItem('clubora_token', verifyRes.data.token);
              if (onLoginSuccess) onLoginSuccess(verifyRes.data.user, verifyRes.data.token);
              setTimeout(() => {
                navigate('/bar-cafe');
              }, 1200);
            } else {
              setTimeout(() => {
                navigate('/auth/member/login');
              }, 1500);
            }
          } catch (verifyErr) {
            console.error('Verify Plan Error:', verifyErr);
            setErrorMsg(verifyErr.response?.data?.error || 'Payment verification failed. Please contact club support.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setErrorMsg('Payment cancelled. Your membership was not activated.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (failResp) {
        setLoading(false);
        setErrorMsg(`Payment Failed: ${failResp.error.description || 'Transaction declined.'}`);
      });
      rzp.open();

    } catch (err) {
      console.error('Plan Order Error:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to initialize payment order. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex items-center justify-center py-8 sm:py-12 px-4 bg-zinc-950 text-zinc-100">
      <div className={`w-full transition-all duration-300 ${step === 1 ? 'max-w-md' : 'max-w-5xl'} bg-zinc-900/90 p-6 sm:p-8 rounded-3xl border border-zinc-800 shadow-2xl backdrop-blur-xl`}>
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <CluboraLogoIcon className="h-11 w-auto" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Join Clubora Champions Club</h2>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            {step === 1 
              ? 'Step 1 of 2: Create your member account credentials' 
              : 'Step 2 of 2: Select your membership plan (Gold, Silver, or Junior for 3, 6, or 12 months)'}
          </p>

          {/* Step Progress Pills */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${step === 1 ? 'bg-lime-400 text-zinc-950 font-black' : 'bg-zinc-800 text-zinc-400'}`}>
              <span>1</span> Account Details
            </div>
            <span className="text-zinc-600">→</span>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${step === 2 ? 'bg-lime-400 text-zinc-950 font-black' : 'bg-zinc-800 text-zinc-400'}`}>
              <span>2</span> Select Plan & Duration
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-200 text-xs p-3.5 rounded-2xl flex items-center gap-2 mb-6">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs p-3.5 rounded-2xl flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* =========================================================================
            STEP 1: ACCOUNT CREDENTIALS FORM
            ========================================================================= */}
        {step === 1 && (
          <form onSubmit={handleStep1Validation} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. David Beckham"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:ring-2 focus:ring-lime-400 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="david.gold@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:ring-2 focus:ring-lime-400 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="+1 555-0100"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:ring-2 focus:ring-lime-400 focus:outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:ring-2 focus:ring-lime-400 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:ring-2 focus:ring-lime-400 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black rounded-xl text-sm shadow-lg shadow-lime-400/20 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Continue to Select Plan (Gold, Silver, Junior)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-xs text-zinc-400 pt-4 border-t border-zinc-800">
              Already have an account?{' '}
              <Link to="/auth/member/login" className="text-lime-400 hover:underline font-bold">
                Member Login
              </Link>
            </div>

          </form>
        )}

        {/* =========================================================================
            STEP 2: PLAN SELECTION (GOLD, SILVER, JUNIOR FOR 3, 6, 12 MONTHS)
            ========================================================================= */}
        {step === 2 && (
          <div className="space-y-6">

            {/* Plan Duration Selector (3, 6, 12 Months) */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black text-lime-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Select Membership Duration
                </span>
                <p className="text-xs text-zinc-400 mt-0.5">Commitment period automatically sets your renewal schedule.</p>
              </div>

              <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                {durationOptions.map(opt => (
                  <button
                    key={opt.months}
                    type="button"
                    onClick={() => setDurationMonths(opt.months)}
                    className={`px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                      durationMonths === opt.months
                        ? 'bg-lime-400 text-zinc-950 font-black shadow-lg shadow-lime-400/20'
                        : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    <span className="font-black text-sm">{opt.label}</span>
                    <span className={`text-[10px] mt-0.5 ${durationMonths === opt.months ? 'text-zinc-950 font-extrabold' : 'text-zinc-500'}`}>
                      {opt.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3 Distinct Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.keys(plansData).map(planKey => {
                const plan = plansData[planKey];
                const IconComponent = plan.icon;
                const isSelected = selectedTier === plan.name;
                const monthlyRate = getEffectiveMonthlyRate(plan.baseMonthlyFee, durationMonths);
                const totalPrice = getTotalPlanPrice(plan.baseMonthlyFee, durationMonths);
                const hasDiscount = durationMonths > 3;

                return (
                  <div
                    key={plan.name}
                    onClick={() => setSelectedTier(plan.name)}
                    className={`bg-zinc-950 p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between relative cursor-pointer ${
                      isSelected
                        ? `${plan.borderColor} ${plan.activeRing} scale-[1.02] shadow-2xl`
                        : 'border-zinc-800 hover:border-zinc-700 opacity-90 hover:opacity-100'
                    }`}
                  >
                    <div>
                      {/* Active Plan Pill Indicator */}
                      {isSelected && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lime-400 text-zinc-950 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" /> SELECTED PLAN
                        </div>
                      )}

                      {/* Header with Icon and Tier Badge */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <IconComponent className={`w-5 h-5 ${plan.accentText}`} />
                          <h3 className="text-xl font-black text-white">{plan.name} Tier</h3>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${plan.borderColor} ${plan.accentText} bg-zinc-900`}>
                          {plan.badge}
                        </span>
                      </div>

                      {/* Pricing Display */}
                      <div className="space-y-1 mb-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-white">₹{monthlyRate.toFixed(2)}</span>
                          <span className="text-xs text-zinc-400 font-medium">/month</span>
                        </div>
                        <div className="text-xs text-zinc-400 font-medium">
                          Total for {durationMonths} months: <strong className="text-white">₹{totalPrice.toFixed(2)}</strong>
                          {hasDiscount && (
                            <span className="ml-1 text-lime-400 font-bold">
                              (Save {durationMonths === 6 ? '5%' : '10%'})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Plan Benefits */}
                      <div className="space-y-2.5 border-t border-zinc-800/80 pt-4 text-xs text-zinc-300">
                        {plan.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.accentText}`} />
                            <span className="leading-snug">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Choose Plan Button */}
                    <div className="mt-6 pt-4 border-t border-zinc-800/80">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTier(plan.name);
                        }}
                        className={`w-full py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>{plan.name} Selected</span>
                          </>
                        ) : (
                          <span>Select {plan.name}</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Plan Summary Box */}
            <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-lime-400 text-zinc-950 font-black flex items-center justify-center text-sm shadow-md">
                  ✓
                </div>
                <div>
                  <div className="font-extrabold text-white text-sm">
                    {selectedTier} Tier Membership — {durationMonths} Months Plan
                  </div>
                  <div className="text-zinc-400 mt-0.5">
                    Total Due: <strong className="text-lime-400 text-base">₹{getTotalPlanPrice(plansData[selectedTier].baseMonthlyFee, durationMonths).toFixed(2)}</strong> | Valid Until: <strong className="text-white">{getCalculatedExpiryDate(durationMonths)}</strong>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse"></span>
                    <span>Test Mode: Pay with UPI <code className="text-zinc-300 bg-zinc-900 px-1 rounded">success@razorpay</code> or Test Cards (OTP: <code className="text-zinc-300 bg-zinc-900 px-1 rounded">123456</code>)</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs border border-zinc-800 transition flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFinalSignup}
                  className="px-6 py-3 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black rounded-xl text-xs shadow-lg shadow-lime-400/20 transition flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <span>{loading ? 'Opening Razorpay...' : `Pay ₹${getTotalPlanPrice(plansData[selectedTier].baseMonthlyFee, durationMonths).toFixed(2)} & Activate Plan`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
