import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Calendar, ShoppingBag, Coffee, Target, LayoutDashboard, Globe, LogOut, ShieldCheck } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const location = useLocation();

  const navItems = [
    { label: 'Front Desk & Members', path: '/members', icon: Users },
    { label: 'Court Bookings', path: '/bookings', icon: Calendar },
    { label: 'Gear Shop POS', path: '/shop', icon: ShoppingBag },
    { label: 'Bar & Cafeteria POS', path: '/bar', icon: Coffee },
    { label: 'CRM & Leads', path: '/crm', icon: Target },
    { label: 'Owner Analytics', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Public Website', path: '/public', icon: Globe },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <Link to="/members" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-sky-500/20">
              C
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
                CLUBORA
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                Champions Club
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white flex items-center gap-1 justify-end">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    {user.name}
                  </div>
                  <div className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider">
                    {user.role}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-md transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>

        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex overflow-x-auto bg-slate-950 border-t border-slate-800 px-2 py-2 gap-1 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap font-medium ${
                isActive ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
