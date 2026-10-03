import React, { useState, useEffect } from 'react';
import api from '../api';
import { LayoutDashboard, DollarSign, TrendingUp, ShoppingBag, Coffee, Calendar, CreditCard, Users, FileText, Clock, Shield } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/metrics');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        Loading executive metrics...
      </div>
    );
  }

  const { metrics, paymentMethods, invoices, shifts } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-7 h-7 text-sky-600" /> Owner Executive Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            End-of-month consolidated revenue breakdown across Courts, Gear Shop, Bar, and Corporate Client Invoices.
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">Total Combined Revenue</div>
          <div className="text-3xl font-extrabold mt-2 text-white">${metrics.totalEarned.toFixed(2)}</div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <TrendingUp className="w-4 h-4" /> All revenue sources aggregated
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Court Bookings</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl"><Calendar className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">${metrics.courtRevenue.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-2">Tennis, Cricket, Padel</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gear Shop POS</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><ShoppingBag className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">${metrics.shopRevenue.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-2">Counter & Sofa Orders</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bar & Cafeteria</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Coffee className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">${metrics.barRevenue.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-2">Tabs & Food Orders</div>
        </div>

      </div>

      {/* Grid: Payment Method Breakdown & Corporate Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Payment Methods Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
            <span>Payment Channels Distribution</span>
            <CreditCard className="w-5 h-5 text-slate-400" />
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase">UPI / QR Payment</div>
              <div className="text-xl font-bold text-slate-900 mt-1">${(paymentMethods.UPI || 0).toFixed(2)}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase">Card Swipe</div>
              <div className="text-xl font-bold text-slate-900 mt-1">${(paymentMethods.CARD || 0).toFixed(2)}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase">Cash at Counter</div>
              <div className="text-xl font-bold text-slate-900 mt-1">${(paymentMethods.CASH || 0).toFixed(2)}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase">Online Portal</div>
              <div className="text-xl font-bold text-slate-900 mt-1">${(paymentMethods.ONLINE || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Corporate Invoices & Outstanding Bills */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
            <span>Corporate Invoices & Client Receivables</span>
            <FileText className="w-5 h-5 text-slate-400" />
          </h3>

          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No corporate invoices issued.</div>
            ) : (
              invoices.map(inv => (
                <div key={inv.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{inv.clientName}</div>
                    <div className="text-xs text-slate-400 font-mono">Invoice #{inv.invoiceNumber} | Due: {inv.dueDate}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-slate-900 text-sm">${inv.amount.toFixed(2)}</div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Staff Shift Scheduling */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
          <span>Staff Shift Schedules & Operations</span>
          <Clock className="w-5 h-5 text-slate-400" />
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {shifts.map(s => (
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
          ))}
        </div>
      </div>

    </div>
  );
}
