import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  LayoutDashboard, DollarSign, TrendingUp, ShoppingBag, Coffee, 
  Calendar, CreditCard, Users, FileText, Clock, Shield, Target,
  Percent, ArrowUpRight, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard(period);
  }, [period]);

  const fetchDashboard = async (selectedPeriod = 'all') => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/metrics', { params: { period: selectedPeriod } });
      setData(res.data);
    } catch (err) {
      console.error('Error fetching owner metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold">Loading executive metrics...</p>
      </div>
    );
  }

  if (!data || !data.metrics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-6 rounded-3xl max-w-md mx-auto space-y-3">
          <p className="font-bold text-sm">Unable to Load Executive Metrics</p>
          <p className="text-xs text-rose-200/80">Please ensure you are signed in as Club Owner with valid authorization.</p>
          <button
            onClick={() => fetchDashboard(period)}
            className="px-4 py-2 bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const { metrics = {}, leadStats = {}, paymentMethods = {}, invoices = [], shifts = [] } = data;
  const totalRev = metrics.totalEarned || 0;

  // Percentage calculations
  const courtPct = totalRev > 0 ? Math.round(((metrics.courtRevenue || 0) / totalRev) * 100) : 0;
  const shopPct = totalRev > 0 ? Math.round(((metrics.shopRevenue || 0) / totalRev) * 100) : 0;
  const barPct = totalRev > 0 ? Math.round(((metrics.barRevenue || 0) / totalRev) * 100) : 0;
  const memPct = totalRev > 0 ? Math.round(((metrics.membershipRevenue || 0) / totalRev) * 100) : 0;

  // Lead Funnel counts
  const newLeads = leadStats.NEW || 0;
  const contacted = leadStats.CONTACTED || 0;
  const trialBooked = leadStats.TRIAL_BOOKED || 0;
  const converted = leadStats.CONVERTED || 0;
  const totalLeads = newLeads + contacted + trialBooked + converted;
  const convRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      
      {/* Header & Period Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-7 h-7 text-sky-600" /> Executive Analytics & Financial Control
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Consolidated real-time operational revenue across Courts, Gear Shop POS, Bar Cafeteria & Corporate Receivables.
          </p>
        </div>

        {/* Time Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto">
          {[
            { key: 'all', label: 'All Time' },
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setPeriod(t.key)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                period === t.key
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Combined Revenue */}
        <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-sky-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Total Revenue</span>
              <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded-full text-[10px] font-extrabold">AGGREGATED</span>
            </div>
            <div className="text-3xl font-extrabold mt-3 text-white">${totalRev.toFixed(2)}</div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold border-t border-slate-800/80 pt-3">
            <TrendingUp className="w-4 h-4" /> Direct & recurring cash inflow
          </div>
        </div>

        {/* Court Bookings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Court Bookings</span>
              <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl"><Calendar className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">${(metrics.courtRevenue || 0).toFixed(2)}</div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 flex justify-between">
            <span>Share: <strong>{courtPct}%</strong></span>
            <span className="text-sky-600 font-semibold">{metrics.todayBookings || 0} bookings today</span>
          </div>
        </div>

        {/* Gear Shop POS */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gear Shop POS</span>
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl"><ShoppingBag className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">${(metrics.shopRevenue || 0).toFixed(2)}</div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
            Share: <strong>{shopPct}%</strong> &bull; Counter & Online gear
          </div>
        </div>

        {/* Bar & Cafeteria */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bar & Cafeteria</span>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl"><Coffee className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-2">${(metrics.barRevenue || 0).toFixed(2)}</div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
            Share: <strong>{barPct}%</strong> &bull; Settled member tabs
          </div>
        </div>

      </div>

      {/* Revenue Stream Breakdown & Lead Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Revenue Distribution Progress Bars */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Percent className="w-5 h-5 text-sky-600" /> Revenue Distribution by Stream
            </h3>
            <span className="text-xs font-semibold text-slate-400">Total: ${totalRev.toFixed(2)}</span>
          </div>

          <div className="space-y-4">
            {/* Courts */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Courts & Scheduler</span>
                <span>${(metrics.courtRevenue || 0).toFixed(2)} ({courtPct}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${courtPct}%` }}></div>
              </div>
            </div>

            {/* Gear Shop */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Gear Shop & Equipment POS</span>
                <span>${(metrics.shopRevenue || 0).toFixed(2)} ({shopPct}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${shopPct}%` }}></div>
              </div>
            </div>

            {/* Bar & Cafeteria */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Bar & Cafeteria POS</span>
                <span>${(metrics.barRevenue || 0).toFixed(2)} ({barPct}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${barPct}%` }}></div>
              </div>
            </div>

            {/* Memberships */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Active Member Subscriptions</span>
                <span>${(metrics.membershipRevenue || 0).toFixed(2)} ({memPct}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${memPct}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Funnel & CRM Conversion */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" /> CRM Lead Funnel Conversion
            </h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {convRate}% Conversion Rate
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase">New Enquiries</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{newLeads}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Contacted Staff</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{contacted}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Trial Sessions Booked</div>
              <div className="text-2xl font-extrabold text-sky-600 mt-1">{trialBooked}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Converted Members</div>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">{converted}</div>
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Payment Method Breakdown & Corporate Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Payment Channels Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-extrabold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
            <span>Payment Channels Distribution</span>
            <CreditCard className="w-5 h-5 text-slate-400" />
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase">UPI / QR Code</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">${(paymentMethods.UPI || 0).toFixed(2)}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase">Card Swipe</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">${(paymentMethods.CARD || 0).toFixed(2)}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase">Cash at Counter</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">${(paymentMethods.CASH || 0).toFixed(2)}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase">Online Website Portal</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">${(paymentMethods.ONLINE || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Corporate Invoices & Outstanding Bills */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" /> Corporate Invoices & Receivables
            </h3>
            {metrics.totalOwed > 0 && (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                ${metrics.totalOwed.toFixed(2)} Outstanding
              </span>
            )}
          </div>

          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No corporate invoices found.</div>
            ) : (
              invoices.slice(0, 4).map(inv => (
                <div key={inv.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{inv.clientName}</div>
                    <div className="text-xs text-slate-400 font-mono">Invoice #{inv.invoiceNumber} &bull; Due: {inv.dueDate}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-slate-900 text-sm">${inv.amount.toFixed(2)}</div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                      inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Staff Shift Scheduling Operational Summary */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" /> Staff Roster Operations Overview
          </h3>
          {metrics.pendingLeaves > 0 && (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {metrics.pendingLeaves} Pending Leave Request(s)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {shifts.length === 0 ? (
            <div className="col-span-full text-xs text-slate-400 py-4 text-center">No shifts scheduled for this period.</div>
          ) : (
            shifts.slice(0, 6).map(s => (
              <div key={s.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{s.staffName}</div>
                  <div className="text-xs text-sky-600 font-semibold mt-0.5">{s.role}</div>
                  <div className="text-xs text-slate-400 mt-1">{s.date} ({s.startTime} - {s.endTime})</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  {s.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
