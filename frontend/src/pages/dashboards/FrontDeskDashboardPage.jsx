import React, { useState } from 'react';
import MembersPage from '../MembersPage';
import BookingsPage from '../BookingsPage';
import CRMPage from '../CRMPage';
import { Users, Calendar, Target, ShieldCheck } from 'lucide-react';

export default function FrontDeskDashboardPage({ user }) {
  const [activeTab, setActiveTab] = useState('members');

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 bg-zinc-950 min-h-screen">
      
      {/* Front Desk Header */}
      <div className="bg-zinc-900 text-zinc-100 p-4 sm:p-6 rounded-3xl border border-zinc-800 shadow-2xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Front Desk Staff Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">Front Desk Operations</h1>
          <p className="text-xs text-zinc-400 mt-0.5 font-medium">Logged in as <strong className="text-zinc-200">{user?.name}</strong></p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-zinc-950 p-1.5 rounded-2xl flex flex-col sm:flex-row gap-1.5 border border-zinc-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition w-full sm:w-auto ${
              activeTab === 'members' ? 'bg-lime-400 text-zinc-950 font-black shadow-lg shadow-lime-400/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Members Directory
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition w-full sm:w-auto ${
              activeTab === 'bookings' ? 'bg-lime-400 text-zinc-950 font-black shadow-lg shadow-lime-400/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" /> Court Scheduler
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition w-full sm:w-auto ${
              activeTab === 'crm' ? 'bg-lime-400 text-zinc-950 font-black shadow-lg shadow-lime-400/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" /> Visitor CRM & Quotes
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
