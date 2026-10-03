import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`relative inline-flex items-center justify-between w-14 h-7 p-1 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-lime-400 ${
        isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-slate-200 border border-slate-300'
      } ${className}`}
    >
      <Sun className={`w-3.5 h-3.5 transition-opacity duration-200 ${isDark ? 'text-zinc-500 opacity-60' : 'text-amber-500 opacity-100'}`} />
      <Moon className={`w-3.5 h-3.5 transition-opacity duration-200 ${isDark ? 'text-lime-400 opacity-100' : 'text-slate-400 opacity-60'}`} />
      
      {/* Sliding Knob */}
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          isDark ? 'translate-x-7 bg-lime-400 text-zinc-950' : 'translate-x-0 bg-amber-400 text-white'
        }`}
      >
        {isDark ? <Moon className="w-3.5 h-3.5 text-zinc-950 fill-current" /> : <Sun className="w-3.5 h-3.5 text-white fill-current" />}
      </span>
    </button>
  );
}
