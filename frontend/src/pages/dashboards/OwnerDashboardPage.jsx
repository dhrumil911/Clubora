import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardPage from '../DashboardPage';
import CRMPage from '../CRMPage';
import InvoicesPage from '../InvoicesPage';
import StaffShiftsPage from '../StaffShiftsPage';
import TaxReportsPage from '../TaxReportsPage';
import {
  Award, LayoutDashboard, Target, FileText, Clock, BarChart3
} from 'lucide-react';

const TABS = [
  { key: 'dashboard', label: 'Analytics', icon: LayoutDashboard },
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
      : (uRole === 'BAR_SHOP_STAFF' || uRole === 'BAR') ? '/bar-shop'
      : '/member';
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Owner Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Club Owner Portal</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">Executive Command Center</h1>
            <p className="text-xs text-slate-400 mt-0.5">Logged in as <strong>{user?.name}</strong> ({user?.email})</p>
          </div>

          {/* Tab Switcher */}
          <div className="bg-slate-950/80 p-1.5 rounded-2xl flex flex-wrap gap-1 border border-slate-800">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.key
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
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
        {activeTab === 'crm' && <CRMPage />}
        {activeTab === 'invoices' && <InvoicesPage />}
        {activeTab === 'shifts' && <StaffShiftsPage />}
        {activeTab === 'reports' && <TaxReportsPage />}
      </div>

    </div>
  );
}
