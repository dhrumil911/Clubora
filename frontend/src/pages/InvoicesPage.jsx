import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  FileText, Plus, DollarSign, AlertTriangle, CheckCircle2, Clock,
  Send, X, Filter, CreditCard, Building2, Search
} from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    clientName: '', clientEmail: '', type: 'CORPORATE',
    amount: '', dueDate: '', notes: ''
  });

  useEffect(() => { fetchData(); }, [filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? { status: filterStatus } : {};
      const [invRes, sumRes] = await Promise.all([
        api.get('/invoices', { params }),
        api.get('/invoices/summary')
      ]);
      setInvoices(invRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/invoices', createForm);
      setShowCreateModal(false);
      setCreateForm({ clientName: '', clientEmail: '', type: 'CORPORATE', amount: '', dueDate: '', notes: '' });
      fetchData();
    } catch (err) {
      alert('Failed to create invoice.');
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await api.put(`/invoices/${id}/pay`);
      fetchData();
    } catch (err) { alert('Failed to mark as paid.'); }
  };

  const handleMarkOverdue = async (id) => {
    try {
      await api.put(`/invoices/${id}/overdue`);
      fetchData();
    } catch (err) { alert('Failed to mark as overdue.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      fetchData();
    } catch (err) { alert('Failed to delete invoice.'); }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
      PAID: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      OVERDUE: 'bg-rose-100 text-rose-800 border-rose-200',
    };
    const icons = {
      PENDING: <Clock className="w-3 h-3" />,
      PAID: <CheckCircle2 className="w-3 h-3" />,
      OVERDUE: <AlertTriangle className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
        {icons[status]} {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" /> Invoices & Billing
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Generate, track, and manage client invoices across memberships and corporate accounts.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-lg">
            <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Total Invoiced</div>
            <div className="text-2xl font-extrabold mt-1">${summary.total.amount.toFixed(2)}</div>
            <div className="text-xs text-slate-400 mt-1">{summary.total.count} invoices</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Pending</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">${summary.pending.amount.toFixed(2)}</div>
            <div className="text-xs text-slate-400 mt-1">{summary.pending.count} awaiting payment</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Paid</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">${summary.paid.amount.toFixed(2)}</div>
            <div className="text-xs text-slate-400 mt-1">{summary.paid.count} collected</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Overdue</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-bold text-rose-600 mt-1">${summary.overdue.amount.toFixed(2)}</div>
            <div className="text-xs text-slate-400 mt-1">{summary.overdue.count} past due</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-slate-400" />
        {['', 'PENDING', 'PAID', 'OVERDUE'].map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
              filterStatus === f
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-8 rounded-2xl text-center text-slate-400 border border-slate-200">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-slate-500 border border-slate-200">No invoices found.</div>
        ) : (
          invoices.map(inv => (
            <div key={inv.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{inv.clientName}</h3>
                      <div className="text-xs text-slate-400 font-mono">{inv.invoiceNumber}</div>
                    </div>
                    {getStatusBadge(inv.status)}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 font-medium pl-[52px]">
                    <span>{inv.clientEmail}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-lg">{inv.type}</span>
                    <span>Due: <strong>{inv.dueDate}</strong></span>
                    {inv.notes && <span className="text-slate-400 italic max-w-xs truncate">{inv.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-4">
                    <div className="text-xl font-extrabold text-slate-900">${inv.amount.toFixed(2)}</div>
                    {inv.paidAt && <div className="text-[10px] text-emerald-600 font-semibold">Paid {new Date(inv.paidAt).toLocaleDateString()}</div>}
                  </div>
                  {inv.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleMarkPaid(inv.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm">
                        Mark Paid
                      </button>
                      <button onClick={() => handleMarkOverdue(inv.id)}
                        className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold border border-rose-200">
                        Mark Overdue
                      </button>
                    </>
                  )}
                  {inv.status === 'OVERDUE' && (
                    <button onClick={() => handleMarkPaid(inv.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm">
                      Mark Paid
                    </button>
                  )}
                  <button onClick={() => handleDelete(inv.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100">
            <h3 className="text-xl font-extrabold text-slate-900 mb-1">Create New Invoice</h3>
            <p className="text-xs text-slate-500 mb-5">Generate a billing invoice for a corporate client or membership.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name</label>
                  <input type="text" required value={createForm.clientName}
                    onChange={(e) => setCreateForm({ ...createForm, clientName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                    placeholder="Company Name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Email</label>
                  <input type="email" required value={createForm.clientEmail}
                    onChange={(e) => setCreateForm({ ...createForm, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                    placeholder="billing@company.com" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select value={createForm.type}
                    onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium">
                    <option value="CORPORATE">Corporate</option>
                    <option value="MEMBERSHIP">Membership</option>
                    <option value="EVENT">Event</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount ($)</label>
                  <input type="number" step="0.01" required value={createForm.amount}
                    onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                    placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input type="date" required value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (optional)</label>
                <textarea value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
                  rows={2} placeholder="Invoice description or memo..." />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20">
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
