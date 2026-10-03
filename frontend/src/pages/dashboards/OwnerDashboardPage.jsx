import React from 'react';
import DashboardPage from '../DashboardPage';
import { Award } from 'lucide-react';

export default function OwnerDashboardPage({ user }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Owner Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Club Owner Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">Executive Financial Overview</h1>
          <p className="text-xs text-slate-400 mt-0.5">Logged in as <strong>{user?.name}</strong> ({user?.email})</p>
        </div>
      </div>

      <DashboardPage />

    </div>
  );
}
