import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts';
import { 
  LayoutDashboard, TrendingUp, ShoppingBag, Coffee,
  Calendar, CreditCard, Download,
} from 'lucide-react';
import { downloadFinanceReportPDF } from '../utils/pdfGenerator';

export default function DashboardPage({ isEmbedded = false }) {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard(period);
  }, [period]);

  const fetchDashboard = async (selectedPeriod = 'all') => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/dashboard/metrics', { params: { period: selectedPeriod } });
      setData(res.data);
    } catch (err) {
      console.error('Error fetching owner metrics:', err);
      setData(null);
      setError(err.response?.data?.error || err.message || 'Unable to load executive metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={isEmbedded ? 'py-12 text-center text-slate-400' : 'max-w-[1500px] mx-auto px-4 py-16 text-center text-slate-400'}>
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold">Loading executive metrics...</p>
      </div>
    );
  }

  if (!data || !data.metrics) {
    return (
      <div className={isEmbedded ? 'py-12 text-center' : 'max-w-[1500px] mx-auto px-4 py-16 text-center'}>
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-6 rounded-3xl max-w-md mx-auto space-y-3">
          <p className="font-bold text-sm">Unable to Load Executive Metrics</p>
          <p className="text-xs text-rose-200/80">{error || 'Please ensure you are signed in as Club Owner with valid authorization.'}</p>
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

  const { metrics = {}, leadStats = {}, paymentMethods = {} } = data;

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
  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const revenueStreams = [
    { name: 'Court bookings', value: Number(metrics.courtRevenue || 0), color: '#0ea5e9' },
    { name: 'Gear shop', value: Number(metrics.shopRevenue || 0), color: '#a855f7' },
    { name: 'Bar & cafeteria', value: Number(metrics.barRevenue || 0), color: '#f59e0b' },
    { name: 'Memberships', value: Number(metrics.membershipRevenue || 0), color: '#10b981' }
  ];
  const paymentChannels = [
    { name: 'UPI / QR', value: Number(paymentMethods.UPI || 0), color: '#0ea5e9' },
    { name: 'Card', value: Number(paymentMethods.CARD || 0), color: '#a855f7' },
    { name: 'Cash', value: Number(paymentMethods.CASH || 0), color: '#f59e0b' },
    { name: 'Online', value: Number(paymentMethods.ONLINE || 0), color: '#10b981' }
  ];
  const leadFunnel = [
    { name: 'New', count: newLeads, color: '#0ea5e9' },
    { name: 'Contacted', count: contacted, color: '#f59e0b' },
    { name: 'Trial booked', count: trialBooked, color: '#a855f7' },
    { name: 'Converted', count: converted, color: '#84cc16' }
  ];
  const revenueTotal = revenueStreams.reduce((total, stream) => total + stream.value, 0);
  const paymentTotal = paymentChannels.reduce((total, channel) => total + channel.value, 0);

  return (
    <div className={isEmbedded ? 'w-full min-w-0 space-y-5' : 'max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 bg-zinc-950 text-zinc-100 min-h-screen'}>
      
      {/* Header & Period Selector */}
      <div className={isEmbedded ? 'owner-tab-actions flex flex-wrap items-center justify-end gap-3' : 'flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl'}>
        {!isEmbedded && <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <LayoutDashboard className="w-7 h-7 text-lime-400" /> Executive Analytics & Financial Control
          </h1>
          <p className="text-zinc-400 text-xs mt-1 font-medium">
            Consolidated real-time operational revenue across Courts, Gear Shop POS, Bar Cafeteria & Corporate Receivables.
          </p>
        </div>}

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* Time Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
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
                    ? 'bg-lime-400 text-zinc-950 font-black shadow-lg shadow-lime-400/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Download Finance PDF Button */}
          <button
            onClick={() => downloadFinanceReportPDF(data, period)}
            disabled={!data || !data.metrics}
            className="flex items-center gap-1.5 px-4 py-2 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-2xl text-xs font-black shadow-lg shadow-lime-400/20 transition active:scale-95 cursor-pointer"
            title="Download executive financial summary in PDF format"
          >
            <Download className="w-4 h-4" /> Download Finance PDF
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Combined Revenue */}
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-lime-400 uppercase tracking-wider">Total Revenue</span>
              <span className="px-2.5 py-0.5 bg-lime-400/10 text-lime-400 rounded-full text-[9px] font-black border border-lime-400/30">AGGREGATED</span>
            </div>
            <div className="text-3xl font-black mt-3 text-white">₹{totalRev.toFixed(2)}</div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-lime-400 font-bold border-t border-zinc-800/80 pt-3">
            <TrendingUp className="w-4 h-4" /> Direct & recurring cash inflow
          </div>
        </div>

        {/* Court Bookings */}
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Court Bookings</span>
              <div className="p-2.5 bg-sky-400/10 text-sky-400 rounded-2xl border border-sky-400/20"><Calendar className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-black text-white mt-2">₹{(metrics.courtRevenue || 0).toFixed(2)}</div>
          </div>
          <div className="text-xs text-zinc-400 mt-3 pt-2 border-t border-zinc-800 flex justify-between">
            <span>Share: <strong className="text-zinc-200">{courtPct}%</strong></span>
            <span className="text-sky-400 font-bold">{metrics.todayBookings || 0} bookings today</span>
          </div>
        </div>

        {/* Gear Shop POS */}
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Gear Shop POS</span>
              <div className="p-2.5 bg-purple-400/10 text-purple-400 rounded-2xl border border-purple-400/20"><ShoppingBag className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-black text-white mt-2">₹{(metrics.shopRevenue || 0).toFixed(2)}</div>
          </div>
          <div className="text-xs text-zinc-400 mt-3 pt-2 border-t border-zinc-800">
            Share: <strong className="text-zinc-200">{shopPct}%</strong> &bull; Counter & Online gear
          </div>
        </div>

        {/* Bar & Cafeteria */}
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Bar & Cafeteria</span>
              <div className="p-2.5 bg-amber-400/10 text-amber-400 rounded-2xl border border-amber-400/20"><Coffee className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-black text-white mt-2">₹{(metrics.barRevenue || 0).toFixed(2)}</div>
          </div>
          <div className="text-xs text-zinc-400 mt-3 pt-2 border-t border-zinc-800">
            Share: <strong className="text-zinc-200">{barPct}%</strong> &bull; Settled member tabs
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="bg-zinc-900 p-5 sm:p-6 rounded-3xl border border-zinc-800 shadow-2xl">
          <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-black text-white">Revenue mix</h3>
              <p className="text-xs text-zinc-400 mt-1">Share of revenue by business stream</p>
            </div>
            <span className="text-xs font-bold text-zinc-300">{formatCurrency(revenueTotal)}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(190px,0.9fr)_1.1fr] items-center gap-4">
            <div className="relative h-56 min-w-0">
              {revenueTotal > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={revenueStreams.filter(stream => stream.value > 0)} dataKey="value" nameKey="name" innerRadius={64} outerRadius={88} paddingAngle={3} stroke="none">
                        {revenueStreams.filter(stream => stream.value > 0).map(stream => <Cell key={stream.name} fill={stream.color} />)}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold uppercase text-zinc-500">Total</span>
                    <span className="text-base font-black text-zinc-900">{formatCurrency(revenueTotal)}</span>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-zinc-500">No revenue recorded for this period.</div>
              )}
            </div>
            <div className="space-y-3">
              {revenueStreams.map(stream => {
                const share = revenueTotal > 0 ? (stream.value / revenueTotal) * 100 : 0;
                return (
                  <div key={stream.name} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="w-2.5 h-2.5 shrink-0 rounded-sm" style={{ backgroundColor: stream.color }} />
                      <span className="truncate text-xs font-semibold text-zinc-700">{stream.name}</span>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="block text-xs font-bold text-zinc-900">{formatCurrency(stream.value)}</span>
                      <span className="text-[10px] text-zinc-500">{share.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-zinc-900 p-5 sm:p-6 rounded-3xl border border-zinc-800 shadow-2xl">
          <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-black text-white">Revenue by stream</h3>
              <p className="text-xs text-zinc-400 mt-1">Compare actual totals for the selected period</p>
            </div>
            <TrendingUp className="w-5 h-5 text-lime-500" />
          </div>
          <div className="h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueStreams} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={112} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={22}>
                  {revenueStreams.map(stream => <Cell key={stream.name} fill={stream.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-zinc-900 p-5 sm:p-6 rounded-3xl border border-zinc-800 shadow-2xl">
          <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-black text-white">Lead conversion funnel</h3>
              <p className="text-xs text-zinc-400 mt-1">Live lead counts by CRM status</p>
            </div>
            <span className="text-xs font-black text-lime-700 bg-lime-400/15 px-3 py-1 rounded-full">{convRate}% converted</span>
          </div>
          <div className="h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadFunnel} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [value, 'Leads']} cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={38}>
                  {leadFunnel.map(stage => <Cell key={stage.name} fill={stage.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-zinc-900 p-5 sm:p-6 rounded-3xl border border-zinc-800 shadow-2xl">
          <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-black text-white">Payment channel mix</h3>
              <p className="text-xs text-zinc-400 mt-1">Actual payment totals returned by the dashboard API</p>
            </div>
            <CreditCard className="w-5 h-5 text-sky-600" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(180px,0.85fr)_1.15fr] items-center gap-4">
            <div className="relative h-52 min-w-0">
              {paymentTotal > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentChannels.filter(channel => channel.value > 0)} dataKey="value" nameKey="name" innerRadius={56} outerRadius={80} paddingAngle={3} stroke="none">
                        {paymentChannels.filter(channel => channel.value > 0).map(channel => <Cell key={channel.name} fill={channel.color} />)}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Payments']} contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold uppercase text-zinc-500">Collected</span>
                    <span className="text-sm font-black text-zinc-900">{formatCurrency(paymentTotal)}</span>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-zinc-500">No payment data for this period.</div>
              )}
            </div>
            <div className="space-y-3">
              {paymentChannels.map(channel => (
                <div key={channel.name} className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: channel.color }} />
                    <span className="text-xs font-semibold text-zinc-700">{channel.name}</span>
                  </div>
                  <span className="text-xs font-bold text-zinc-900">{formatCurrency(channel.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}
