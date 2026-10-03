import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardPage from '../DashboardPage';
import CRMPage from '../CRMPage';
import InvoicesPage from '../InvoicesPage';
import StaffShiftsPage from '../StaffShiftsPage';
import TaxReportsPage from '../TaxReportsPage';
import DailyBarExpenseTracker from '../../components/DailyBarExpenseTracker';
import {
  Award, LayoutDashboard, Target, FileText, Clock, BarChart3, Coffee
} from 'lucide-react';

const TABS = [
  { key: 'dashboard', label: 'Analytics', icon: LayoutDashboard },
  { key: 'bar-expenses', label: 'Daily Bar Expenses', icon: Coffee },
  { key: 'crm', label: 'CRM & Leads', icon: Target },
  { key: 'invoices', label: 'Invoices', icon: FileText },
  { key: 'shifts', label: 'Staff & HR', icon: Clock },
  { key: 'reports', label: 'Tax & Reports', icon: BarChart3 },
];

export default function OwnerDashboardPage({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const uRole = (user?.role || '').toUpperCase();
  if (user && uRole !== 'OWNER') {
    const redirectPath = (uRole === 'FRONT_DESK_STAFF' || uRole === 'FRONT_DESK') ? '/front-desk'
      : (uRole === 'BAR_SHOP_STAFF' || uRole === 'BAR') ? '/bar'
      : (uRole === 'SHOP_STAFF' || uRole === 'SHOP') ? '/shop'
      : '/member';
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-zinc-950 min-h-screen">
      
      {/* Owner Banner */}
      <div className="bg-zinc-900 text-zinc-100 p-6 rounded-3xl border border-zinc-800 shadow-2xl mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-lime-400" />
              <span className="text-[10px] font-black text-lime-400 uppercase tracking-widest">Club Owner Portal</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">Executive Command Center</h1>
            <p className="text-xs text-zinc-400 mt-0.5 font-medium">Logged in as <strong className="text-zinc-200">{user?.name}</strong> ({user?.email})</p>
          </div>

          {/* Tab Switcher */}
          <div className="bg-zinc-950 p-1.5 rounded-2xl flex flex-wrap gap-1 border border-zinc-800">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.key
                      ? 'bg-lime-400 text-zinc-950 shadow-lg shadow-lime-400/20 font-black'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Tab Content */}
      <div>
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'bar-expenses' && <DailyBarExpenseTracker userRole="OWNER" />}
        {activeTab === 'crm' && <CRMPage />}
        {activeTab === 'invoices' && <InvoicesPage />}
        {activeTab === 'shifts' && <StaffShiftsPage />}
        {activeTab === 'reports' && <TaxReportsPage />}
      </div>

    </div>
  );
}
