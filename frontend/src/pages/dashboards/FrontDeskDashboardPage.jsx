import React, { useState } from 'react';
import MembersPage from '../MembersPage';
import BookingsPage from '../BookingsPage';
import CRMPage from '../CRMPage';
import { Users, Calendar, Target, ShieldCheck } from 'lucide-react';

export default function FrontDeskDashboardPage({ user }) {
  const [activeTab, setActiveTab] = useState('members');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Front Desk Header */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Front Desk Staff Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">Front Desk Operations</h1>
          <p className="text-xs text-slate-400 mt-0.5">Logged in as <strong>{user?.name}</strong></p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-950 p-1.5 rounded-2xl flex gap-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'members' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Members Directory
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'bookings' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Court Scheduler
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'crm' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" /> Visitor CRM & Quotes
          </button>
        </div>
      </div>

      {/* Active Tab View */}
      <div>
        {activeTab === 'members' && <MembersPage />}
        {activeTab === 'bookings' && <BookingsPage />}
        {activeTab === 'crm' && <CRMPage />}
      </div>

    </div>
  );
}
