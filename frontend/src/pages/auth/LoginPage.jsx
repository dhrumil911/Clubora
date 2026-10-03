import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import { 
  Lock, Mail, AlertTriangle, CheckCircle2, ArrowRight, Shield, 
  Award, User, Coffee, Eye, EyeOff, Sparkles, Key, ShoppingBag
} from 'lucide-react';

const ROLES_CONFIG = [
  {
    key: 'OWNER',
    label: 'Club Owner',
    icon: Award,
    color: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-500/50',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    subtitle: 'Executive Financial Analytics & Staff Shift Management',
    demo: { email: 'owner@clubora.com', password: 'Clubora@2026' }
  },
  {
    key: 'FRONT_DESK_STAFF',
    label: 'Front Desk',
    icon: Shield,
    color: 'from-sky-500 to-indigo-600',
    borderColor: 'border-sky-500/50',
    badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    subtitle: 'Member Directory, Court Scheduler & Visitor CRM',
    demo: { email: 'frontdesk@clubora.com', password: 'Frontdesk@2026' }
  },
  {
    key: 'BAR_STAFF',
    label: 'Bar Staff',
    icon: Coffee,
    color: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/50',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    subtitle: 'Cafeteria Bar Orders POS & Daily Bar Expenses Tracker',
    demo: { email: 'bar@clubora.com', password: 'Bar@2026' }
  },
  {
    key: 'SHOP_STAFF',
    label: 'Shop Staff',
    icon: ShoppingBag,
    color: 'from-purple-500 to-pink-600',
    borderColor: 'border-purple-500/50',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    subtitle: 'Pro Shop Gear Inventory POS & Retail Sales',
    demo: { email: 'shop@clubora.com', password: 'Shop@2026' }
  },
  {
    key: 'MEMBER',
    label: 'Club Member',
    icon: User,
    color: 'from-indigo-500 to-purple-600',
    borderColor: 'border-indigo-500/50',
    badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    subtitle: 'Book Court Slots, Buy Gear & Manage Membership',
    demo: { email: 'david.gold@example.com', password: 'password123' }
  }
];

export default function LoginPage({ role: initialRole, title: customTitle, subtitle: customSubtitle, demoCredentials, onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active role mode
  const [activeRoleKey, setActiveRoleKey] = useState(initialRole || 'OWNER');
  const activeConfig = ROLES_CONFIG.find(r => r.key === activeRoleKey) || ROLES_CONFIG[0];

  const [email, setEmail] = useState(demoCredentials?.email || activeConfig.demo.email);
  const [password, setPassword] = useState(demoCredentials?.password || activeConfig.demo.password);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Update credentials when switching role tab
  const handleRoleSelect = (roleKey) => {
    setActiveRoleKey(roleKey);
    const config = ROLES_CONFIG.find(r => r.key === roleKey);
    if (config) {
      setEmail(config.demo.email);
      setPassword(config.demo.password);
      setErrorMsg('');
    }
  };

  const getRedirectPath = (userRole) => {
    switch (userRole) {
      case 'OWNER': return '/owner';
      case 'FRONT_DESK_STAFF':
      case 'FRONT_DESK': return '/front-desk';
      case 'BAR_STAFF':
      case 'BAR': return '/bar';
      case 'SHOP_STAFF':
      case 'SHOP': return '/shop';
      case 'BAR_SHOP_STAFF': return '/bar-shop';
      case 'MEMBER': return '/member';
      default: return '/member';
    }
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Email and password are required.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', {
        email: email.trim(),
        password,
        targetRole: initialRole ? activeRoleKey : 'ANY' // enforce role if routed specifically, or allow ANY
      });

      if (res.data.token && res.data.user) {
        localStorage.setItem('clubora_token', res.data.token);
        if (onLoginSuccess) {
          onLoginSuccess(res.data.user, res.data.token);
        }
        const targetPath = getRedirectPath(res.data.user.role);
        navigate(targetPath, { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Invalid credentials or access denied.');
    } finally {
      setLoading(false);
    }
  };

  const ActiveIcon = activeConfig.icon;

  return (
    <div className="min-h-[88vh] flex items-center justify-center py-12 px-4 bg-slate-950 text-slate-100">
      <div className="max-w-md w-full space-y-6 bg-slate-900/90 p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl">
        
        {/* Role Selector Tabs (if not forced by dedicated path) */}
        {!initialRole && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Select Access Portal
            </div>
            <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-slate-950 rounded-2xl border border-slate-850">
              {ROLES_CONFIG.map((r) => {
                const IconComponent = r.icon;
                const isSelected = activeRoleKey === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => handleRoleSelect(r.key)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold transition-all ${
                      isSelected
                        ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 mb-1 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                    <span className="truncate max-w-full">{r.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-2">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${activeConfig.color} mx-auto flex items-center justify-center text-white shadow-lg shadow-sky-500/10`}>
            <ActiveIcon className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white">
              {customTitle || `${activeConfig.label} Login`}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {customSubtitle || activeConfig.subtitle}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs p-3.5 rounded-2xl flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Demo Credentials Banner */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Quick Demo Account</span>
              <span className="text-slate-300 font-mono text-[11px]">{activeConfig.demo.email}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail(activeConfig.demo.email);
              setPassword(activeConfig.demo.password);
            }}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg transition border border-slate-700"
          >
            Auto Fill
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="user@clubora.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <span className="text-[11px] text-slate-500">Demo: <code className="text-slate-400">{activeConfig.demo.password}</code></span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-gradient-to-r ${activeConfig.color} hover:opacity-95 text-white font-bold rounded-xl text-sm shadow-lg shadow-sky-600/20 transition flex items-center justify-center gap-2`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Authenticating...
              </span>
            ) : (
              <>
                <span>Sign In as {activeConfig.label}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* Member Sign Up Redirect */}
        <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-800/80 flex justify-between items-center">
          <span>Need a new Member account?</span>
          <Link to="/auth/member/signup" className="text-sky-400 hover:text-sky-300 font-bold transition flex items-center gap-1">
            <span>Register Here</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>
    </div>
  );
}
