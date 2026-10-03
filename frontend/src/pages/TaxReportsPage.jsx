import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  BarChart3, TrendingUp, Download, Calendar, DollarSign,
  FileText, ArrowUpRight, ArrowDownRight, Percent, Building2, Layers, PieChart
} from 'lucide-react';
import { downloadFinanceReportPDF } from '../utils/pdfGenerator';

export default function TaxReportsPage() {
  const [revenueData, setRevenueData] = useState(null);
  const [taxData, setTaxData] = useState(null);
  const [exportData, setExportData] = useState(null);
  const [period, setPeriod] = useState('month');
  const [entryCategoryFilter, setEntryCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { fetchData(); }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [revRes, taxRes, expRes] = await Promise.all([
        api.get('/reports/revenue', { params: { period } }),
        api.get('/reports/tax', { params: { period } }),
        api.get('/reports/export', { params: { period } })
      ]);
      setRevenueData(revRes.data);
      setTaxData(taxRes.data);
      setExportData(expRes.data);
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

  // Compile individual line-item entries from export data
  const rawBookings = exportData?.data?.bookings || [];
  const rawShopTx = exportData?.data?.shopTransactions || [];
  const rawBarTabs = exportData?.data?.barTabs || [];
  const rawInvoices = exportData?.data?.invoices || [];

  const allEntries = [];

  // 1. Court Bookings
  rawBookings.forEach(b => {
    const gross = parseFloat(b.final_fee || 0);
    const tax = gross * 0.18;
    allEntries.push({
      id: `bk-${b.id}`,
      categoryKey: 'COURTS',
      categoryName: 'Court Bookings',
      description: `Court Booking - ${b.customer_name} (${b.booking_date})`,
      gross,
      tax,
      net: gross - tax
    });
  });

  // 2. Shop Transactions
  rawShopTx.forEach(s => {
    const gross = parseFloat(s.total_price || 0);
    const tax = gross * 0.18;
    allEntries.push({
      id: `shp-${s.id}`,
      categoryKey: 'SHOP',
      categoryName: 'Gear Shop Sales',
      description: `Shop Sale - POS ${s.channel || 'Counter'} (Qty: ${s.quantity})`,
      gross,
      tax,
      net: gross - tax
    });
  });

  // 3. Bar Tabs
  rawBarTabs.forEach(bt => {
    const gross = parseFloat(bt.final_amount || 0);
    const tax = gross * 0.05;
    allEntries.push({
      id: `bar-${bt.id}`,
      categoryKey: 'BAR',
      categoryName: 'Bar & Cafeteria',
      description: `Bar Order - ${bt.tab_number} (${bt.customer_name || 'Guest'})`,
      gross,
      tax,
      net: gross - tax
    });
  });

  // 4. Invoices
  rawInvoices.forEach(inv => {
    const gross = parseFloat(inv.amount || 0);
    const tax = gross * 0.18;
    allEntries.push({
      id: `inv-${inv.id}`,
      categoryKey: 'INVOICES',
      categoryName: 'Client Invoices',
      description: `Invoice ${inv.invoice_number} - ${inv.client_name}`,
      gross,
      tax,
      net: gross - tax
    });
  });

  const filteredEntries = entryCategoryFilter === 'ALL'
    ? allEntries
    : allEntries.filter(e => e.categoryKey === entryCategoryFilter);

  const entriesGrossTotal = filteredEntries.reduce((sum, e) => sum + e.gross, 0);
  const entriesTaxTotal = filteredEntries.reduce((sum, e) => sum + e.tax, 0);
  const entriesNetTotal = filteredEntries.reduce((sum, e) => sum + e.net, 0);

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
          <button onClick={handleExportPDF} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
            title="Download complete financial & tax statement in PDF format">
            <Download className="w-3.5 h-3.5" /> {exporting ? 'Generating PDF...' : 'Download Finance PDF'}
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
              bar: { name: 'Bar & CafÃ©', color: 'amber', icon: <DollarSign className="w-4 h-4" /> },
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

      {/* Tax Liability Breakdown Table (Without Tax Rate column) */}
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

      {/* Revenue Distribution Pie Chart */}
      {revenueData && revenueData.totalRevenue > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-sky-600" /> Revenue Distribution Pie Chart
          </h3>

          {(() => {
            let accumulatedDash = 0;
            const total = revenueData.totalRevenue || 1;
            const CIRCUMFERENCE = 226.195; // 2 * PI * 36

            const categoriesList = [
              { key: 'courts', name: 'Court Bookings', value: revenueData.breakdown.courts?.revenue || 0, color: '#0284c7', bgClass: 'bg-sky-500' },
              { key: 'shop', name: 'Gear Shop', value: revenueData.breakdown.shop?.revenue || 0, color: '#6366f1', bgClass: 'bg-indigo-500' },
              { key: 'bar', name: 'Bar & CafÃ©', value: revenueData.breakdown.bar?.revenue || 0, color: '#f59e0b', bgClass: 'bg-amber-500' },
              { key: 'memberships', name: 'Memberships', value: revenueData.breakdown.memberships?.revenue || 0, color: '#10b981', bgClass: 'bg-emerald-500' },
              { key: 'invoices', name: 'Client Invoices', value: revenueData.breakdown.invoices?.revenue || 0, color: '#8b5cf6', bgClass: 'bg-violet-500' },
            ];

            return (
              <div className="flex flex-col md:flex-row items-center justify-around gap-8 py-4">
                {/* SVG Pie / Donut Chart */}
                <div className="relative w-56 h-56 flex-shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="36" fill="transparent" stroke="#f1f5f9" strokeWidth="14" />
                    {categoriesList.map((cat) => {
                      const pct = cat.value / total;
                      const strokeDasharray = `${(pct * CIRCUMFERENCE).toFixed(3)} ${CIRCUMFERENCE}`;
                      const strokeDashoffset = (-accumulatedDash).toFixed(3);
                      accumulatedDash += pct * CIRCUMFERENCE;

                      if (cat.value <= 0) return null;

                      return (
                        <circle
                          key={cat.key}
                          cx="50"
                          cy="50"
                          r="36"
                          fill="transparent"
                          stroke={cat.color}
                          strokeWidth="14"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                        />
                      );
                    })}
                  </svg>

                  {/* Center Revenue Total Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                    <span className="text-xl font-extrabold text-slate-900">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Pie Chart Category Legend */}
                <div className="flex-1 space-y-2.5 w-full">
                  {categoriesList.map((cat) => {
                    const pct = total > 0 ? (cat.value / total) * 100 : 0;
                    return (
                      <div
                        key={cat.key}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/80 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-3.5 h-3.5 rounded-full ${cat.bgClass} shadow-xs flex-shrink-0`} />
                          <span className="font-semibold text-slate-800 text-xs">{cat.name}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-slate-900 text-xs">${cat.value.toFixed(2)}</span>
                          <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full min-w-[48px] text-center">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Itemized Transactions Table at Bottom of Page (In exact format without Tax Rate) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" /> Itemized Transactions & Entry Breakdown
          </h3>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Entries' },
              { id: 'COURTS', label: 'Court Bookings' },
              { id: 'SHOP', label: 'Gear Shop' },
              { id: 'BAR', label: 'Bar POS' },
              { id: 'INVOICES', label: 'Invoices' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setEntryCategoryFilter(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  entryCategoryFilter === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredEntries.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 italic">
              No individual entries found for period: <strong>{period}</strong>.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue Category / Entry</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Revenue</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tax Amount</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredEntries.map((entry, idx) => (
                  <tr key={entry.id || idx} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900 text-sm">{entry.description}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{entry.categoryName}</div>
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-slate-900 text-sm">
                      ${entry.gross.toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="text-rose-600 font-bold text-sm flex items-center justify-end gap-1">
                        <ArrowDownRight className="w-3 h-3" /> ${entry.tax.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="text-emerald-600 font-bold text-sm flex items-center justify-end gap-1">
                        <ArrowUpRight className="w-3 h-3" /> ${entry.net.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white">
                  <td className="px-6 py-4 font-extrabold text-sm">TOTALS ({filteredEntries.length} ENTRIES)</td>
                  <td className="px-6 py-4 text-right font-extrabold text-sm">${entriesGrossTotal.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-rose-300 font-extrabold text-sm">${entriesTaxTotal.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-emerald-300 font-extrabold text-sm">${entriesNetTotal.toFixed(2)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
