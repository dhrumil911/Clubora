import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardPage from '../DashboardPage';
import ShopPage from '../ShopPage';
import CRMPage from '../CRMPage';
import InvoicesPage from '../InvoicesPage';
import StaffShiftsPage from '../StaffShiftsPage';
import TaxReportsPage from '../TaxReportsPage';
import DailyBarExpenseTracker from '../../components/DailyBarExpenseTracker';
import FrontDeskDashboardPage from './FrontDeskDashboardPage';
import {
  Award, LayoutDashboard, Target, FileText, Clock, BarChart3, Coffee, ShieldCheck, ShoppingBag
} from 'lucide-react';

const TABS = [
  { key: 'dashboard', label: 'Analytics', description: 'Track revenue performance and operating trends.', icon: LayoutDashboard },
  { key: 'inventory', label: 'Shop Inventory', description: 'Manage products, stock levels, and purchase requests.', icon: ShoppingBag },
  { key: 'front-desk', label: 'Front Desk Hub', description: 'Coordinate check-ins, bookings, walk-ins, and member support.', icon: ShieldCheck },
  { key: 'bar-expenses', label: 'Daily Bar Expenses', description: 'Track cafeteria sales, daily expenses, and net profit.', icon: Coffee },
  { key: 'crm', label: 'CRM & Leads', description: 'Manage visitor enquiries, follow-ups, and membership quotes.', icon: Target },
  { key: 'invoices', label: 'Invoices', description: 'Create, track, and manage client billing.', icon: FileText },
  { key: 'shifts', label: 'Staff & HR', description: 'Manage staff shifts and leave requests.', icon: Clock },
  { key: 'reports', label: 'Tax & Reports', description: 'Review revenue summaries and tax liabilities.', icon: BarChart3 },
];

export default function OwnerDashboardPage({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const activeSection = TABS.find(tab => tab.key === activeTab) || TABS[0];
  const ActiveSectionIcon = activeSection.icon;

  const uRole = (user?.role || '').toUpperCase();
  if (user && uRole !== 'OWNER') {
    const redirectPath = (uRole === 'FRONT_DESK_STAFF' || uRole === 'FRONT_DESK') ? '/front-desk'
      : (uRole === 'BAR_SHOP_STAFF' || uRole === 'BAR') ? '/bar'
      : (uRole === 'SHOP_STAFF' || uRole === 'SHOP') ? '/shop'
      : '/member';
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-[#eef0f3] min-h-screen">
      
      {/* Owner Banner */}
      <div className="bg-white text-zinc-900 p-6 rounded-3xl border border-zinc-200 shadow-[0_12px_30px_rgba(15,23,42,0.08)] mb-4">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-lime-500" />
              <span className="text-[10px] font-black text-lime-600 uppercase tracking-widest">Club Owner Portal</span>
            </div>
            <h1 className="text-2xl font-black text-zinc-900 mt-1">Executive Command Center</h1>
            <p className="text-xs text-zinc-600 mt-0.5 font-medium">Logged in as <strong className="text-zinc-800">{user?.name}</strong> ({user?.email})</p>
          </div>

          {/* Tab Switcher */}
          <nav aria-label="Owner portal sections" className="w-full max-w-full overflow-x-auto scrollbar-none bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200">
            <div className="flex w-max min-w-full flex-nowrap gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex shrink-0 items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? 'bg-lime-400 text-zinc-950 shadow-lg shadow-lime-400/20 font-black'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              );
            })}
            </div>
          </nav>
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="owner-workspace min-w-0 space-y-2.5">
        <div className="owner-section-heading flex items-center gap-3 px-1">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-lime-400/10 text-lime-600 flex items-center justify-center">
            <ActiveSectionIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-black text-zinc-900">{activeSection.label}</h2>
            <p className="text-xs text-zinc-600 mt-0.5">{activeSection.description}</p>
          </div>
        </div>

        <div className="owner-tab-content min-w-0">
        {activeTab === 'dashboard' && <DashboardPage isEmbedded />}
        {activeTab === 'inventory' && <ShopPage user={user} isEmbedded />}
        {activeTab === 'front-desk' && <FrontDeskDashboardPage user={user} isEmbedded={true} />}
        {activeTab === 'bar-expenses' && <DailyBarExpenseTracker userRole="OWNER" isEmbedded />}
        {activeTab === 'crm' && <CRMPage isEmbedded />}
        {activeTab === 'invoices' && <InvoicesPage isEmbedded />}
        {activeTab === 'shifts' && <StaffShiftsPage isEmbedded />}
        {activeTab === 'reports' && <TaxReportsPage isEmbedded />}
        </div>
      </div>

    </div>
  );
}
