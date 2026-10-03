import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  BarChart3, TrendingUp, Download, Calendar, DollarSign,
  FileText, ArrowUpRight, ArrowDownRight, Percent, Building2
} from 'lucide-react';
import { downloadFinanceReportPDF } from '../utils/pdfGenerator';

export default function TaxReportsPage() {
  const [revenueData, setRevenueData] = useState(null);
  const [taxData, setTaxData] = useState(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { fetchData(); }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [revRes, taxRes] = await Promise.all([
        api.get('/reports/revenue', { params: { period } }),
        api.get('/reports/tax', { params: { period } })
      ]);
      setRevenueData(revRes.data);
      setTaxData(taxRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const res = await api.get('/reports/export', { params: { period } });
      const rev = revenueData?.totalRevenue || 0;
      const b = revenueData?.breakdown || {};
      downloadFinanceReportPDF({
        metrics: {
          totalEarned: rev,
          courtRevenue: b.courts || 0,
          shopRevenue: b.shop || 0,
          barRevenue: b.bar || 0,
          membershipRevenue: b.memberships || 0,
          totalOwed: 0,
          totalMembersCount: 4,
          activeMembersCount: 4
        },
        invoices: res.data?.invoices || []
      }, period);
    } catch (err) { 
      console.error(err);
      alert('Failed to export finance PDF.'); 
    } finally { 
      setExporting(false); 
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-zinc-400">
        <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold">Loading financial reports...</p>
      </div>
    );
  }

  if (!revenueData || !taxData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-6 rounded-3xl max-w-md mx-auto space-y-3">
          <p className="font-bold text-sm">Unable to Load Reports Data</p>
          <p className="text-xs text-rose-200/80">Check network connection or server endpoint permissions.</p>
          <button onClick={fetchData} className="px-4 py-2 bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition">
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <BarChart3 className="w-8 h-8 text-lime-400" /> Tax Reports & Financial Analytics
          </h1>
          <p className="text-zinc-400 text-sm mt-1 font-medium">
            Review revenue streams, tax liabilities, and export financial data for compliance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector */}
          <div className="bg-zinc-900 p-1.5 rounded-2xl flex gap-1 border border-zinc-800 shadow-xl">
            {[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'quarter', label: 'Quarter' },
              { value: 'all', label: 'All Time' },
            ].map(p => (
              <button key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition ${
                  period === p.value ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20' : 'text-zinc-400 hover:text-white'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={handleExportPDF} disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-2xl text-xs font-black shadow-lg shadow-lime-400/20 transition-all disabled:opacity-50 cursor-pointer"
            title="Download complete financial & tax statement in PDF format">
            <Download className="w-4 h-4" /> {exporting ? 'Generating PDF...' : 'Download Finance PDF'}
          </button>
        </div>
      </div>

      {/* Revenue Overview Cards */}
      {revenueData && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-zinc-900 text-white p-5 rounded-3xl border border-zinc-800 shadow-2xl col-span-2 lg:col-span-1">
            <div className="text-[10px] font-bold text-lime-400 uppercase tracking-wider">Total Revenue</div>
            <div className="text-2xl font-black mt-1">${revenueData.totalRevenue.toFixed(2)}</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-lime-400 font-bold">
              <TrendingUp className="w-3.5 h-3.5" /> {period === 'all' ? 'All time' : `This ${period}`}
            </div>
          </div>

          {Object.entries(revenueData.breakdown).map(([key, val]) => {
            const labels = {
              courts: { name: 'Court Bookings', icon: <Calendar className="w-4 h-4 text-sky-400" /> },
              shop: { name: 'Gear Shop', icon: <Building2 className="w-4 h-4 text-purple-400" /> },
              bar: { name: 'Bar & Café', icon: <DollarSign className="w-4 h-4 text-amber-400" /> },
              memberships: { name: 'Memberships', icon: <FileText className="w-4 h-4 text-lime-400" /> },
              invoices: { name: 'Invoices', icon: <FileText className="w-4 h-4 text-indigo-400" /> },
            };
            const cfg = labels[key] || { name: key, icon: null };
            return (
              <div key={key} className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-2xl">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{cfg.name}</span>
                  <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800">{cfg.icon}</div>
                </div>
                <div className="text-xl font-black text-white mt-1">${val.revenue.toFixed(2)}</div>
                <div className="text-[10px] text-zinc-500 mt-1">{val.transactions || val.members || val.paid || 0} items</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tax Liability Table */}
      {taxData && (
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden mb-8">
          <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Percent className="w-5 h-5 text-lime-400" /> Tax Liability Breakdown
            </h3>
            <span className="text-xs text-zinc-400 font-medium">Period: {period}</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  <th className="px-6 py-3.5 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Revenue Category</th>
                  <th className="px-6 py-3.5 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Gross Revenue</th>
                  <th className="px-6 py-3.5 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tax Rate</th>
                  <th className="px-6 py-3.5 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tax Amount</th>
                  <th className="px-6 py-3.5 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Net Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {taxData.categories.map((cat, i) => (
                  <tr key={i} className="hover:bg-zinc-800/40 transition">
                    <td className="px-6 py-4">
                      <span className="font-bold text-white text-sm">{cat.name}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-white text-sm">${cat.grossRevenue.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="bg-zinc-800/80 text-zinc-300 px-2.5 py-1 rounded-lg text-xs font-bold border border-zinc-800">{cat.taxRate}%</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-rose-400 font-black text-sm flex items-center justify-end gap-1">
                        <ArrowDownRight className="w-3.5 h-3.5" /> ${cat.taxAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-lime-400 font-black text-sm flex items-center justify-end gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" /> ${cat.netRevenue.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-zinc-800/80 text-white border-t border-zinc-800">
                  <td className="px-6 py-4 font-black text-sm">TOTALS</td>
                  <td className="px-6 py-4 text-right font-black text-sm">${taxData.totalGrossRevenue.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-xs text-zinc-500">—</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-rose-400 font-black text-sm">${taxData.totalTaxLiability.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-lime-400 font-black text-base">${taxData.totalNetRevenue.toFixed(2)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Revenue Distribution Visual */}
      {revenueData && revenueData.totalRevenue > 0 && (
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-lime-400" /> Revenue Distribution
          </h3>
          <div className="space-y-4">
            {Object.entries(revenueData.breakdown).map(([key, val]) => {
              const pct = revenueData.totalRevenue > 0 ? (val.revenue / revenueData.totalRevenue * 100) : 0;
              const colors = {
                courts: 'bg-sky-400',
                shop: 'bg-purple-400',
                bar: 'bg-amber-400',
                memberships: 'bg-lime-400',
                invoices: 'bg-indigo-400',
              };
              const names = {
                courts: 'Court Bookings',
                shop: 'Gear Shop',
                bar: 'Bar & Café',
                memberships: 'Memberships',
                invoices: 'Client Invoices',
              };
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-zinc-300">{names[key] || key}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">${val.revenue.toFixed(2)}</span>
                      <span className="text-[10px] text-zinc-500 font-mono font-bold">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-3 border border-zinc-800/80 p-0.5">
                    <div
                      className={`h-2 rounded-full ${colors[key] || 'bg-zinc-500'} transition-all duration-700`}
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
