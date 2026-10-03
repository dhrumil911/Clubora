import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, UserPlus, Search, Shield, Clock, AlertTriangle, CheckCircle, ChevronRight, RefreshCw, Star } from 'lucide-react';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    tierId: '',
    durationMonths: 12
  });
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, [search, tierFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersRes, tiersRes] = await Promise.all([
        api.get(`/members?search=${encodeURIComponent(search)}&tier=${encodeURIComponent(tierFilter)}`),
        api.get('/members/tiers')
      ]);
      setMembers(membersRes.data);
      setTiers(tiersRes.data);
      if (tiersRes.data.length > 0 && !newMember.tierId) {
        setNewMember(prev => ({ ...prev, tierId: tiersRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/members', newMember);
      setShowAddModal(false);
      setNewMember({ name: '', email: '', phone: '', tierId: tiers[0]?.id || '', durationMonths: 12 });
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to create member.');
    }
  };

  const handleSelectMemberDetails = async (id) => {
    try {
      const res = await api.get(`/members/${id}`);
      setSelectedMember(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getTierBadge = (tierName) => {
    switch (tierName) {
      case 'Gold':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1"><Star className="w-3 h-3 fill-amber-500" /> Gold Tier (100% Free Courts)</span>;
      case 'Silver':
        return <span className="bg-slate-200 text-slate-800 border border-slate-300 font-bold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1"><Shield className="w-3 h-3 text-slate-600" /> Silver Tier (50% Court Off)</span>;
      case 'Junior':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-600" /> Junior Tier (Under 18)</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 font-medium px-2.5 py-0.5 rounded-full text-xs">Walk-in</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-sky-600" /> Member Directory & Front Desk
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage membership plans (Gold, Silver, Junior), check expiration dates, and view activity history.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-sky-600/20 transition"
        >
          <UserPlus className="w-4 h-4" /> Register New Member
        </button>
      </div>

      {/* Tier Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {tiers.filter(t => t.name !== 'Walk-in').map(tier => (
          <div key={tier.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan Tier</span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{tier.name}</h3>
              </div>
              <span className="text-lg font-extrabold text-sky-600">${tier.monthlyFee}<span className="text-xs font-normal text-slate-400">/mo</span></span>
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Court Discount: <strong>{tier.courtDiscountPercent}% OFF</strong>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Shop & Bar Discount: <strong>{tier.shopDiscountPercent}% OFF</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, code or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Tiers</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Junior">Junior</option>
          </select>
          <button
            onClick={fetchData}
            className="p-2 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-xl border border-slate-200"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Members Grid & Detail Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Members List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="bg-white p-8 rounded-2xl text-center text-slate-400 border border-slate-200">
              Loading members...
            </div>
          ) : members.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center text-slate-500 border border-slate-200">
              No members found matching your search.
            </div>
          ) : (
            members.map((m) => {
              const isExpired = m.computedStatus === 'EXPIRED';
              return (
                <div
                  key={m.id}
                  onClick={() => handleSelectMemberDetails(m.id)}
                  className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md flex items-center justify-between gap-4 ${
                    selectedMember?.id === m.id ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center font-bold text-sky-700 text-lg">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base">{m.name}</h4>
                        <span className="text-xs font-mono text-slate-400">({m.memberCode})</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {getTierBadge(m.tier?.name)}
                        <span className="text-xs text-slate-500">{m.phone || m.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-xs font-semibold text-slate-400">Expires</div>
                      <div className="text-xs font-bold text-slate-700 flex items-center gap-1 justify-end mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(m.expiresAt).toLocaleDateString()}
                      </div>
                      {isExpired ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full inline-block mt-1">
                          EXPIRED
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Member Details Drawer / Card */}
        <div className="lg:col-span-1">
          {selectedMember ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
              <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">{selectedMember.tier?.name} Member</span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">{selectedMember.name}</h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{selectedMember.memberCode}</p>
                </div>
                {getTierBadge(selectedMember.tier?.name)}
              </div>

              <div className="py-4 space-y-3 text-sm text-slate-600 border-b border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-semibold text-slate-800">{selectedMember.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-semibold text-slate-800">{selectedMember.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Expiration Date:</span>
                  <span className="font-semibold text-slate-800">{new Date(selectedMember.expiresAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className={`font-bold ${selectedMember.computedStatus === 'EXPIRED' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {selectedMember.computedStatus}
                  </span>
                </div>
              </div>

              {/* Recent History */}
              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Bookings History</h4>
                {selectedMember.bookings?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No recent court bookings recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedMember.bookings?.slice(0, 4).map(b => (
                      <div key={b.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-800">{b.court?.name}</div>
                          <div className="text-slate-400 text-[10px]">{b.bookingDate} | {b.startTime} - {b.endTime}</div>
                        </div>
                        <span className="font-bold text-emerald-600">${b.finalFee.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 border-dashed text-center text-slate-400">
              Select a member from the directory to inspect their plan details and activity history.
            </div>
          )}
        </div>

      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-xl font-extrabold text-slate-900 mb-1">Register New Member</h3>
            <p className="text-xs text-slate-500 mb-6">Select a plan tier (Gold, Silver, Junior) and enter member details.</p>

            {errorMsg && (
              <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-xl border border-rose-200 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Roger Federer"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="roger@example.com"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 555-0100"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Membership Plan Tier</label>
                <select
                  value={newMember.tierId}
                  onChange={(e) => setNewMember({ ...newMember, tierId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                >
                  {tiers.filter(t => t.name !== 'Walk-in').map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} Tier (${t.monthlyFee}/mo - {t.courtDiscountPercent}% off courts)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-600/20"
                >
                  Register Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
