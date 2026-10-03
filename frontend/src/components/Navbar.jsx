import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, ShoppingBag, Coffee, Target, LayoutDashboard, Globe, 
  LogOut, ShieldCheck, ChevronDown, User, Shield, Lock, Award, Home, Sparkles
} from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDashboardPath = (role) => {
    switch (role) {
      case 'OWNER':
        return '/owner';
      case 'FRONT_DESK_STAFF':
      case 'FRONT_DESK':
        return '/front-desk';
      case 'BAR_SHOP_STAFF':
      case 'BAR':
        return '/bar-shop';
      case 'MEMBER':
        return '/member';
      default:
        return '/member';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'OWNER': return 'Owner';
      case 'FRONT_DESK_STAFF':
      case 'FRONT_DESK': return 'Front Desk Staff';
      case 'BAR_SHOP_STAFF':
      case 'BAR': return 'Bar & Shop Staff';
      case 'MEMBER': return 'Club Member';
      default: return role;
    }
  };

  return (
    <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-50 shadow-lg backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-sky-400 flex items-center justify-center font-extrabold text-xl shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              C
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-wider bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
                CLUBORA
              </span>
              <span className="text-[10px] font-semibold text-sky-400 tracking-widest uppercase">
                Sports Club System
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
            <Link to="/" className={`hover:text-white transition ${location.pathname === '/' ? 'text-sky-400 font-bold' : ''}`}>
              Home
            </Link>

            {user ? (
              <>
                <Link to={getDashboardPath(user.role)} className="hover:text-white transition flex items-center gap-1 text-sky-400 font-bold bg-sky-950/80 px-3 py-1.5 rounded-lg border border-sky-800">
                  <LayoutDashboard className="w-4 h-4" /> My Dashboard
                </Link>
                {(user.role === 'OWNER' || user.role === 'FRONT_DESK_STAFF' || user.role === 'FRONT_DESK') && (
                  <>
                    <Link to="/members" className={`hover:text-white transition ${location.pathname === '/members' ? 'text-sky-400 font-bold' : ''}`}>
                      Members
                    </Link>
                    <Link to="/bookings" className={`hover:text-white transition ${location.pathname === '/bookings' ? 'text-sky-400 font-bold' : ''}`}>
                      Courts
                    </Link>
                    <Link to="/crm" className={`hover:text-white transition ${location.pathname === '/crm' ? 'text-sky-400 font-bold' : ''}`}>
                      CRM Leads
                    </Link>
                  </>
                )}
                {(user.role === 'OWNER' || user.role === 'BAR_SHOP_STAFF' || user.role === 'BAR') && (
                  <>
                    <Link to="/shop" className={`hover:text-white transition ${location.pathname === '/shop' ? 'text-sky-400 font-bold' : ''}`}>
                      Gear Shop
                    </Link>
                    <Link to="/bar" className={`hover:text-white transition ${location.pathname === '/bar' ? 'text-sky-400 font-bold' : ''}`}>
                      Bar POS
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <a href="/#membership" className="hover:text-white transition">Membership</a>
                <a href="/#courts" className="hover:text-white transition">Courts</a>
                <a href="/#shop" className="hover:text-white transition">Shop</a>
                <a href="/#about" className="hover:text-white transition">About</a>
              </>
            )}
          </nav>

          {/* Authentication & User Controls */}
          <div className="flex items-center gap-3" ref={dropdownRef}>
            
            {user ? (
              /* Logged In User Badge & Logout */
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-sky-600/30 text-sky-400 font-bold flex items-center justify-center text-xs border border-sky-500/30">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-white leading-none">{user.name}</div>
                    <div className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider mt-0.5">
                      {getRoleLabel(user.role)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onLogout();
                    navigate('/');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold transition shadow-sm"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              /* Authentication Dropdown (Task 2) */
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-sky-600/20 transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authentication</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    
                    {/* Header */}
                    <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                      Select Access Portal
                    </div>

                    <div className="p-2 space-y-1">
                      
                      {/* 1. Member Section */}
                      <div className="px-3 py-1 text-[10px] font-extrabold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3 h-3" /> Member Portal
                      </div>
                      <Link
                        to="/auth/member/login"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 font-semibold transition"
                      >
                        Member Login
                      </Link>
                      <Link
                        to="/auth/member/signup"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-3 py-2 rounded-xl hover:bg-sky-600/20 text-sky-300 font-semibold transition"
                      >
                        Member Sign Up (Create Account)
                      </Link>

                      <div className="my-1 border-t border-slate-800"></div>

                      {/* 2. Front Desk Staff */}
                      <div className="px-3 py-1 text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="w-3 h-3" /> Front Desk Staff
                      </div>
                      <Link
                        to="/auth/front-desk/login"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 font-semibold transition"
                      >
                        Front Desk Staff Login
                      </Link>

                      <div className="my-1 border-t border-slate-800"></div>

                      {/* 3. Bar / Shop Staff */}
                      <div className="px-3 py-1 text-[10px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Coffee className="w-3 h-3" /> Bar & Shop Staff
                      </div>
                      <Link
                        to="/auth/bar-shop/login"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 font-semibold transition"
                      >
                        Bar / Shop Staff Login
                      </Link>

                      <div className="my-1 border-t border-slate-800"></div>

                      {/* 4. Owner */}
                      <div className="px-3 py-1 text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-3 h-3" /> Club Owner
                      </div>
                      <Link
                        to="/auth/owner/login"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 font-semibold transition"
                      >
                        Owner Login
                      </Link>

                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
