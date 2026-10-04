import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { 
  Calendar as CalendarIcon, Clock, AlertTriangle, Plus, Users, Shield, 
  CheckCircle2, X, LayoutGrid, Sun, Sunset, Moon, MapPin 
} from 'lucide-react';

export default function BookingsPage({ user, isEmbedded = false }) {
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // Time Slot Filtering & Zero-Scroll Card View State
  const [timePeriod, setTimePeriod] = useState('ALL'); // 'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING'
  const [viewMode, setViewMode] = useState('GRID'); // 'GRID' | 'CARDS'
  const tableScrollRef = useRef(null);

  // Booking Modal State
  const [showModal, setShowModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('ONLINE'); // 'ONLINE' | 'CASH'
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    courtId: '',
    memberId: '',
    customerName: user?.name || '',
    bookingDate: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    durationMinutes: 60,
    isSocialPlay: false,
    playersCount: 1
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadRazorpaySDK = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00'
  ];

  const visibleTimeSlots = timeSlots.filter(slot => {
    const hour = parseInt(slot.split(':')[0], 10);
    if (timePeriod === 'MORNING') return hour < 12;
    if (timePeriod === 'AFTERNOON') return hour >= 12 && hour < 17;
    if (timePeriod === 'EVENING') return hour >= 17;
    return true;
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Auto-sync member ID when user or members are available
  useEffect(() => {
    if (user?.role === 'MEMBER' && members.length > 0) {
      const myMem = members.find(m => m.email?.toLowerCase() === user.email?.toLowerCase());
      if (myMem) {
        setBookingForm(prev => ({
          ...prev,
          memberId: myMem.id,
          customerName: user.name || myMem.name
        }));
      }
    }
  }, [user, members]);

  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  const fetchInitialData = async () => {
    try {
      const [courtsRes, membersRes] = await Promise.all([
        api.get('/courts'),
        api.get('/members')
      ]);
      setCourts(courtsRes.data);
      const allMembers = membersRes.data || [];
      setMembers(allMembers);

      const currentMember = user?.role === 'MEMBER'
        ? allMembers.find(m => m.email?.toLowerCase() === user.email?.toLowerCase())
        : null;

      if (courtsRes.data.length > 0) {
        setBookingForm(prev => ({ 
          ...prev, 
          courtId: courtsRes.data[0].id,
          memberId: currentMember ? currentMember.id : prev.memberId,
          customerName: user?.name || prev.customerName
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bookings?date=${selectedDate}`);
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate end time string
  const calculateEndTime = (startTimeStr, durationMins) => {
    const [h, m] = startTimeStr.split(':').map(Number);
    const totalMins = h * 60 + m + parseInt(durationMins, 10);
    const endH = Math.floor(totalMins / 60);
    const endM = totalMins % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (paymentLoading) return; // Prevent duplicate submission

    setErrorMsg('');
    setSuccessMsg('');

    const endTime = calculateEndTime(bookingForm.startTime, bookingForm.durationMinutes);
    const selectedCourt = courts.find(c => c.id === bookingForm.courtId);
    const hourlyRate = selectedCourt ? parseFloat(selectedCourt.hourlyRate) : 0;
    const selectedMember = members.find(m => m.id === bookingForm.memberId);
    const discountPercent = selectedMember?.tier?.courtDiscountPercent ? parseFloat(selectedMember.tier.courtDiscountPercent) : 0;
    const discountFee = (hourlyRate * discountPercent) / 100;
    const finalFee = Math.max(0, hourlyRate - discountFee);

    // 1. Direct confirmation for Free Sessions (Gold tier) or Cash payments
    if (finalFee === 0 || paymentMethod === 'CASH') {
      try {
        setPaymentLoading(true);
        await api.post('/bookings', {
          ...bookingForm,
          endTime,
          paymentMethod: finalFee === 0 ? 'MEMBERSHIP_TIER_FREE' : 'CASH'
        });

        setSuccessMsg(
          finalFee === 0
            ? 'Court session booked successfully with 100% Membership Tier discount!'
            : 'Court session booked successfully with Cash Payment recorded.'
        );
        setShowModal(false);
        fetchBookings();
      } catch (err) {
        setErrorMsg(err.response?.data?.error || 'Failed to complete booking.');
      } finally {
        setPaymentLoading(false);
      }
      return;
    }

    // 2. Razorpay Online Payment Flow (Card & UPI in Test Mode)
    try {
      setPaymentLoading(true);

      // Create Razorpay Order securely on backend
      const orderRes = await api.post('/payments/razorpay/create-order', {
        ...bookingForm,
        endTime
      });

      const orderData = orderRes.data;

      if (orderData.isFree) {
        setSuccessMsg('Court session booked successfully with 100% Tier discount!');
        setShowModal(false);
        fetchBookings();
        setPaymentLoading(false);
        return;
      }

      // Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpaySDK();
      if (!isLoaded || !window.Razorpay) {
        setErrorMsg('Unable to load Razorpay payment gateway. Please check your connection.');
        setPaymentLoading(false);
        return;
      }

      // Open Razorpay Checkout Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount, // in paise
        currency: orderData.currency || 'INR',
        name: 'Clubora Sports Club',
        description: `Court Booking: ${orderData.courtName} (${bookingForm.startTime} - ${endTime})`,
        image: '/vite.svg',
        order_id: orderData.orderId,
        prefill: {
          name: user?.name || bookingForm.customerName || orderData.customerName,
          email: user?.email || '',
          contact: ''
        },
        theme: {
          color: '#a3e635' // Clubora lime-400
        },
        modal: {
          ondismiss: async function () {
            setPaymentLoading(false);
            try {
              await api.post('/payments/razorpay/cancel', { bookingId: orderData.bookingId });
            } catch (err) {}
            fetchBookings();
          }
        },
        handler: async function (response) {
          try {
            setPaymentLoading(true);
            const verifyRes = await api.post('/payments/razorpay/verify', {
              bookingId: orderData.bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              method: 'ONLINE'
            });

            setSuccessMsg('Payment verified and court booking confirmed successfully!');
            setShowModal(false);
            fetchBookings();
          } catch (verifyErr) {
            console.error('Payment verification error:', verifyErr);
            setErrorMsg(verifyErr.response?.data?.error || 'Payment signature verification failed.');
          } finally {
            setPaymentLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async function (response) {
        setPaymentLoading(false);
        setErrorMsg(`Payment Failed: ${response.error?.description || response.error?.reason || 'Transaction failed'}`);
        try {
          await api.post('/payments/razorpay/cancel', { bookingId: orderData.bookingId });
        } catch (e) {}
        fetchBookings();
      });

      rzp.open();

    } catch (err) {
      console.error('Order creation error:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to initiate payment.');
      setPaymentLoading(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.delete(`/bookings/${id}`);
      fetchBookings();
    } catch (err) {
      alert('Failed to cancel booking.');
    }
  };

  // Check if a court has a booking at a specific slot
  const isSlotBooked = (courtId, timeSlot) => {
    const slotMins = timeToMinutes(timeSlot);
    return bookings.filter(b => {
      if (b.courtId !== courtId) return false;
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return slotMins >= bStart && slotMins < bEnd;
    });
  };

  const timeToMinutes = (tStr) => {
    const [h, m] = tStr.split(':').map(Number);
    return h * 60 + m;
  };

  return (
    <div className={isEmbedded ? 'w-full min-w-0 space-y-6 box-border' : 'w-full max-w-[1500px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 bg-zinc-950 min-h-screen text-zinc-100 min-w-0 box-border'}>
      
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isEmbedded ? 'mb-4' : 'mb-6'}`}>
        {!isEmbedded && <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 sm:w-8 sm:h-8 text-lime-400 flex-shrink-0" /> Court Booking Engine
          </h1>
          <p className="text-zinc-400 text-xs mt-1 font-medium">
            Real-time schedule grid with 1-hour sessions starting every 30 minutes. Anti-double booking & 2 bookings/day limit enforced.
          </p>
        </div>}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 self-start sm:self-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-white shadow-inner focus:ring-2 focus:ring-lime-400"
          />
          <button
            onClick={() => {
              setBookingForm(prev => ({ ...prev, bookingDate: selectedDate }));
              setShowModal(true);
            }}
            className="inline-flex items-center gap-1.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-lime-400/20 transition whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Book Court
          </button>
        </div>
      </div>

      {/* Booking Rules Infobar - Responsive 3-col grid with zero overflow */}
      <div className="bg-zinc-900 text-zinc-300 p-3.5 rounded-2xl mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border border-zinc-800 shadow-xl text-xs font-semibold">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-lime-400 flex-shrink-0" />
          <span>Sessions: 1 Hour (Every 30m)</span>
        </div>
        <div className="flex items-center gap-2 sm:justify-center">
          <Shield className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <span>Gold: Free | Silver/Jr: 50% Off</span>
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Member Max: 2 Bookings/Day</span>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/80 text-emerald-200 text-xs p-3.5 rounded-2xl border border-emerald-800 mb-5 flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4 text-emerald-400" /></button>
        </div>
      )}

      {/* View Switcher & Time Period Filters Controls - Guaranteed zero cutoff */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-zinc-900 p-3 rounded-2xl border border-zinc-800 shadow-xl mb-5">
        
        {/* Time Period Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-lime-400" />
            <span>Time:</span>
          </span>
          {[
            { key: 'ALL', label: 'All Day', time: '8-21h', icon: Clock },
            { key: 'MORNING', label: 'Morning', time: '8-12h', icon: Sun },
            { key: 'AFTERNOON', label: 'Afternoon', time: '12-17h', icon: Sunset },
            { key: 'EVENING', label: 'Evening', time: '17-21h', icon: Moon }
          ].map(tp => {
            const Icon = tp.icon;
            const isActive = timePeriod === tp.key;
            return (
              <button
                key={tp.key}
                type="button"
                onClick={() => setTimePeriod(tp.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive 
                    ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20' 
                    : 'bg-zinc-800/80 text-zinc-300 hover:text-white border border-zinc-700/60 hover:bg-zinc-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tp.label}</span>
                <span className={`text-[10px] ${isActive ? 'text-zinc-800 font-semibold' : 'text-zinc-400 font-normal'}`}>({tp.time})</span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle: Timeline vs Responsive Cards */}
        <div className="flex items-center gap-2 justify-end self-end lg:self-auto">
          <div className="bg-zinc-950 p-1 rounded-xl flex items-center gap-1 border border-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'GRID' ? 'bg-lime-400 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Grid View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'CARDS' ? 'bg-lime-400 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Cards View
            </button>
          </div>
        </div>

      </div>

      {/* View Mode 1: Timeline Grid (with smooth horizontal scroll & sticky column) */}
      {viewMode === 'GRID' && (
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden w-full max-w-full">
          <div className="overflow-x-auto w-full max-w-full" ref={tableScrollRef}>
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-44 sticky left-0 bg-zinc-950 z-10 border-r border-zinc-800 shadow-md">Court / Sport</th>
                  {visibleTimeSlots.map(slot => (
                    <th key={slot} className="py-3.5 px-2 text-center border-r border-zinc-800 min-w-[70px] text-xs font-semibold text-zinc-300">
                      {slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-xs">
                {courts.map(court => (
                  <tr key={court.id} className="hover:bg-zinc-800/30">
                    <td className="py-3.5 px-4 sticky left-0 bg-zinc-900 z-10 border-r border-zinc-800 shadow-xl">
                      <div className="font-bold text-sm text-zinc-100 tracking-tight leading-snug">{court.name}</div>
                      <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-lime-400/10 border border-lime-400/30 text-xs font-bold text-lime-400 tracking-wide font-mono">
                        ₹{court.hourlyRate}<span className="text-[11px] text-zinc-400 font-sans font-normal">/hr</span>
                      </div>
                    </td>
                    {visibleTimeSlots.map(slot => {
                      const activeBookings = isSlotBooked(court.id, slot);
                      const isBooked = activeBookings.length > 0;
                      const booking = activeBookings[0];

                      return (
                        <td key={slot} className="p-1 border-r border-zinc-800 text-center relative h-14">
                          {isBooked ? (
                            <div
                              onClick={() => handleCancelBooking(booking.id)}
                              title={`Booked by ${booking.customerName} (${booking.startTime} - ${booking.endTime}). Click to cancel.`}
                              className={`w-full h-full rounded-xl p-1 flex flex-col justify-center items-center text-xs font-bold cursor-pointer transition shadow-md ${
                                booking.isSocialPlay
                                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                  : 'bg-lime-400 text-zinc-950 border border-lime-300'
                              }`}
                            >
                              <span className="truncate max-w-[65px] font-bold">{booking.customerName.split(' ')[0]}</span>
                              <span className="text-[10px] font-medium opacity-90">{booking.startTime}</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setBookingForm({
                                  ...bookingForm,
                                  courtId: court.id,
                                  bookingDate: selectedDate,
                                  startTime: slot
                                });
                                setShowModal(true);
                              }}
                              className="w-full h-full rounded-xl border border-dashed border-zinc-800 hover:border-lime-400 hover:bg-lime-400/10 transition flex items-center justify-center text-zinc-500 hover:text-lime-400 text-base font-semibold"
                            >
                              +
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Mode 2: Court Cards View (ZERO HORIZONTAL SCROLL) */}
      {viewMode === 'CARDS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courts.map(court => (
            <div key={court.id} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-xl space-y-4">
              <div className="flex justify-between items-start pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-lime-400" /> {court.name}
                  </h3>
                  <span className="text-xs text-zinc-400 font-medium">Standard 1-hour session</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-lime-400 font-mono">₹{court.hourlyRate}</span>
                  <span className="text-xs text-zinc-400 block font-normal">/ hour</span>
                </div>
              </div>

              {/* Slots wrapped responsively with ZERO horizontal scrolling */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Available Slots ({selectedDate}):
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {visibleTimeSlots.map(slot => {
                    const activeBookings = isSlotBooked(court.id, slot);
                    const isBooked = activeBookings.length > 0;
                    const booking = activeBookings[0];

                    if (isBooked) {
                      return (
                        <div
                          key={slot}
                          onClick={() => handleCancelBooking(booking.id)}
                          title={`Booked by ${booking.customerName}. Click to cancel.`}
                          className="px-2.5 py-1.5 rounded-xl bg-lime-400/20 text-lime-400 border border-lime-400/30 text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1"
                        >
                          <span>{slot}</span>
                          <span className="text-[10px] opacity-80 truncate max-w-[60px] font-medium">({booking.customerName.split(' ')[0]})</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          setBookingForm({
                            ...bookingForm,
                            courtId: court.id,
                            bookingDate: selectedDate,
                            startTime: slot
                          });
                          setShowModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-lime-400/60 hover:bg-lime-400/10 text-zinc-200 hover:text-lime-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-inner"
                      >
                        <Plus className="w-3 h-3 text-lime-400" />
                        <span>{slot}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book Court Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 w-[calc(100%-32px)] sm:w-full max-w-lg shadow-2xl border border-zinc-800 text-zinc-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-white mb-1">Book a Court Session</h3>
            <p className="text-xs text-zinc-400 mb-6 font-medium">Anti-double booking and daily limits will be automatically validated.</p>

            {errorMsg && (
              <div className="bg-rose-950/80 text-rose-200 text-xs p-3.5 rounded-2xl border border-rose-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Court</label>
                  <select
                    value={bookingForm.courtId}
                    onChange={(e) => setBookingForm({ ...bookingForm, courtId: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-lime-400 font-medium"
                  >
                    {courts.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (₹{c.hourlyRate}/hr)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Booking Date</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.bookingDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-lime-400 font-medium"
                  />
                </div>
              </div>

              {user?.role === 'MEMBER' ? (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Booking As (Member Account)</label>
                  <div className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs flex items-center justify-between shadow-inner">
                    <div className="font-bold text-white flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></div>
                      <span>{user?.name || bookingForm.customerName}</span>
                    </div>
                    {(() => {
                      const m = members.find(mem => mem.id === bookingForm.memberId);
                      return m?.tier ? (
                        <span className="text-xs font-bold text-lime-400 bg-lime-400/10 px-2.5 py-1 rounded-lg border border-lime-400/30">
                          {m.tier.name} Tier ({m.tier.courtDiscountPercent}% OFF)
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Select Member (for Tier Discount)</label>
                  <select
                    value={bookingForm.memberId}
                    onChange={(e) => {
                      const mId = e.target.value;
                      const m = members.find(mem => mem.id === mId);
                      setBookingForm({
                        ...bookingForm,
                        memberId: mId,
                        customerName: m ? m.name : bookingForm.customerName
                      });
                    }}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-lime-400 font-medium"
                  >
                    <option value="">Walk-in Customer (Full Rate)</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.tier?.name} Tier - {m.tier?.courtDiscountPercent}% off)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!bookingForm.memberId && (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Customer / Walk-in Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Guest Name"
                    value={bookingForm.customerName}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-lime-400"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Start Time</label>
                  <select
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-lime-400"
                  >
                    {timeSlots.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Session Duration</label>
                  <select
                    disabled
                    value={60}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 cursor-not-allowed"
                  >
                    <option value={60}>1 Hour Session (Fixed)</option>
                  </select>
                </div>
              </div>

              <div className="bg-amber-400/10 p-3 rounded-xl border border-amber-400/30 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="socialPlay"
                  checked={bookingForm.isSocialPlay}
                  onChange={(e) => setBookingForm({ ...bookingForm, isSocialPlay: e.target.checked })}
                  className="w-4 h-4 text-lime-400 rounded bg-zinc-950 border-zinc-800"
                />
                <label htmlFor="socialPlay" className="text-xs font-bold text-amber-300 cursor-pointer">
                  Enable Friday Night Social Play (Allow multiple players to share court)
                </label>
              </div>

              {/* Dynamic Real-time Pricing Breakdown & Payment Selector */}
              {(() => {
                const currentCourt = courts.find(c => c.id === bookingForm.courtId);
                const baseRate = currentCourt ? parseFloat(currentCourt.hourlyRate) : 0;
                const currentMember = members.find(m => m.id === bookingForm.memberId);
                const tierDiscountPct = currentMember?.tier?.courtDiscountPercent ? parseFloat(currentMember.tier.courtDiscountPercent) : 0;
                const discountAmt = (baseRate * tierDiscountPct) / 100;
                const amountToPay = Math.max(0, baseRate - discountAmt);
                const isStaff = user?.role === 'FRONT_DESK_STAFF' || user?.role === 'FRONT_DESK' || user?.role === 'OWNER';

                return (
                  <div className="space-y-4 pt-2">
                    {/* Fee Breakdown Box */}
                    <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5 shadow-inner">
                      <div className="flex justify-between items-center text-xs text-zinc-400">
                        <span>Standard 1-Hr Court Rate:</span>
                        <span className="font-mono text-zinc-200 font-semibold">₹{baseRate.toFixed(2)}</span>
                      </div>
                      {tierDiscountPct > 0 && (
                        <div className="flex justify-between items-center text-xs text-lime-400 font-medium">
                          <span>{currentMember?.tier?.name} Tier Discount ({tierDiscountPct}%):</span>
                          <span className="font-mono font-semibold">-₹{discountAmt.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Final Amount to Pay:</span>
                        <span className="text-base font-black text-lime-400 font-mono">
                          {amountToPay === 0 ? 'FREE (₹0.00)' : `₹${amountToPay.toFixed(2)}`}
                        </span>
                      </div>
                    </div>

                    {/* Payment Method Selector */}
                    {amountToPay === 0 ? (
                      <div className="p-3 bg-lime-400/10 border border-lime-400/30 rounded-xl text-xs font-semibold text-lime-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-lime-400 flex-shrink-0" />
                        <span>Complimentary session through 100% Membership Tier privilege.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-zinc-300">Payment Method</label>
                        <div className={`grid ${isStaff ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('ONLINE')}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                              paymentMethod === 'ONLINE'
                                ? 'bg-lime-400/10 border-lime-400 text-lime-300 shadow-xs'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <div>
                              <div className="text-xs font-bold flex items-center gap-1.5 text-zinc-100">
                                <span>💳 Pay Online (Razorpay)</span>
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-0.5">Card, UPI (GPay, PhonePe, Paytm)</div>
                            </div>
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              paymentMethod === 'ONLINE' ? 'border-lime-400 bg-lime-400' : 'border-zinc-700'
                            }`}>
                              {paymentMethod === 'ONLINE' && <div className="w-1.5 h-1.5 rounded-full bg-zinc-950"></div>}
                            </div>
                          </button>

                          {isStaff && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('CASH')}
                              className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                                paymentMethod === 'CASH'
                                  ? 'bg-lime-400/10 border-lime-400 text-lime-300 shadow-xs'
                                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                              }`}
                            >
                              <div>
                                <div className="text-xs font-bold flex items-center gap-1.5 text-zinc-100">
                                  <span>💵 Pay Cash (Offline)</span>
                                </div>
                                <div className="text-[10px] text-zinc-400 mt-0.5">Front desk cash collection</div>
                              </div>
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                paymentMethod === 'CASH' ? 'border-lime-400 bg-lime-400' : 'border-zinc-700'
                              }`}>
                                {paymentMethod === 'CASH' && <div className="w-1.5 h-1.5 rounded-full bg-zinc-950"></div>}
                              </div>
                            </button>
                          )}
                        </div>
                        {paymentMethod === 'ONLINE' && (
                          <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-800/50 text-xs text-sky-200 space-y-1">
                            <div className="font-bold flex items-center gap-1.5 text-sky-300 text-[11px]">
                              <Shield className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                              <span>Razorpay Test Mode Credentials:</span>
                            </div>
                            <div className="text-[11px] text-zinc-300 space-y-1">
                              <div>• <strong className="text-white">Domestic Visa Test Card:</strong> <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-lime-400 font-mono text-[11px]">4718 6091 0820 4366</code> (Exp: 12/28, CVV: 123)</div>
                              <div>• <strong className="text-white">Domestic Mastercard:</strong> <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-100 font-mono text-[11px]">5104 0600 0000 0008</code> (Exp: 12/28, CVV: 123)</div>
                              <div>• <strong className="text-white">Netbanking / UPI:</strong> Select any bank or UPI and tap <span className="text-emerald-400 font-bold">"Success"</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                      <button
                        type="button"
                        disabled={paymentLoading}
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2.5 text-zinc-400 hover:bg-zinc-800 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={paymentLoading}
                        className="px-5 py-2.5 bg-lime-400 hover:bg-lime-300 disabled:opacity-60 text-zinc-950 rounded-xl text-xs font-black shadow-lg shadow-lime-400/20 transition cursor-pointer flex items-center gap-2"
                      >
                        {paymentLoading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                            <span>Processing Payment...</span>
                          </>
                        ) : amountToPay === 0 ? (
                          <span>Confirm Free Booking</span>
                        ) : paymentMethod === 'ONLINE' ? (
                          <span>Pay ₹{amountToPay.toFixed(2)} Online</span>
                        ) : (
                          <span>Confirm Cash Booking (₹{amountToPay.toFixed(2)})</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
