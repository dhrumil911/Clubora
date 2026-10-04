import React, { useState, useEffect } from 'react';
import api from '../api';
import { Target, PhoneCall, Send, FileText, CheckCircle2, UserCheck, Plus, AlertCircle } from 'lucide-react';

export default function CRMPage({ isEmbedded = false }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quote Generator Modal State
  const [selectedLeadForQuote, setSelectedLeadForQuote] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    tierName: 'Gold Tier Package',
    courtHours: 10,
    totalPrice: 4999,
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
        return <span className="bg-sky-400/10 text-sky-400 font-extrabold px-3 py-1 rounded-full text-xs border border-sky-400/20">NEW ENQUIRY</span>;
      case 'CONTACTED':
        return <span className="bg-amber-400/10 text-amber-400 font-extrabold px-3 py-1 rounded-full text-xs border border-amber-400/20">CONTACTED</span>;
      case 'QUOTED':
        return <span className="bg-purple-400/10 text-purple-400 font-extrabold px-3 py-1 rounded-full text-xs border border-purple-400/20">QUOTE SENT</span>;
      case 'CONVERTED':
        return <span className="bg-lime-400/10 text-lime-400 font-extrabold px-3 py-1 rounded-full text-xs border border-lime-400/20">CONVERTED MEMBER</span>;
      default:
        return <span className="bg-zinc-800 text-zinc-300 font-bold px-3 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <div className={isEmbedded ? 'w-full min-w-0 space-y-6' : 'max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-zinc-900 bg-[#eef0f3]'}>
      
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 flex items-center gap-3 tracking-tight">
              <Target className="w-7 h-7 sm:w-8 sm:h-8 text-lime-500" /> CRM & Online Lead Pipeline
            </h1>
            <p className="text-zinc-600 text-sm mt-1 font-medium">
              Capture visitor enquiries from the website, follow up with quotes, and convert leads into members.
            </p>
          </div>
        </div>
      )}

      {/* Leads Pipeline Cards Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-8 rounded-3xl text-center text-zinc-500 border border-zinc-200 font-medium shadow-sm">
            Loading leads...
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl text-center text-zinc-500 border border-zinc-200 font-medium shadow-sm">
            No visitor enquiries received yet.
          </div>
        ) : (
          leads.map(lead => (
            <div key={lead.id} className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-[0_8px_24px_rgba(15,23,42,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg sm:text-xl font-black text-zinc-900">{lead.name}</h3>
                  {getStatusBadge(lead.status)}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 font-medium">
                  <span className="flex items-center gap-1.5"><PhoneCall className="w-3.5 h-3.5 text-zinc-500" /> {lead.phone}</span>
                  <span>{lead.email}</span>
                  <span className="bg-zinc-100 px-3 py-1 rounded-xl text-zinc-700 border border-zinc-200">Interest: <strong className="text-lime-600">{lead.interest}</strong></span>
                </div>

                {lead.notes && (
                  <p className="text-xs text-zinc-600 bg-zinc-100 p-3 rounded-2xl border border-zinc-200 max-w-2xl italic">
                    "{lead.notes}"
                  </p>
                )}

                {/* Quotes List */}
                {lead.quotes?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {lead.quotes.map(q => (
                      <span key={q.id} className="text-[11px] bg-purple-100 text-purple-700 font-bold px-3 py-1 rounded-xl border border-purple-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                        Quote #{q.id.substring(0,6)}: ₹{q.totalPrice} ({q.tierName})
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
                    className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold border border-amber-200 transition"
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
                      totalPrice: 3999,
                      validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
                    });
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" /> Send Quote
                </button>

                {lead.status !== 'CONVERTED' && (
                  <button
                    onClick={() => handleUpdateStatus(lead.id, 'CONVERTED')}
                    className="px-4 py-2 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-xl text-xs font-black shadow-lg shadow-lime-400/20 flex items-center gap-1.5 transition"
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
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 w-[calc(100%-32px)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-800 text-white">
            <h3 className="text-2xl font-black text-white mb-1">Generate Custom Quote</h3>
            <p className="text-xs text-zinc-400 mb-6">Recipient: <strong className="text-white">{selectedLeadForQuote.name}</strong> ({selectedLeadForQuote.email})</p>

            <form onSubmit={handleGenerateQuote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Proposal / Tier Package</label>
                <input
                  type="text"
                  required
                  value={quoteForm.tierName}
                  onChange={(e) => setQuoteForm({ ...quoteForm, tierName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 focus:border-lime-400 font-medium text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Included Court Hours</label>
                  <input
                    type="number"
                    value={quoteForm.courtHours}
                    onChange={(e) => setQuoteForm({ ...quoteForm, courtHours: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 focus:border-lime-400 font-medium text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Total Quote Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={quoteForm.totalPrice}
                    onChange={(e) => setQuoteForm({ ...quoteForm, totalPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-lime-400 focus:border-lime-400 font-black text-lime-400 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Valid Until Date</label>
                <input
                  type="date"
                  required
                  value={quoteForm.validUntil}
                  onChange={(e) => setQuoteForm({ ...quoteForm, validUntil: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 focus:border-lime-400 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedLeadForQuote(null)}
                  className="px-5 py-2.5 text-zinc-400 hover:bg-zinc-800 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-xl text-xs font-black shadow-lg shadow-lime-400/20"
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
