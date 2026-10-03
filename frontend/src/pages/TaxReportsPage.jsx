import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  BarChart3, TrendingUp, Download, Calendar, DollarSign,
  FileText, ArrowUpRight, ArrowDownRight, Percent, Building2
} from 'lucide-react';

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

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await api.get('/reports/export', { params: { period } });
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clubora-report-${period}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { alert('Failed to export.'); }
    finally { setExporting(false); }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-600" /> Tax Reports & Financial Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Review revenue streams, tax liabilities, and export financial data for compliance.
          </p>
        </div>
        <div className="flex gap-3">
          {/* Period Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
            {[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'quarter', label: 'Quarter' },
              { value: 'all', label: 'All Time' },
            ].map(p => (
              <button key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  period === p.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50">
            <Download className="w-3.5 h-3.5" /> {exporting ? 'Exporting...' : 'Export Data'}
          </button>
        </div>
      </div>

      {/* Revenue Overview Cards */}
      {revenueData && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg col-span-2 lg:col-span-1">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Total Revenue</div>
            <div className="text-2xl font-extrabold mt-1">${revenueData.totalRevenue.toFixed(2)}</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-400">
              <TrendingUp className="w-3 h-3" /> {period === 'all' ? 'All time' : `This ${period}`}
            </div>
          </div>

          {Object.entries(revenueData.breakdown).map(([key, val]) => {
            const labels = {
              courts: { name: 'Court Bookings', color: 'sky', icon: <Calendar className="w-4 h-4" /> },
              shop: { name: 'Gear Shop', color: 'indigo', icon: <Building2 className="w-4 h-4" /> },
              bar: { name: 'Bar & Café', color: 'amber', icon: <DollarSign className="w-4 h-4" /> },
              memberships: { name: 'Memberships', color: 'emerald', icon: <FileText className="w-4 h-4" /> },
              invoices: { name: 'Invoices', color: 'violet', icon: <FileText className="w-4 h-4" /> },
            };
            const cfg = labels[key] || { name: key, color: 'slate', icon: null };
            return (
              <div key={key} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-bold text-${cfg.color}-500 uppercase tracking-wider`}>{cfg.name}</span>
                  <div className={`p-1.5 bg-${cfg.color}-50 text-${cfg.color}-600 rounded-lg`}>{cfg.icon}</div>
                </div>
                <div className="text-lg font-bold text-slate-900 mt-1">${val.revenue.toFixed(2)}</div>
                <div className="text-[10px] text-slate-400 mt-1">{val.transactions || val.members || val.paid || 0} items</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tax Liability Table */}
      {taxData && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Percent className="w-5 h-5 text-emerald-600" /> Tax Liability Breakdown
            </h3>
            <span className="text-xs text-slate-500 font-medium">Period: {period}</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue Category</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Revenue</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tax Rate</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tax Amount</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {taxData.categories.map((cat, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-3.5">
                      <span className="font-semibold text-slate-900 text-sm">{cat.name}</span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-slate-900 text-sm">${cat.grossRevenue.toFixed(2)}</td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-xs font-bold">{cat.taxRate}%</span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="text-rose-600 font-bold text-sm flex items-center justify-end gap-1">
                        <ArrowDownRight className="w-3 h-3" /> ${cat.taxAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="text-emerald-600 font-bold text-sm flex items-center justify-end gap-1">
                        <ArrowUpRight className="w-3 h-3" /> ${cat.netRevenue.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white">
                  <td className="px-6 py-4 font-extrabold text-sm">TOTALS</td>
                  <td className="px-6 py-4 text-right font-extrabold text-sm">${taxData.totalGrossRevenue.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-xs text-slate-400">—</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-rose-300 font-extrabold text-sm">${taxData.totalTaxLiability.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-emerald-300 font-extrabold text-sm">${taxData.totalNetRevenue.toFixed(2)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Revenue Distribution Visual */}
      {revenueData && revenueData.totalRevenue > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" /> Revenue Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(revenueData.breakdown).map(([key, val]) => {
              const pct = revenueData.totalRevenue > 0 ? (val.revenue / revenueData.totalRevenue * 100) : 0;
              const colors = {
                courts: 'bg-sky-500',
                shop: 'bg-indigo-500',
                bar: 'bg-amber-500',
                memberships: 'bg-emerald-500',
                invoices: 'bg-violet-500',
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
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">{names[key] || key}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">${val.revenue.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${colors[key] || 'bg-slate-400'} transition-all duration-700`}
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
