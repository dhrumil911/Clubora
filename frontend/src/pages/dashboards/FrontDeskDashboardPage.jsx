import React, { useState, useEffect } from 'react';
import api from '../../api';
import MembersPage from '../MembersPage';
import BookingsPage from '../BookingsPage';
import CRMPage from '../CRMPage';
import { 
  Users, Calendar, Target, ShieldCheck, CheckCircle2, Clock, 
  UserPlus, PhoneCall, AlertTriangle, Search, Plus, 
  RefreshCw, Trophy, Crown, Shield, Zap, UserCheck, 
  MapPin, Check, ChevronRight, ArrowRight, User
} from 'lucide-react';

export default function FrontDeskDashboardPage({ user, isEmbedded = false }) {
  const [activeTab, setActiveTab] = useState('checkin'); // 'checkin' | 'bookings' | 'walkins' | 'members' | 'crm' | 'schedule'
  
  // Front Desk 7 Key Dashboard Metrics
  const [metrics, setMetrics] = useState({
    todayBookings: 18,
    availableCourts: 3,
    todayWalkIns: 5,
    newMembers: 2,
    pendingEnquiries: 7,
    expiringMemberships: 4,
    todayRevenue: 12500
  });
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Member Quick Check-In State
  const [memberSearch, setMemberSearch] = useState('');
  const [allMembers, setAllMembers] = useState([]);
  const [todayBookingsList, setTodayBookingsList] = useState([]);
  const [selectedCheckInMember, setSelectedCheckInMember] = useState(null);
  const [checkInStatusMsg, setCheckInStatusMsg] = useState('');

  // Walk-in Quick Booking State
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInCourtId, setWalkInCourtId] = useState('');
  const [walkInStartTime, setWalkInStartTime] = useState('17:00');
  const [walkInPaymentMethod, setWalkInPaymentMethod] = useState('CASH');
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInMsg, setWalkInMsg] = useState({ type: '', text: '' });
  const [courts, setCourts] = useState([]);

  // Staff Schedule State
  const [shifts, setShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(false);

  // New Enquiry Quick Form State
  const [showNewEnquiryModal, setShowNewEnquiryModal] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    phone: '',
    email: '',
    interest: 'Gold Membership',
    notes: 'Inquired at front desk'
  });
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchDashboardMetrics();
    fetchMembersAndBookings();
    fetchCourts();
  }, []);

  useEffect(() => {
    if (activeTab === 'schedule') {
      fetchShifts();
    }
  }, [activeTab]);

  const fetchDashboardMetrics = async () => {
    try {
      setMetricsLoading(true);
      const res = await api.get('/front-desk/stats');
      setMetrics(res.data);
    } catch (err) {
      console.error('Error fetching front desk stats:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchMembersAndBookings = async () => {
    try {
      const [membersRes, bookingsRes] = await Promise.all([
        api.get('/members'),
        api.get('/bookings', { params: { date: todayStr } })
      ]);
      setAllMembers(membersRes.data || []);
      setTodayBookingsList(bookingsRes.data || []);
    } catch (err) {
      console.error('Error fetching members/bookings:', err);
    }
  };

  const fetchCourts = async () => {
    try {
      const res = await api.get('/courts');
      setCourts(res.data || []);
      if (res.data?.length > 0 && !walkInCourtId) {
        setWalkInCourtId(res.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching courts:', err);
    }
  };

  const fetchShifts = async () => {
    try {
      setShiftsLoading(true);
      const res = await api.get('/shifts');
      setShifts(res.data || []);
    } catch (err) {
      console.error('Error fetching shifts:', err);
    } finally {
      setShiftsLoading(false);
    }
  };

  // Perform Member Check-In
  const handleCheckIn = async (bookingId) => {
    try {
      await api.post(`/bookings/${bookingId}/check-in`);
      setCheckInStatusMsg('Member successfully checked in!');
      fetchMembersAndBookings();
      setTimeout(() => setCheckInStatusMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to check in member.');
    }
  };

  // Register Walk-in Customer + Court Booking
  const handleCreateWalkInBooking = async (e) => {
    e.preventDefault();
    setWalkInMsg({ type: '', text: '' });
    if (!walkInName || !walkInCourtId || !walkInStartTime) {
      setWalkInMsg({ type: 'error', text: 'Please fill name, court, and start time.' });
      return;
    }

    try {
      setWalkInSubmitting(true);
      await api.post('/bookings', {
        courtId: walkInCourtId,
        customerName: `${walkInName} (Walk-in: ${walkInPhone || 'Counter'})`,
        bookingDate: todayStr,
        startTime: walkInStartTime,
        durationMinutes: 60,
        paymentMethod: walkInPaymentMethod
      });

      setWalkInMsg({ type: 'success', text: `Walk-in booking created & payment (${walkInPaymentMethod}) recorded!` });
      setWalkInName('');
      setWalkInPhone('');
      fetchMembersAndBookings();
      fetchDashboardMetrics();
    } catch (err) {
      setWalkInMsg({ type: 'error', text: err.response?.data?.error || 'Failed to book court for walk-in.' });
    } finally {
      setWalkInSubmitting(false);
    }
  };

  // Convert Walk-in to CRM Enquiry
  const handleConvertWalkInToEnquiry = async (booking) => {
    const rawName = booking.customerName.replace(/\(Walk-in:.*?\)/, '').trim();
    setEnquiryForm({
      name: rawName,
      phone: booking.customerName.includes('Walk-in:') ? booking.customerName.match(/Walk-in:\s*([^)]+)/)?.[1] || '' : '',
      email: `${rawName.toLowerCase().replace(/\s+/g, '')}@walkin.temp`,
      interest: 'Full Membership',
      notes: `Walk-in visitor on ${booking.bookingDate} at court ${booking.court?.name}. Interested in regular playing membership.`
    });
    setShowNewEnquiryModal(true);
  };

  // Add CRM Enquiry
  const handleAddEnquiry = async (e) => {
    e.preventDefault();
    try {
      setEnquirySubmitting(true);
      await api.post('/crm/leads', enquiryForm);
      setShowNewEnquiryModal(false);
      setEnquiryForm({ name: '', phone: '', email: '', interest: 'Gold Membership', notes: '' });
      alert('Visitor Enquiry recorded into CRM pipeline!');
      fetchDashboardMetrics();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record enquiry.');
    } finally {
      setEnquirySubmitting(false);
    }
  };

  // Filtered members for quick check-in search
  const filteredMembers = memberSearch.trim()
    ? allMembers.filter(m => 
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
        (m.memberCode && m.memberCode.toLowerCase().includes(memberSearch.toLowerCase())) ||
        (m.phone && m.phone.includes(memberSearch))
      )
    : [];

  const getTierIcon = (tierName) => {
    if (tierName === 'Gold') return <Crown className="w-4 h-4 text-amber-400" />;
    if (tierName === 'Silver') return <Shield className="w-4 h-4 text-zinc-300" />;
    if (tierName === 'Junior') return <Trophy className="w-4 h-4 text-sky-400" />;
    return <User className="w-4 h-4 text-zinc-400" />;
  };

  // Today's walk-ins list (bookings with no memberId or name containing walk-in)
  const todayWalkInsList = todayBookingsList.filter(b => !b.memberId || b.customerName?.includes('Walk-in'));
  const activeTabDetails = {
    checkin: { title: 'Check-In & Arrivals', description: 'Verify memberships and manage today’s player arrivals.', icon: CheckCircle2 },
    bookings: { title: 'Court Scheduler', description: 'Review court availability and manage bookings.', icon: Calendar },
    walkins: { title: 'Walk-In Players', description: 'Register walk-in players, record payment, and track follow-up.', icon: Users },
    members: { title: 'Members Directory', description: 'Find members, review membership details, and register new members.', icon: UserCheck },
    crm: { title: 'Visitor CRM & Quotes', description: 'Follow up with visitor enquiries and convert leads into members.', icon: Target },
    schedule: { title: 'Duty Schedule', description: 'Review staff coverage and today’s operational shifts.', icon: Clock }
  }[activeTab];
  const ActiveTabIcon = activeTabDetails.icon;

  return (
    <div className={`front-desk-ui w-full min-w-0 ${isEmbedded ? 'text-white' : 'max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-zinc-950 min-h-screen text-white'}`}>
      
      {/* 1. Clean, Compact Header with Quick Actions */}
      <div className={isEmbedded ? 'owner-tab-actions flex justify-end' : 'flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6'}>
        {!isEmbedded && <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-lime-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Front Desk Operations</h1>
            <span className="bg-lime-400/10 text-lime-400 border border-lime-400/20 text-[10px] font-black px-2 py-0.5 rounded-full">
              LIVE DESK
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 font-medium">
            Member check-ins, court bookings, walk-in registers & visitor enquiries.
          </p>
        </div>}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('walkins')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Walk-In Booking</span>
          </button>
          <button
            onClick={() => setShowNewEnquiryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5 text-purple-400" />
            <span>+ Log Enquiry</span>
          </button>
          <button
            onClick={fetchDashboardMetrics}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${metricsLoading ? 'animate-spin text-lime-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Spacious 4-Card Hero Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Card 1: Today's Bookings */}
        <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider">Today's Bookings</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">{metrics.todayBookings}</div>
            <div className="text-[11px] text-zinc-400 font-medium mt-0.5">Confirmed court slots</div>
          </div>
          <div className="p-3 bg-sky-400/10 text-sky-400 rounded-2xl border border-sky-400/20">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Available Courts */}
        <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-lime-400 uppercase tracking-wider">Available Courts</span>
            <div className="text-2xl sm:text-3xl font-black text-lime-400 mt-1">{metrics.availableCourts} <span className="text-sm font-normal text-zinc-500">/ 6</span></div>
            <div className="text-[11px] text-zinc-400 font-medium mt-0.5">Ready for booking</div>
          </div>
          <div className="p-3 bg-lime-400/10 text-lime-400 rounded-2xl border border-lime-400/20">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Today's Walk-ins */}
        <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Today Walk-Ins</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">{metrics.todayWalkIns}</div>
            <div className="text-[11px] text-zinc-400 font-medium mt-0.5">Counter registrations</div>
          </div>
          <div className="p-3 bg-amber-400/10 text-amber-400 rounded-2xl border border-amber-400/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Today's Revenue */}
        <div className="bg-zinc-900 border border-zinc-800/80 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Desk Revenue</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">₹{metrics.todayRevenue.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-zinc-400 font-medium mt-0.5">Cash, UPI & cards today</div>
          </div>
          <div className="p-3 bg-emerald-400/10 text-emerald-400 rounded-2xl border border-emerald-400/20">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sleek Secondary Status Pills (Clean & Compact) */}
      <div className={`bg-zinc-900/60 border border-zinc-800/60 rounded-xl px-4 py-2.5 ${isEmbedded ? 'mb-4' : 'mb-6'} flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 font-medium`}>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            New Members: <strong className="text-white">{metrics.newMembers}</strong>
          </span>
          <span className="text-zinc-700">&bull;</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            Pending Enquiries: <strong className="text-white">{metrics.pendingEnquiries}</strong>
          </span>
          <span className="text-zinc-700">&bull;</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Expiring Memberships: <strong className="text-rose-400">{metrics.expiringMemberships}</strong>
          </span>
        </div>
        <div className="text-[11px] text-zinc-500 font-mono">
          Terminal Date: {todayStr}
        </div>
      </div>

      {/* 3. Clean Modern Navigation Tabs */}
      <div className={`flex border-b border-zinc-800 ${isEmbedded ? 'mb-3' : 'mb-6'} gap-1 overflow-x-auto pb-px`}>
        {[
          { key: 'checkin', label: 'Check-In & Arrivals', icon: <CheckCircle2 className="w-4 h-4" /> },
          { key: 'bookings', label: 'Court Scheduler', icon: <Calendar className="w-4 h-4" /> },
          { key: 'walkins', label: 'Walk-In Players', icon: <Users className="w-4 h-4" /> },
          { key: 'members', label: 'Members Directory', icon: <UserCheck className="w-4 h-4" /> },
          { key: 'crm', label: 'Visitor CRM & Quotes', icon: <Target className="w-4 h-4" /> },
          { key: 'schedule', label: 'Duty Schedule', icon: <Clock className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition whitespace-nowrap border-b-2 cursor-pointer ${
              activeTab === tab.key
                ? 'border-lime-400 text-lime-400 font-black'
                : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {!isEmbedded && <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-lime-400/10 text-lime-600 dark:text-lime-400 flex items-center justify-center">
          <ActiveTabIcon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-black text-zinc-900 dark:text-white">{activeTabDetails.title}</h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{activeTabDetails.description}</p>
        </div>
      </div>}

      {/* TAB 1: MEMBER CHECK-IN & ARRIVALS (Section 5) */}
      {activeTab === 'checkin' && (
        <div className="space-y-6">
          
          {checkInStatusMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-5 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{checkInStatusMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Member Search & Verification Desk */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
                <h3 className="text-base font-black text-white mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4 text-lime-400" /> Member Quick Lookup
                </h3>
                <p className="text-xs text-zinc-400 mb-4 font-medium">Search member by Name, Phone Number, Email, or Member Code.</p>

                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search e.g. Roger Federer, MEM-001, +91..."
                    value={memberSearch}
                    onChange={(e) => {
                      setMemberSearch(e.target.value);
                      setSelectedCheckInMember(null);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-400"
                  />
                </div>

                {/* Search Results Dropdown List */}
                {memberSearch.trim() && (
                  <div className="mt-3 max-h-60 overflow-y-auto space-y-2 border border-zinc-800 rounded-2xl p-2 bg-zinc-950">
                    {filteredMembers.length === 0 ? (
                      <div className="text-xs text-zinc-500 p-3 text-center">No member found matching "{memberSearch}"</div>
                    ) : (
                      filteredMembers.map(m => (
                        <div
                          key={m.id}
                          onClick={() => setSelectedCheckInMember(m)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                            selectedCheckInMember?.id === m.id
                              ? 'bg-lime-400/10 border-lime-400 text-white'
                              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {m.name}
                              <span className="text-[10px] font-mono text-zinc-400">({m.memberCode})</span>
                            </div>
                            <div className="text-[10px] text-zinc-400">{m.phone || m.email}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.tier?.name === 'Gold' ? 'bg-amber-400/10 text-amber-400' :
                            m.tier?.name === 'Silver' ? 'bg-zinc-400/10 text-zinc-300' : 'bg-sky-400/10 text-sky-400'
                          }`}>
                            {m.tier?.name}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Selected Member Verification Card */}
              {selectedCheckInMember ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
                  <div className="flex justify-between items-start pb-3 border-b border-zinc-800">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-lime-400">Verified Member</span>
                      <h4 className="text-xl font-black text-white mt-0.5">{selectedCheckInMember.name}</h4>
                      <p className="text-xs font-mono text-zinc-400">{selectedCheckInMember.memberCode}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 rounded-xl border border-zinc-800">
                      {getTierIcon(selectedCheckInMember.tier?.name)}
                      <span className="text-xs font-black text-white">{selectedCheckInMember.tier?.name} Tier</span>
                    </div>
                  </div>

                  {/* Entitlements & Benefits */}
                  <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 text-xs space-y-1.5">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Entitlements & Benefits:</div>
                    <div className="flex items-center gap-1.5 text-zinc-200">
                      <Check className="w-3.5 h-3.5 text-lime-400" />
                      <span>Court Discount: <strong className="text-lime-400">{selectedCheckInMember.tier?.courtDiscountPercent}% OFF</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-200">
                      <Check className="w-3.5 h-3.5 text-lime-400" />
                      <span>Shop & Bar Discount: <strong className="text-white">{selectedCheckInMember.tier?.shopDiscountPercent}% OFF</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-200">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Expires: <strong className="text-zinc-200">{new Date(selectedCheckInMember.expiresAt).toLocaleDateString()}</strong></span>
                    </div>
                  </div>

                  {/* Today's Bookings for this Member */}
                  <div>
                    <h5 className="text-xs font-bold text-zinc-300 mb-2">Today's Court Sessions:</h5>
                    {todayBookingsList.filter(b => b.memberId === selectedCheckInMember.id).length === 0 ? (
                      <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-500 text-center">
                        No court bookings booked today for this member.
                        <button
                          onClick={() => setActiveTab('bookings')}
                          className="block mx-auto mt-2 text-lime-400 font-bold hover:underline"
                        >
                          + Book Court Now
                        </button>
                      </div>
                    ) : (
                      todayBookingsList.filter(b => b.memberId === selectedCheckInMember.id).map(b => (
                        <div key={b.id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-bold text-white text-xs">{b.court?.name}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">{b.startTime} - {b.endTime}</div>
                          </div>
                          {b.isCheckedIn ? (
                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-black flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Checked In
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCheckIn(b.id)}
                              className="px-4 py-1.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-xl text-xs font-black shadow-md cursor-pointer transition"
                            >
                              Check-In
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900/60 border border-zinc-800 border-dashed rounded-3xl p-8 text-center text-zinc-500 text-xs">
                  Search and select a member above to inspect active membership status and check them in.
                </div>
              )}
            </div>

            {/* Right: Today's Full Arrival & Check-in Desk Board */}
            <div className="lg:col-span-7">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-lime-400" /> Today's Player Arrivals Board ({todayStr})
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Live roster of member and walk-in court players arriving at the club today.</p>
                  </div>
                  <button
                    onClick={fetchMembersAndBookings}
                    className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 text-xs transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {todayBookingsList.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-xs italic">
                    No bookings scheduled for today yet. Use the Court Scheduler tab to book sessions.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                    {todayBookingsList.map(b => (
                      <div key={b.id} className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-lime-400 text-xs">
                            {b.startTime}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-2">
                              <span>{b.customerName}</span>
                              {b.member?.tier?.name && (
                                <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded-md text-amber-400 font-bold border border-zinc-800">
                                  {b.member.tier.name}
                                </span>
                              )}
                              {b.isSocialPlay && (
                                <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                                  Friday Social
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              {b.court?.name} &bull; Slot: {b.startTime} - {b.endTime} (1 hr) &bull; Fee: <strong className="text-lime-400">₹{b.finalFee.toFixed(2)}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                          {b.isCheckedIn ? (
                            <span className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Checked-In
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCheckIn(b.id)}
                              className="px-4 py-1.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-xl text-xs font-black shadow-md shadow-lime-400/20 transition cursor-pointer"
                            >
                              Check-In Now
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: COURT SCHEDULER & BOOKINGS (Section 2) */}
      {activeTab === 'bookings' && (
        <div className="min-w-0 space-y-6">
          <BookingsPage user={user} isEmbedded />
        </div>
      )}

      {/* TAB 3: WALK-IN CUSTOMERS & REGISTER (Section 3) */}
      {activeTab === 'walkins' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Quick Walk-in Court Booking Form */}
            <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Fast Desk Reception</span>
                <h3 className="text-xl font-black text-white mt-1">Register Walk-in Player</h3>
                <p className="text-xs text-zinc-400 mt-1">Instant court session booking & payment collection for walk-in players.</p>
              </div>

              {walkInMsg.text && (
                <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  walkInMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  {walkInMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{walkInMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleCreateWalkInBooking} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-lime-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Phone Number (for follow-up / CRM)</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-lime-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Select Available Court *</label>
                  <select
                    value={walkInCourtId}
                    onChange={(e) => setWalkInCourtId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-lime-400"
                  >
                    {courts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.sport}) &bull; ₹{c.hourlyRate}/hr
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Start Time (1-hr slot)</label>
                    <select
                      value={walkInStartTime}
                      onChange={(e) => setWalkInStartTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-lime-400"
                    >
                      {[
                        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
                        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
                        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
                        '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
                        '20:00', '20:30', '21:00'
                      ].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Payment Method</label>
                    <select
                      value={walkInPaymentMethod}
                      onChange={(e) => setWalkInPaymentMethod(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-lime-400"
                    >
                      <option value="CASH">Cash at Counter</option>
                      <option value="UPI">UPI / QR Scan</option>
                      <option value="CARD">Card Swipe POS</option>
                      <option value="ONLINE">Razorpay Online</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={walkInSubmitting}
                  className="w-full py-3 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black rounded-xl text-xs shadow-lg shadow-lime-400/20 transition cursor-pointer mt-2"
                >
                  {walkInSubmitting ? 'Booking & Recording Payment...' : 'Confirm Walk-In Booking (₹)'}
                </button>
              </form>
            </div>

            {/* Right: Today's Walk-in Customers Log & Conversion */}
            <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" /> Today's Walk-in Players Log
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Quickly convert interested walk-in players into recurring club members or CRM leads.</p>
                </div>
                <span className="text-xs font-bold bg-amber-400/10 text-amber-400 px-3 py-1 rounded-full border border-amber-400/20">
                  {todayWalkInsList.length} walk-in(s) today
                </span>
              </div>

              {todayWalkInsList.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs italic">
                  No walk-in sessions recorded today yet. Use the form on the left to register walk-ins.
                </div>
              ) : (
                <div className="space-y-3">
                  {todayWalkInsList.map(b => (
                    <div key={b.id} className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-white text-sm">{b.customerName}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          Court: <strong className="text-zinc-200">{b.court?.name}</strong> &bull; Time: {b.startTime} - {b.endTime}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-1">
                          Amount Paid: <strong className="text-lime-400">₹{b.finalFee.toFixed(2)}</strong> ({b.paymentStatus})
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConvertWalkInToEnquiry(b)}
                          className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Target className="w-3.5 h-3.5" /> + Follow-up Lead
                        </button>
                        <button
                          onClick={() => setActiveTab('members')}
                          className="px-3.5 py-1.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-xl text-xs font-black shadow-md cursor-pointer transition"
                        >
                          + Convert to Member
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: MEMBER MANAGEMENT (Section 1) */}
      {activeTab === 'members' && (
        <div className="min-w-0 space-y-6">
          <MembersPage isEmbedded />
        </div>
      )}

      {/* TAB 5: ENQUIRIES & VISITOR CRM (Section 4) */}
      {activeTab === 'crm' && (
        <div className="min-w-0 space-y-6">
          <CRMPage isEmbedded />
        </div>
      )}

      {/* TAB 6: STAFF DUTY SCHEDULE & ROSTER (Section 7) */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-end mb-5 pb-4 border-b border-zinc-800">
              <button
                onClick={fetchShifts}
                className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${shiftsLoading ? 'animate-spin text-lime-400' : ''}`} /> Refresh Roster
              </button>
            </div>

            {shiftsLoading ? (
              <div className="py-12 text-center text-zinc-500 text-xs">Loading duty schedule...</div>
            ) : shifts.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs italic">
                No active staff shifts scheduled for today.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shifts.map(sh => (
                  <div key={sh.id} className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-white text-sm">{sh.staffName || 'Staff Member'}</div>
                        <span className="text-[10px] font-bold text-sky-400 bg-sky-400/10 px-2.5 py-0.5 rounded-full border border-sky-400/20 inline-block mt-0.5">
                          {sh.department || sh.role || 'Front Desk'}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        ON DUTY
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-900 flex justify-between items-center">
                      <span>Shift Date: <strong className="text-zinc-200">{sh.date || todayStr}</strong></span>
                      <span className="font-mono text-zinc-300">{sh.startTime || '08:00'} - {sh.endTime || '16:00'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Quick Add CRM Enquiry */}
      {showNewEnquiryModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-zinc-800 text-white">
            <h3 className="text-xl font-black text-white mb-1 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-purple-400" /> Log Visitor Enquiry
            </h3>
            <p className="text-xs text-zinc-400 mb-6">Capture front desk visitor contact for membership follow-up & quotes.</p>

            <form onSubmit={handleAddEnquiry} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-400 mb-1">Visitor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Sharma"
                  value={enquiryForm.name}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-lime-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-400 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={enquiryForm.phone}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-lime-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-400 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="visitor@example.com"
                    value={enquiryForm.email}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-lime-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-400 mb-1">Interested Membership / Service</label>
                <select
                  value={enquiryForm.interest}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, interest: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-lime-400"
                >
                  <option value="Gold Membership">Gold Tier Membership (₹2,499/mo)</option>
                  <option value="Silver Membership">Silver Tier Membership (₹1,299/mo)</option>
                  <option value="Junior Membership">Junior Athlete Tier (₹699/mo)</option>
                  <option value="Tennis Coaching">Tennis Coaching & Court Package</option>
                  <option value="Cricket Nets">Cricket Nets Rental</option>
                  <option value="Corporate Event">Corporate Sports Day Booking</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-400 mb-1">Visitor Notes</label>
                <textarea
                  rows={2}
                  placeholder="Visitor inquired about evening tennis slots and trial membership..."
                  value={enquiryForm.notes}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-lime-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowNewEnquiryModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enquirySubmitting}
                  className="px-5 py-2 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-xl font-black shadow-md shadow-lime-400/20"
                >
                  {enquirySubmitting ? 'Saving...' : 'Save Enquiry into CRM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
