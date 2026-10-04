import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Users, Calendar, ShoppingBag, Coffee, Target, LayoutDashboard, Globe,
  LogOut, ShieldCheck, ChevronDown, User, Shield, Lock, Award, Home, Sparkles, UserPlus, LogIn, Menu, X
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import CluboraLogoIcon from './CluboraLogoIcon';

export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const getDashboardPath = (role) => {
    switch (role) {
      case 'OWNER':
        return '/owner';
      case 'FRONT_DESK_STAFF':
      case 'FRONT_DESK':
        return '/front-desk';
      case 'BAR_STAFF':
      case 'BAR':
        return '/bar';
      case 'SHOP_STAFF':
      case 'SHOP':
        return '/shop';
      case 'BAR_SHOP_STAFF':
        return '/bar-shop';
      case 'MEMBER':
        return '/member';
      default:
        return '/member';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'OWNER': return 'Club Owner';
      case 'FRONT_DESK_STAFF':
      case 'FRONT_DESK': return 'Front Desk Staff';
      case 'BAR_STAFF':
      case 'BAR': return 'Bar Staff';
      case 'SHOP_STAFF':
      case 'SHOP': return 'Shop Staff';
      case 'BAR_SHOP_STAFF': return 'Bar & Shop Staff';
      case 'MEMBER': return 'Club Member';
      default: return role;
    }
  };

  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/#' + sectionId);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="bg-zinc-950/95 text-zinc-100 border-b border-zinc-800/80 sticky top-0 z-50 shadow-2xl backdrop-blur-md w-full">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group flex-shrink-0">
            <CluboraLogoIcon className="h-9 sm:h-10 w-auto group-hover:scale-105 transition-transform" />
            <span className="font-black text-base sm:text-xl tracking-wider text-white leading-none">
              CLUBORA
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-zinc-300">
            <Link 
              to="/" 
              className={`transition-colors py-1 ${location.pathname === '/' ? 'text-lime-400 font-extrabold border-b-2 border-lime-400' : 'hover:text-lime-700 dark:hover:text-lime-400'}`}
            >
              Home
            </Link>

            <button onClick={() => scrollToSection('membership')} className="hover:text-lime-700 dark:hover:text-lime-400 transition-colors py-1">
              Membership
            </button>

            <Link 
              to="/bookings" 
              className={`transition-colors py-1 ${location.pathname === '/bookings' ? 'text-lime-400 font-extrabold border-b-2 border-lime-400' : 'hover:text-lime-700 dark:hover:text-lime-400'}`}
            >
              Courts & Schedule
            </Link>

            <Link 
              to="/shop" 
              className={`transition-colors py-1 ${location.pathname === '/shop' ? 'text-lime-400 font-extrabold border-b-2 border-lime-400' : 'hover:text-lime-700 dark:hover:text-lime-400'}`}
            >
              Shop
            </Link>

            <Link 
              to="/bar-cafe" 
              className={`transition-colors py-1 ${location.pathname === '/bar-cafe' || location.pathname === '/member' ? 'text-lime-400 font-extrabold border-b-2 border-lime-400' : 'hover:text-lime-700 dark:hover:text-lime-400'}`}
            >
              Bar & Cafe
            </Link>

            <button onClick={() => scrollToSection('about')} className="hover:text-lime-700 dark:hover:text-lime-400 transition-colors py-1">
              About
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3" ref={dropdownRef}>

            {/* Global Theme Toggle (Always visible in top bar) */}
            <ThemeToggle />

            {user ? (
              /* Logged In User Controls (Shown on Tablet & Desktop) */
              <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                <Link
                  to={user.role === 'MEMBER' ? '/bar-cafe' : getDashboardPath(user.role)}
                  className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 px-2.5 py-1.5 rounded-xl shadow-inner transition group cursor-pointer"
                  title={user.role === 'MEMBER' ? 'Member Portal' : 'Admin Portal'}
                >
                  <div className="w-7 h-7 rounded-lg bg-lime-400 text-zinc-950 font-black flex items-center justify-center text-xs shadow-md">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-bold text-white leading-none group-hover:text-lime-300 transition-colors">{user.name}</div>
                    <div className="text-[9px] font-bold text-lime-400 uppercase tracking-wider mt-0.5">
                      {getRoleLabel(user.role)}
                    </div>
                  </div>
                </Link>

                <button
                  onClick={() => {
                    onLogout();
                    navigate('/');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/60 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              /* Logged Out Controls */
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/auth/member/signup"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-xl font-bold text-xs transition whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5 text-lime-400" />
                  <span>Join Club</span>
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1 sm:gap-2 bg-lime-400 hover:bg-lime-300 text-zinc-950 px-2.5 sm:px-4 py-1.5 rounded-xl font-black text-xs shadow-lg shadow-lime-400/20 transition-all whitespace-nowrap"
                  >
                    <LogIn className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Sign In</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 bg-zinc-950 font-bold text-zinc-400 text-[10px] uppercase tracking-wider border-b border-zinc-800">
                        Select Access Portal
                      </div>

                      <div className="p-2 space-y-1">
                        <Link to="/auth/member/login" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-800 text-zinc-200 font-semibold transition">
                          <User className="w-3.5 h-3.5 text-lime-400" />
                          <span>Member Portal</span>
                        </Link>
                        <Link to="/auth/front-desk/login" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-800 text-zinc-200 font-semibold transition">
                          <Shield className="w-3.5 h-3.5 text-sky-400" />
                          <span>Front Desk Staff</span>
                        </Link>
                        <Link to="/auth/bar/login" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-800 text-zinc-200 font-semibold transition">
                          <Coffee className="w-3.5 h-3.5 text-amber-400" />
                          <span>Bar Staff</span>
                        </Link>
                        <Link to="/auth/shop/login" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-800 text-zinc-200 font-semibold transition">
                          <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                          <span>Shop Staff</span>
                        </Link>
                        <Link to="/auth/owner/login" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-800 text-zinc-200 font-semibold transition">
                          <Award className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Club Owner Portal</span>
                        </Link>

                        <div className="my-1 border-t border-zinc-800"></div>

                        <Link to="/auth/member/signup" onClick={() => setDropdownOpen(false)} className="block text-center px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-lime-400 font-bold transition text-[11px]">
                          Create Member Account
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition flex-shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-lime-400" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-950 border-b border-zinc-800 px-4 pt-3 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[85vh] overflow-y-auto">
          
          {/* Mobile User Profile Section (if logged in) */}
          {user && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-lime-400 text-zinc-950 font-black flex items-center justify-center text-sm shadow-md">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{user.name}</div>
                  <div className="text-[10px] font-bold text-lime-400 uppercase tracking-wider">
                    {getRoleLabel(user.role)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                  navigate('/');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/60 rounded-xl text-xs font-bold transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}

          <nav className="flex flex-col gap-1 text-sm font-bold text-zinc-300">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3.5 py-2.5 rounded-xl transition ${location.pathname === '/' ? 'bg-zinc-900 text-lime-400 font-black' : 'hover:bg-zinc-900 hover:text-lime-700 dark:hover:text-lime-400'}`}
            >
              Home
            </Link>

            <button
              onClick={() => scrollToSection('membership')}
              className="text-left px-3.5 py-2.5 rounded-xl hover:bg-zinc-900 hover:text-lime-700 dark:hover:text-lime-400 transition"
            >
              Membership
            </button>

            <Link
              to="/bookings"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3.5 py-2.5 rounded-xl transition ${location.pathname === '/bookings' ? 'bg-zinc-900 text-lime-400 font-black' : 'hover:bg-zinc-900 hover:text-lime-700 dark:hover:text-lime-400'}`}
            >
              Courts & Schedule
            </Link>

            <Link
              to="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3.5 py-2.5 rounded-xl transition ${location.pathname === '/shop' ? 'bg-zinc-900 text-lime-400 font-black' : 'hover:bg-zinc-900 hover:text-lime-700 dark:hover:text-lime-400'}`}
            >
              Shop
            </Link>

            <Link
              to="/bar-cafe"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3.5 py-2.5 rounded-xl transition ${location.pathname === '/bar-cafe' || location.pathname === '/member' ? 'bg-zinc-900 text-lime-400 font-black' : 'hover:bg-zinc-900 hover:text-lime-700 dark:hover:text-lime-400'}`}
            >
              Bar & Cafe
            </Link>

            <button
              onClick={() => scrollToSection('about')}
              className="text-left px-3.5 py-2.5 rounded-xl hover:bg-zinc-900 hover:text-lime-700 dark:hover:text-lime-400 transition"
            >
              About
            </button>

            {user && user.role !== 'MEMBER' && (
              <Link
                to={getDashboardPath(user.role)}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-lime-400/10 text-lime-400 font-bold border border-lime-400/30 mt-1"
              >
                <LayoutDashboard className="w-4 h-4" /> Staff Admin Portal ({getRoleLabel(user.role)})
              </Link>
            )}

            {!user && (
              <div className="pt-2 space-y-2 border-t border-zinc-800/80">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-3">
                  Access Portals
                </div>
                <div className="grid grid-cols-1 gap-1">
                  <Link to="/auth/member/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold">
                    <User className="w-4 h-4 text-lime-400" /> Member Portal
                  </Link>
                  <Link to="/auth/front-desk/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold">
                    <Shield className="w-4 h-4 text-sky-400" /> Front Desk Staff
                  </Link>
                  <Link to="/auth/bar/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold">
                    <Coffee className="w-4 h-4 text-amber-400" /> Bar Staff
                  </Link>
                  <Link to="/auth/shop/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold">
                    <ShoppingBag className="w-4 h-4 text-purple-400" /> Shop Staff
                  </Link>
                  <Link to="/auth/owner/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold">
                    <Award className="w-4 h-4 text-emerald-400" /> Club Owner Portal
                  </Link>
                </div>

                <Link
                  to="/auth/member/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-lime-400 text-zinc-950 font-black text-xs shadow-md shadow-lime-400/20 mt-2"
                >
                  <UserPlus className="w-4 h-4" /> Join Champions Club
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
