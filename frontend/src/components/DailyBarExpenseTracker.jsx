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

export default function DailyBarExpenseTracker({ userRole, isEmbedded = false }) {
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
    <div className={isEmbedded ? 'space-y-5 text-white' : 'space-y-6 text-white'}>
      
      {/* Header Banner */}
      <div className={isEmbedded ? 'owner-tab-actions flex justify-end' : 'bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md'}>
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${isEmbedded ? 'md:justify-end' : ''}`}>
          {!isEmbedded && <div>
            <div className="flex items-center gap-2">
              <Coffee className="w-5 h-5 text-lime-400" />
              <span className="text-xs font-bold text-lime-400 uppercase tracking-wider">Per Day Bar Expenses & Dynamic Profitability</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">Daily Bar Expense Tracker</h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl font-medium">
              Real-time daily bar & cafeteria operational costs, ingredient restocks, settled sales revenue, and live net profit margin calculation.
            </p>
          </div>}

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setExpenseDate(selectedDate);
                setShowAddForm(!showAddForm);
              }}
              className="px-5 py-2.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black text-xs rounded-xl shadow-lg shadow-lime-400/20 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'Close Form' : 'Log Daily Bar Expense'}</span>
            </button>

            <button
              onClick={fetchBarExpenses}
              className="p-2.5 bg-zinc-955 hover:bg-zinc-800 text-zinc-300 rounded-xl transition border border-zinc-800 cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-lime-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback.msg && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
          feedback.type === 'error' 
            ? 'bg-rose-950/80 border-rose-800 text-rose-200' 
            : 'bg-lime-400/10 border-lime-400/20 text-lime-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedback.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-lime-400" />}
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback({ type: '', msg: '' })} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Add Expense Form Card */}
      {showAddForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-lime-400" /> Record New Bar Expense
            </h3>
            <span className="text-[11px] text-zinc-400">Target Date: <strong className="text-white">{expenseDate}</strong></span>
          </div>

          <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Expense Title / Item</label>
              <input
                type="text"
                required
                placeholder="e.g. Fresh Fruit & Berries Restock"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-lime-400"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Amount (₹)</label>
              <div className="relative">
                <span className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5 font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-lime-400 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-lime-400 font-mono font-black"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-lime-400"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Expense Date</label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-lime-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Notes / Invoice Reference</label>
              <input
                type="text"
                placeholder="Optional supplier name or receipt details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-lime-400"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black rounded-xl shadow-lg shadow-lime-400/20 text-xs transition"
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
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-1 shadow-2xl">
          <div className="flex justify-between items-center text-zinc-400 text-xs font-semibold">
            <span>Today's Bar Sales</span>
            <TrendingUp className="w-4 h-4 text-lime-400" />
          </div>
          <div className="text-2xl font-black text-lime-400 font-mono">
            ₹{todaySalesRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-zinc-500 font-medium">Live Settled Bar Tabs</div>
        </div>

        {/* Today's Expense Total */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-1 shadow-2xl">
          <div className="flex justify-between items-center text-zinc-400 text-xs font-semibold">
            <span>Today's Bar Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            ₹{todayTotalExpense.toFixed(2)}
          </div>
          <div className="text-[11px] text-zinc-500 font-medium">Logged Operating Costs</div>
        </div>

        {/* Today's Dynamic Net Margin */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-1 shadow-2xl">
          <div className="flex justify-between items-center text-zinc-400 text-xs font-semibold">
            <span>Today's Net Profit</span>
            {todayNetProfit >= 0 ? <TrendingUp className="w-4 h-4 text-lime-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
          </div>
          <div className={`text-2xl font-black font-mono ${todayNetProfit >= 0 ? 'text-lime-400' : 'text-rose-400'}`}>
            ₹{todayNetProfit.toFixed(2)}
          </div>
          <div className="text-[11px] text-zinc-500 font-medium">Sales - Expenses</div>
        </div>

        {/* Selected Date Expense Total */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl space-y-1 shadow-2xl">
          <div className="flex justify-between items-center text-zinc-400 text-xs font-semibold">
            <span>Date Expenses ({selectedDate})</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            ₹{selectedDateTotal.toFixed(2)}
          </div>
          <div className="text-[11px] text-zinc-500 font-medium">{expenses.length} item(s) logged</div>
        </div>

      </div>

      {/* Filter Toolbar */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xl">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-lime-400 flex-shrink-0" />
          <span className="font-bold text-zinc-300">Filter By Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:ring-1 focus:ring-lime-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setSelectedDate(getTodayStr())}
            className={`px-4 py-2 rounded-xl font-black transition border ${
              selectedDate === getTodayStr()
                ? 'bg-lime-400 text-zinc-950 border-lime-400 shadow-md shadow-lime-400/20'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
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
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-xl font-bold transition"
          >
            Yesterday
          </button>
        </div>
      </div>

      {/* Detailed Expenses Table for Selected Date */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Bar Expenses for {selectedDate}</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-medium">Line items recorded by bar staff or management</p>
          </div>

          <span className="text-xs font-mono font-black text-lime-400 bg-lime-400/10 px-3 py-1.5 rounded-xl border border-lime-400/20">
            Total: ${selectedDateTotal.toFixed(2)}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400 space-y-2">
            <div className="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>Loading expenses data...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 space-y-2 italic">
            <Coffee className="w-8 h-8 text-zinc-600 mx-auto" />
            <p>No bar expenses recorded for {selectedDate}.</p>
            <button
              onClick={() => {
                setExpenseDate(selectedDate);
                setShowAddForm(true);
              }}
              className="mt-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-lime-400 font-bold rounded-xl border border-zinc-700"
            >
              + Add Expense for {selectedDate}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3.5">Expense Item / Title</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Logged By</th>
                  <th className="px-4 py-3.5">Notes</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-zinc-800/40 transition">
                    <td className="px-4 py-4 font-bold text-white">
                      {exp.title}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.Other}`}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-zinc-400 font-medium">
                      {exp.createdBy || 'Bar Staff'}
                    </td>
                    <td className="px-4 py-4 text-zinc-400 max-w-xs truncate">
                      {exp.notes || '-'}
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-black text-rose-400 text-sm">
                      ₹{parseFloat(exp.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Per-Day History Summary Breakdown Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-lime-400" /> Per-Day Expense History Summary
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-medium">Aggregated daily totals across recorded dates</p>
          </div>
        </div>

        {perDaySummary.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500 italic">No historical expense summaries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Logged Items</th>
                  <th className="px-4 py-3.5 text-right">Bar Sales Revenue</th>
                  <th className="px-4 py-3.5 text-right">Total Expenses</th>
                  <th className="px-4 py-3.5 text-right">Net Profit / Loss</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {perDaySummary.map((row) => (
                  <tr key={row.expenseDate} className={`hover:bg-zinc-800/40 transition ${row.expenseDate === selectedDate ? 'bg-lime-400/5' : ''}`}>
                    <td className="px-4 py-4 font-bold text-white">
                      {row.expenseDate}
                      {row.expenseDate === getTodayStr() && (
                        <span className="ml-2 text-[10px] bg-lime-400/20 text-lime-300 px-2.5 py-0.5 rounded-full font-black border border-lime-400/30">TODAY</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-zinc-400 font-medium">
                      {row.itemCount} item(s)
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-black text-lime-400 text-sm">
                      ₹{parseFloat(row.salesRevenue || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-black text-rose-400 text-sm">
                      ₹{parseFloat(row.totalExpense || 0).toFixed(2)}
                    </td>
                    <td className={`px-4 py-4 text-right font-mono font-black text-sm ${
                      (row.netProfit || 0) >= 0 ? 'text-lime-400' : 'text-rose-400'
                    }`}>
                      ₹{parseFloat(row.netProfit || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => setSelectedDate(row.expenseDate)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                          row.expenseDate === selectedDate
                            ? 'bg-lime-400 text-zinc-950 border-lime-400 font-black shadow-md shadow-lime-400/20'
                            : 'bg-zinc-800 text-lime-400 border-zinc-700 hover:bg-zinc-700'
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
