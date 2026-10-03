import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Coffee, DollarSign, Plus, Trash2, Calendar, Tag, FileText, 
  TrendingDown, TrendingUp, AlertCircle, CheckCircle2, RefreshCw
} from 'lucide-react';

const CATEGORIES = [
  'Ingredients',
  'Beverages',
  'Supplies',
  'Equipment',
  'Utilities',
  'Other'
];

const CATEGORY_COLORS = {
  Ingredients: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Beverages: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  Supplies: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  Equipment: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  Utilities: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Other: 'bg-slate-500/10 text-slate-400 border-slate-500/30'
};

export default function DailyBarExpenseTracker({ userRole }) {
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [expenses, setExpenses] = useState([]);
  const [perDaySummary, setPerDaySummary] = useState([]);
  const [todayTotalExpense, setTodayTotalExpense] = useState(0);
  const [todaySalesRevenue, setTodaySalesRevenue] = useState(0);
  const [todayNetProfit, setTodayNetProfit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', msg: '' });

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Ingredients');
  const [expenseDate, setExpenseDate] = useState(getTodayStr());
  const [notes, setNotes] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchBarExpenses();
  }, [selectedDate]);

  const fetchBarExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bar/expenses?date=${selectedDate}`);
      setExpenses(res.data.expenses || []);
      setPerDaySummary(res.data.perDaySummary || []);
      setTodayTotalExpense(res.data.todayTotalExpense || 0);
      setTodaySalesRevenue(res.data.todaySalesRevenue || 0);
      setTodayNetProfit(res.data.todayNetProfit || 0);
    } catch (err) {
      console.error('Failed to load bar expenses:', err);
      setFeedback({ type: 'error', msg: 'Failed to load bar expenses.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', msg: '' });

    if (!title.trim() || !amount) {
      setFeedback({ type: 'error', msg: 'Please enter expense title and valid amount.' });
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFeedback({ type: 'error', msg: 'Expense amount must be a positive number.' });
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/bar/expenses', {
        title: title.trim(),
        amount: numAmount,
        category,
        expenseDate: expenseDate || selectedDate,
        notes
      });

      setFeedback({ type: 'success', msg: 'Bar expense recorded successfully!' });
      setTitle('');
      setAmount('');
      setNotes('');
      setShowAddForm(false);
      fetchBarExpenses();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.error || 'Failed to record bar expense.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bar expense record?')) return;
    try {
      await api.delete(`/bar/expenses/${id}`);
      setFeedback({ type: 'success', msg: 'Bar expense record deleted.' });
      fetchBarExpenses();
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.error || 'Failed to delete expense.' });
    }
  };

  // Calculate totals for selected date
  const selectedDateTotal = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Per Day Bar Expenses & Dynamic Profitability</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-1">Daily Bar Expense Tracker</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Real-time daily bar & cafeteria operational costs, ingredient restocks, settled sales revenue, and live net profit margin calculation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {userRole !== 'MEMBER' && (
              <button
                onClick={() => {
                  setExpenseDate(selectedDate);
                  setShowAddForm(!showAddForm);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddForm ? 'Close Form' : 'Log Daily Bar Expense'}</span>
              </button>
            )}

            <button
              onClick={fetchBarExpenses}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback.msg && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
          feedback.type === 'error' 
            ? 'bg-rose-950/80 border-rose-800 text-rose-200' 
            : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedback.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback({ type: '', msg: '' })} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Add Expense Form Card */}
      {showAddForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" /> Record New Bar Expense
            </h3>
            <span className="text-[11px] text-slate-400">Target Date: <strong>{expenseDate}</strong></span>
          </div>

          <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Expense Title / Item</label>
              <input
                type="text"
                required
                placeholder="e.g. Fresh Fruit & Berries Restock"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Amount ($ / ₹)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Expense Date</label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">Notes / Invoice Reference</label>
              <input
                type="text"
                placeholder="Optional supplier name or receipt details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl shadow-lg transition"
              >
                {submitting ? 'Saving...' : 'Save Bar Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dynamic Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        {/* Today's Settled Sales Revenue */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Today's Bar Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            ${todaySalesRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500">Live Settled Bar Tabs</div>
        </div>

        {/* Today's Expense Total */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Today's Bar Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono">
            ${todayTotalExpense.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500">Logged Operating Costs</div>
        </div>

        {/* Today's Dynamic Net Margin */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Today's Net Profit</span>
            {todayNetProfit >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
          </div>
          <div className={`text-2xl font-extrabold font-mono ${todayNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${todayNetProfit.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500">Sales - Expenses</div>
        </div>

        {/* Selected Date Expense Total */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>Date Expenses ({selectedDate})</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">
            ${selectedDateTotal.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500">{expenses.length} item(s) logged</div>
        </div>

      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="font-bold text-slate-300">Filter By Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setSelectedDate(getTodayStr())}
            className={`px-3 py-1.5 rounded-xl font-bold transition border ${
              selectedDate === getTodayStr()
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            Today
          </button>
          
          <button
            onClick={() => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              setSelectedDate(yesterday.toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl font-bold transition"
          >
            Yesterday
          </button>
        </div>
      </div>

      {/* Detailed Expenses Table for Selected Date */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Bar Expenses for {selectedDate}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Line items recorded by bar staff or management</p>
          </div>

          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
            Total: ${selectedDateTotal.toFixed(2)}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>Loading expenses data...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2 italic">
            <Coffee className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No bar expenses recorded for {selectedDate}.</p>
            <button
              onClick={() => {
                setExpenseDate(selectedDate);
                setShowAddForm(true);
              }}
              className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl border border-slate-700"
            >
              + Add Expense for {selectedDate}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Expense Item / Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Logged By</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  {userRole !== 'MEMBER' && <th className="px-4 py-3 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-850/50 transition">
                    <td className="px-4 py-3.5 font-bold text-white">
                      {exp.title}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.Other}`}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {exp.createdBy || 'Bar Staff'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 max-w-xs truncate">
                      {exp.notes || '-'}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-400 text-sm">
                      ${parseFloat(exp.amount).toFixed(2)}
                    </td>
                    {userRole !== 'MEMBER' && (
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                          title="Delete record"
                          >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Per-Day History Summary Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" /> Per-Day Expense History Summary
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Aggregated daily totals across recorded dates</p>
          </div>
        </div>

        {perDaySummary.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 italic">No historical expense summaries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Logged Items</th>
                  <th className="px-4 py-3 text-right">Bar Sales Revenue</th>
                  <th className="px-4 py-3 text-right">Total Expenses</th>
                  <th className="px-4 py-3 text-right">Net Profit / Loss</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {perDaySummary.map((row) => (
                  <tr key={row.expenseDate} className={`hover:bg-slate-850/50 transition ${row.expenseDate === selectedDate ? 'bg-amber-500/5' : ''}`}>
                    <td className="px-4 py-3.5 font-bold text-white">
                      {row.expenseDate}
                      {row.expenseDate === getTodayStr() && (
                        <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-extrabold">TODAY</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {row.itemCount} item(s)
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400 text-sm">
                      ${parseFloat(row.salesRevenue || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-400 text-sm">
                      ${parseFloat(row.totalExpense || 0).toFixed(2)}
                    </td>
                    <td className={`px-4 py-3.5 text-right font-mono font-bold text-sm ${
                      (row.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      ${parseFloat(row.netProfit || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedDate(row.expenseDate)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                          row.expenseDate === selectedDate
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {row.expenseDate === selectedDate ? 'Viewing' : 'Select'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
