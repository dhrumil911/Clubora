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
    key: 'BAR_SHOP_STAFF',
    label: 'Bar & Shop',
    icon: Coffee,
    color: 'from-teal-500 to-emerald-600',
    borderColor: 'border-teal-500/50',
    badgeBg: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    subtitle: 'Gear Inventory POS & Bar Cafeteria Order Tabs',
    demo: { email: 'barshop@clubora.com', password: 'Barshop@2026' }
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
      case 'MEMBER': return '/bar-cafe';
      default: return '/bar-cafe';
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
    <div className="w-full flex-1 flex items-center justify-center py-12 px-4 bg-zinc-950 text-zinc-100">
      <div className="max-w-md w-full space-y-6 bg-zinc-900/90 p-8 rounded-3xl border border-zinc-800 shadow-2xl backdrop-blur-xl">
        
        {/* Role Selector Tabs (if not forced by dedicated path) */}
        {!initialRole && (
          <div className="space-y-2">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider text-center">
              Select Access Portal
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-zinc-950 rounded-2xl border border-zinc-800">
              {ROLES_CONFIG.map((r) => {
                const IconComponent = r.icon;
                const isSelected = activeRoleKey === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => handleRoleSelect(r.key)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-bold transition-all ${
                      isSelected
                        ? 'bg-zinc-800 text-lime-400 shadow-md border border-lime-400/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 mb-1 ${isSelected ? 'text-lime-400' : 'text-zinc-500'}`} />
                    <span className="truncate max-w-full">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-lime-400 text-zinc-950 mx-auto flex items-center justify-center shadow-lg shadow-lime-400/20 font-black">
            <ActiveIcon className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">
              {customTitle || `${activeConfig.label} Login`}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto font-medium">
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
        <div className="bg-zinc-950/90 border border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-lime-400" />
            <div className="text-left">
              <span className="text-[10px] font-black text-lime-400 uppercase tracking-wider block">Quick Demo Account</span>
              <span className="text-zinc-300 font-mono text-[11px]">{activeConfig.demo.email}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail(activeConfig.demo.email);
              setPassword(activeConfig.demo.password);
            }}
            className="px-3 py-1.5 bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 text-[11px] font-black rounded-xl transition border border-lime-400/30"
          >
            Auto Fill
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="user@clubora.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:ring-2 focus:ring-lime-400 focus:border-transparent focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-zinc-300">Password</label>
              <span className="text-[11px] text-zinc-500">Demo: <code className="text-lime-400 font-mono">{activeConfig.demo.password}</code></span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:ring-2 focus:ring-lime-400 focus:border-transparent focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black rounded-xl text-sm shadow-lg shadow-lime-400/20 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
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
        <div className="text-center text-xs text-zinc-400 pt-4 border-t border-zinc-800/80 flex justify-between items-center">
          <span>Need a new Member account?</span>
          <Link to="/auth/member/signup" className="text-lime-400 hover:text-lime-300 font-bold transition flex items-center gap-1">
            <span>Register Here</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>
    </div>
  );
}
