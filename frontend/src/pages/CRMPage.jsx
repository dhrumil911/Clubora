import React, { useState, useEffect } from 'react';
import api from '../api';
import { Target, PhoneCall, Send, FileText, CheckCircle2, UserCheck, Plus, AlertCircle } from 'lucide-react';

export default function CRMPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quote Generator Modal State
  const [selectedLeadForQuote, setSelectedLeadForQuote] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    tierName: 'Gold Tier Package',
    courtHours: 10,
    totalPrice: 450,
    validUntil: ''
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/crm/leads');
      setLeads(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (leadId, newStatus) => {
    try {
      await api.put(`/crm/leads/${leadId}`, { status: newStatus });
      fetchLeads();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleGenerateQuote = async (e) => {
    e.preventDefault();
    if (!selectedLeadForQuote) return;
    try {
      await api.post('/crm/quotes', {
        leadId: selectedLeadForQuote.id,
        ...quoteForm
      });
      setSelectedLeadForQuote(null);
      fetchLeads();
    } catch (err) {
      alert('Failed to send quote.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'NEW':
        return <span className="bg-sky-100 text-sky-800 font-bold px-2.5 py-0.5 rounded-full text-xs">NEW ENQUIRY</span>;
      case 'CONTACTED':
        return <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-xs">CONTACTED</span>;
      case 'QUOTED':
        return <span className="bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full text-xs">QUOTE SENT</span>;
      case 'CONVERTED':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-xs">CONVERTED MEMBER</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-7 h-7 text-sky-600" /> CRM & Online Lead Pipeline
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Capture stranger enquiries from the website, follow up with quotes, and convert leads into members.
          </p>
        </div>
      </div>

      {/* Leads Pipeline Cards Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-8 rounded-2xl text-center text-slate-400 border border-slate-200">
            Loading leads...
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-slate-500 border border-slate-200">
            No visitor enquiries received yet.
          </div>
        ) : (
          leads.map(lead => (
            <div key={lead.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-extrabold text-slate-900">{lead.name}</h3>
                  {getStatusBadge(lead.status)}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-medium">
                  <span className="flex items-center gap-1"><PhoneCall className="w-3.5 h-3.5 text-slate-400" /> {lead.phone}</span>
                  <span>{lead.email}</span>
                  <span className="bg-slate-100 px-2.5 py-0.5 rounded-lg text-slate-700">Interest: <strong>{lead.interest}</strong></span>
                </div>

                {lead.notes && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-2xl">
                    "{lead.notes}"
                  </p>
                )}

                {/* Quotes List */}
                {lead.quotes?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {lead.quotes.map(q => (
                      <span key={q.id} className="text-[11px] bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-indigo-500" />
                        Quote #{q.id.substring(0,6)}: ${q.totalPrice} ({q.tierName})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {lead.status === 'NEW' && (
                  <button
                    onClick={() => handleUpdateStatus(lead.id, 'CONTACTED')}
                    className="px-3.5 py-2 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-bold border border-amber-200"
                  >
                    Mark Contacted
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedLeadForQuote(lead);
                    setQuoteForm({
                      tierName: 'Gold Trial Package',
                      courtHours: 8,
                      totalPrice: 350,
                      validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
                    });
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Send Quote
                </button>

                {lead.status !== 'CONVERTED' && (
                  <button
                    onClick={() => handleUpdateStatus(lead.id, 'CONVERTED')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Convert to Member
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* Quote Generator Modal */}
      {selectedLeadForQuote && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-xl font-extrabold text-slate-900 mb-1">Generate Custom Quote</h3>
            <p className="text-xs text-slate-500 mb-4">Recipient: <strong>{selectedLeadForQuote.name}</strong> ({selectedLeadForQuote.email})</p>

            <form onSubmit={handleGenerateQuote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Proposal / Tier Package</label>
                <input
                  type="text"
                  required
                  value={quoteForm.tierName}
                  onChange={(e) => setQuoteForm({ ...quoteForm, tierName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Included Court Hours</label>
                  <input
                    type="number"
                    value={quoteForm.courtHours}
                    onChange={(e) => setQuoteForm({ ...quoteForm, courtHours: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Quote Price ($)</label>
                  <input
                    type="number"
                    required
                    value={quoteForm.totalPrice}
                    onChange={(e) => setQuoteForm({ ...quoteForm, totalPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Valid Until Date</label>
                <input
                  type="date"
                  required
                  value={quoteForm.validUntil}
                  onChange={(e) => setQuoteForm({ ...quoteForm, validUntil: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedLeadForQuote(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20"
                >
                  Send Proposal Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
