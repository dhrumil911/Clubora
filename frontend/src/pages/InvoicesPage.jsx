import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  FileText, Plus, DollarSign, AlertTriangle, CheckCircle2, Clock,
  Send, X, Filter, CreditCard, Building2, Search, Download
} from 'lucide-react';
import { downloadInvoicePDF } from '../utils/pdfGenerator';

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
      PENDING: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
      PAID: 'bg-lime-400/10 text-lime-400 border-lime-400/20',
      OVERDUE: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };
    const icons = {
      PENDING: <Clock className="w-3 h-3" />,
      PAID: <CheckCircle2 className="w-3 h-3" />,
      OVERDUE: <AlertTriangle className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${styles[status] || 'bg-zinc-800 text-zinc-400'}`}>
        {icons[status]} {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <FileText className="w-8 h-8 text-lime-400" /> Invoices & Billing
          </h1>
          <p className="text-zinc-400 text-sm mt-1 font-medium">
            Generate, track, and manage client invoices across memberships and corporate accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (invoices.length === 0) return alert('No invoices to export.');
              invoices.forEach((inv, i) => {
                setTimeout(() => downloadInvoicePDF(inv), i * 350);
              });
            }}
            disabled={invoices.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-2xl text-xs font-bold shadow-xl transition active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 text-lime-400" /> Export All Invoices (PDF)
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-2xl text-xs font-black shadow-lg shadow-lime-400/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 text-white p-5 rounded-3xl border border-zinc-800 shadow-2xl">
            <div className="text-[10px] font-bold text-lime-400 uppercase tracking-wider">Total Invoiced</div>
            <div className="text-2xl font-black text-white mt-1">${summary.total.amount.toFixed(2)}</div>
            <div className="text-xs text-zinc-400 mt-1">{summary.total.count} invoices</div>
          </div>
          <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-2xl">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Pending</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">${summary.pending.amount.toFixed(2)}</div>
            <div className="text-xs text-zinc-400 mt-1">{summary.pending.count} awaiting payment</div>
          </div>
          <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-2xl">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-lime-400 uppercase tracking-wider">Paid</span>
              <CheckCircle2 className="w-4 h-4 text-lime-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">${summary.paid.amount.toFixed(2)}</div>
            <div className="text-xs text-zinc-400 mt-1">{summary.paid.count} collected</div>
          </div>
          <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-2xl">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Overdue</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 mt-1">${summary.overdue.amount.toFixed(2)}</div>
            <div className="text-xs text-zinc-400 mt-1">{summary.overdue.count} past due</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-zinc-500" />
        {['', 'PENDING', 'PAID', 'OVERDUE'].map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              filterStatus === f
                ? 'bg-lime-400 text-zinc-950 border-lime-400 shadow-lg shadow-lime-400/20 font-black'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-zinc-900 p-8 rounded-3xl text-center text-zinc-500 border border-zinc-800 font-medium">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="bg-zinc-900 p-8 rounded-3xl text-center text-zinc-500 border border-zinc-800 font-medium">No invoices found.</div>
        ) : (
          invoices.map(inv => (
            <div key={inv.id} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl hover:border-zinc-700 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-lime-400/10 flex items-center justify-center border border-lime-400/20 text-lime-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-base">{inv.clientName}</h3>
                      <div className="text-xs text-zinc-500 font-mono">{inv.invoiceNumber}</div>
                    </div>
                    {getStatusBadge(inv.status)}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-zinc-400 font-medium pl-[52px]">
                    <span>{inv.clientEmail}</span>
                    <span className="bg-zinc-950 px-2.5 py-0.5 rounded-lg border border-zinc-800 text-zinc-300">{inv.type}</span>
                    <span>Due: <strong className="text-white">{inv.dueDate}</strong></span>
                    {inv.notes && <span className="text-zinc-500 italic max-w-xs truncate">{inv.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right mr-4">
                    <div className="text-2xl font-black text-lime-400">${inv.amount.toFixed(2)}</div>
                    {inv.paidAt && <div className="text-[10px] text-emerald-400 font-semibold">Paid {new Date(inv.paidAt).toLocaleDateString()}</div>}
                  </div>
                  <button
                    onClick={() => downloadInvoicePDF(inv)}
                    title="Download Invoice PDF"
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 rounded-xl text-xs font-bold border border-zinc-700/50 transition active:scale-95 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-lime-400" /> PDF
                  </button>
                  {inv.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleMarkPaid(inv.id)}
                        className="px-4 py-2 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-xl text-xs font-black shadow-md shadow-lime-400/20">
                        Mark Paid
                      </button>
                      <button onClick={() => handleMarkOverdue(inv.id)}
                        className="px-4 py-2 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 rounded-xl text-xs font-bold border border-rose-500/20">
                        Mark Overdue
                      </button>
                    </>
                  )}
                  {inv.status === 'OVERDUE' && (
                    <button onClick={() => handleMarkPaid(inv.id)}
                      className="px-4 py-2 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-xl text-xs font-black shadow-md shadow-lime-400/20">
                      Mark Paid
                    </button>
                  )}
                  <button onClick={() => handleDelete(inv.id)}
                    className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition">
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
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-zinc-800 text-white">
            <h3 className="text-2xl font-black text-white mb-1">Create New Invoice</h3>
            <p className="text-xs text-zinc-400 mb-6">Generate a billing invoice for a corporate client or membership.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Client Name</label>
                  <input type="text" required value={createForm.clientName}
                    onChange={(e) => setCreateForm({ ...createForm, clientName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 focus:border-lime-400 font-medium text-white"
                    placeholder="Company Name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Client Email</label>
                  <input type="email" required value={createForm.clientEmail}
                    onChange={(e) => setCreateForm({ ...createForm, clientEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 focus:border-lime-400 font-medium text-white"
                    placeholder="billing@company.com" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Type</label>
                  <select value={createForm.type}
                    onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 focus:border-lime-400 font-medium text-white">
                    <option value="CORPORATE">Corporate</option>
                    <option value="MEMBERSHIP">Membership</option>
                    <option value="EVENT">Event</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Amount ($)</label>
                  <input type="number" step="0.01" required value={createForm.amount}
                    onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 focus:border-lime-400 font-black text-lime-400 text-sm"
                    placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Due Date</label>
                  <input type="date" required value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 focus:border-lime-400 text-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Notes (optional)</label>
                <textarea value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 focus:border-lime-400 font-medium text-white"
                  rows={2} placeholder="Invoice description or memo..." />
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-zinc-800">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 text-zinc-400 hover:bg-zinc-800 rounded-xl text-xs font-bold">
                  Cancel
                </button>
                <button type="submit"
                  className="px-6 py-2.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-xl text-xs font-black shadow-lg shadow-lime-400/20">
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
