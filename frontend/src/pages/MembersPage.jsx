import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, UserPlus, Search, Shield, Clock, AlertTriangle, CheckCircle, ChevronRight, RefreshCw, Star, Crown, Trophy } from 'lucide-react';

export default function MembersPage({ isEmbedded = false }) {
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
        return <span className="bg-lime-400/10 text-lime-400 border border-lime-400/30 font-black px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1"><Star className="w-3 h-3 fill-lime-400" /> Gold Tier (100% Free Courts)</span>;
      case 'Silver':
        return <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1"><Shield className="w-3 h-3 text-zinc-400" /> Silver Tier (50% Court Off)</span>;
      case 'Junior':
        return <span className="bg-sky-400/10 text-sky-400 border border-sky-400/30 font-bold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1"><Shield className="w-3 h-3 text-sky-400" /> Junior Tier (Under 18)</span>;
      default:
        return <span className="bg-zinc-800 text-zinc-400 font-medium px-2.5 py-0.5 rounded-full text-xs">Walk-in</span>;
    }
  };

  return (
    <div className={isEmbedded ? 'w-full min-w-0 space-y-6' : 'max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-zinc-950 min-h-screen text-zinc-100'}>
      
      {/* Page Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${isEmbedded ? 'mb-4' : 'mb-6'}`}>
        {!isEmbedded && <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-lime-400" /> Member Directory & Front Desk
          </h1>
          <p className="text-zinc-400 text-xs mt-1 font-medium">
            Manage membership plans (Gold, Silver, Junior), check expiration dates, and view activity history.
          </p>
        </div>}
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-lime-400 hover:bg-lime-300 text-zinc-950 px-5 py-2.5 rounded-xl font-black text-xs shadow-lg shadow-lime-400/20 transition"
        >
          <UserPlus className="w-4 h-4" /> Register New Member
        </button>
      </div>

      {/* Tier Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {tiers.filter(t => t.name !== 'Walk-in').map(tier => {
          if (tier.name === 'Gold') {
            return (
              <div key={tier.id} className="bg-gradient-to-b from-amber-950/40 via-zinc-900 to-zinc-900 p-5 rounded-3xl border-2 border-amber-500/50 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">FLAGSHIP TIER</span>
                    </div>
                    <h3 className="text-xl font-black text-white mt-1">{tier.name}</h3>
                  </div>
                  <span className="text-xl font-black text-amber-400">₹{tier.monthlyFee}<span className="text-xs font-normal text-zinc-400">/mo</span></span>
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-zinc-200 border-t border-amber-500/20 pt-3">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-400" /> Court Bookings: <strong className="text-white">{tier.courtDiscountPercent}% OFF (Free)</strong>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-400" /> Shop & Bar Discount: <strong className="text-white">{tier.shopDiscountPercent}% OFF</strong>
                  </div>
                </div>
              </div>
            );
          }

          if (tier.name === 'Silver') {
            return (
              <div key={tier.id} className="bg-gradient-to-b from-zinc-800/40 via-zinc-900 to-zinc-900 p-5 rounded-3xl border border-zinc-700/80 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-zinc-300" />
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">VALUE TIER</span>
                    </div>
                    <h3 className="text-xl font-black text-white mt-1">{tier.name}</h3>
                  </div>
                  <span className="text-xl font-black text-zinc-200">₹{tier.monthlyFee}<span className="text-xs font-normal text-zinc-400">/mo</span></span>
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-zinc-300 border-t border-zinc-800 pt-3">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-zinc-300" /> Court Bookings: <strong className="text-white">{tier.courtDiscountPercent}% OFF</strong>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-zinc-300" /> Shop & Bar Discount: <strong className="text-white">{tier.shopDiscountPercent}% OFF</strong>
                  </div>
                </div>
              </div>
            );
          }

          // Junior Tier
          return (
            <div key={tier.id} className="bg-gradient-to-b from-sky-950/20 via-zinc-900 to-zinc-900 p-5 rounded-3xl border border-sky-500/40 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-sky-400" />
                    <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">UNDER-18 ATHLETE</span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">{tier.name}</h3>
                </div>
                <span className="text-xl font-black text-sky-400">₹{tier.monthlyFee}<span className="text-xs font-normal text-zinc-400">/mo</span></span>
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-zinc-300 border-t border-sky-500/20 pt-3">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-sky-400" /> Court Bookings: <strong className="text-white">{tier.courtDiscountPercent}% OFF</strong>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-sky-400" /> Shop & Bar Discount: <strong className="text-white">{tier.shopDiscountPercent}% OFF</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-xl mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, code or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-lime-400"
          >
            <option value="">All Tiers</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Junior">Junior</option>
          </select>
          <button
            onClick={fetchData}
            className="p-2 text-zinc-400 hover:text-lime-400 hover:bg-zinc-800 rounded-xl border border-zinc-800"
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
            <div className="bg-zinc-900 p-8 rounded-2xl text-center text-zinc-400 border border-zinc-800">
              Loading members...
            </div>
          ) : members.length === 0 ? (
            <div className="bg-zinc-900 p-8 rounded-2xl text-center text-zinc-400 border border-zinc-800">
              No members found matching your search.
            </div>
          ) : (
            members.map((m) => {
              const isExpired = m.computedStatus === 'EXPIRED';
              return (
                <div
                  key={m.id}
                  onClick={() => handleSelectMemberDetails(m.id)}
                  className={`bg-zinc-900 p-4 rounded-2xl border transition-all cursor-pointer hover:border-lime-400/50 flex items-center justify-between gap-4 ${
                    selectedMember?.id === m.id ? 'border-lime-400 ring-2 ring-lime-400/20' : 'border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-black text-lime-400 text-lg">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">{m.name}</h4>
                        <span className="text-xs font-mono text-zinc-400">({m.memberCode})</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {getTierBadge(m.tier?.name)}
                        <span className="text-xs text-zinc-400">{m.phone || m.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase">Expires</div>
                      <div className="text-xs font-bold text-zinc-200 flex items-center gap-1 justify-end mt-0.5">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {new Date(m.expiresAt).toLocaleDateString()}
                      </div>
                      {isExpired ? (
                        <span className="text-[10px] font-black text-rose-400 bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 rounded-full inline-block mt-1">
                          EXPIRED
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full inline-block mt-1">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Member Details Drawer / Card */}
        <div className="lg:col-span-1">
          {selectedMember ? (
            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl sticky top-24">
              <div className="flex justify-between items-start pb-4 border-b border-zinc-800">
                <div>
                  <span className="text-[10px] font-black text-lime-400 uppercase tracking-widest">{selectedMember.tier?.name} Member</span>
                  <h3 className="text-xl font-black text-white mt-1">{selectedMember.name}</h3>
                  <p className="text-xs font-mono text-zinc-400 mt-0.5">{selectedMember.memberCode}</p>
                </div>
                {getTierBadge(selectedMember.tier?.name)}
              </div>

              <div className="py-4 space-y-3 text-xs text-zinc-300 border-b border-zinc-800">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Email:</span>
                  <span className="font-bold text-white">{selectedMember.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Phone:</span>
                  <span className="font-bold text-white">{selectedMember.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Expiration Date:</span>
                  <span className="font-bold text-white">{new Date(selectedMember.expiresAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Status:</span>
                  <span className={`font-black ${selectedMember.computedStatus === 'EXPIRED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedMember.computedStatus}
                  </span>
                </div>
              </div>

              {/* Recent History */}
              <div className="mt-4">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Recent Bookings History</h4>
                {selectedMember.bookings?.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No recent court bookings recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedMember.bookings?.slice(0, 4).map(b => (
                      <div key={b.id} className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-xs flex justify-between items-center">
                        <div>
                          <div className="font-bold text-white">{b.court?.name}</div>
                          <div className="text-zinc-500 text-[10px]">{b.bookingDate} | {b.startTime} - {b.endTime}</div>
                        </div>
                        <span className="font-black text-lime-400">₹{b.finalFee.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/60 p-8 rounded-3xl border border-zinc-800 border-dashed text-center text-zinc-400 text-xs">
              Select a member from the directory to inspect their plan details and activity history.
            </div>
          )}
        </div>

      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 w-[calc(100%-32px)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-800 text-zinc-100">
            <h3 className="text-xl font-black text-white mb-1">Register New Member</h3>
            <p className="text-xs text-zinc-400 mb-6 font-medium">Select a plan tier (Gold, Silver, Junior) and enter member details.</p>

            {errorMsg && (
              <div className="bg-rose-950/80 text-rose-200 text-xs p-3.5 rounded-2xl border border-rose-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Roger Federer"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-lime-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="roger@example.com"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-lime-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-lime-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Membership Plan Tier</label>
                <select
                  value={newMember.tierId}
                  onChange={(e) => setNewMember({ ...newMember, tierId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-lime-400 focus:outline-none"
                >
                  {tiers.filter(t => t.name !== 'Walk-in').map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} Tier (₹{t.monthlyFee}/mo - {t.courtDiscountPercent}% off courts)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:bg-zinc-800 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-xl text-xs font-black shadow-lg shadow-lime-400/20"
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
