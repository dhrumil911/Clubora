import { useState, useEffect } from 'react';
import api from '../api';
import { Calendar as CalendarIcon, Clock, AlertTriangle, Plus, Users, Shield, CheckCircle2, X } from 'lucide-react';

export default function BookingsPage() {
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // Booking Modal State
  const [showModal, setShowModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    courtId: '',
    memberId: '',
    customerName: '',
    bookingDate: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    durationMinutes: 60,
    isSocialPlay: false,
    playersCount: 1
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00'
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

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
      setMembers(membersRes.data);
      if (courtsRes.data.length > 0) {
        setBookingForm(prev => ({ ...prev, courtId: courtsRes.data[0].id }));
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
    setErrorMsg('');
    setSuccessMsg('');

    const endTime = calculateEndTime(bookingForm.startTime, bookingForm.durationMinutes);

    try {
      await api.post('/bookings', {
        ...bookingForm,
        endTime
      });

      setSuccessMsg('Court session booked successfully!');
      setShowModal(false);
      fetchBookings();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to complete booking.');
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
    <div className="max-w-7xl mx-auto px-4 py-8 bg-zinc-950 min-h-screen text-zinc-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-lime-400" /> Court Booking Engine
          </h1>
          <p className="text-zinc-400 text-xs mt-1 font-medium">
            Real-time schedule grid with 1-hour sessions starting every 30 minutes. Anti-double booking & 2 bookings/day limit enforced.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-white shadow-inner focus:ring-2 focus:ring-lime-400"
          />
          <button
            onClick={() => {
              setBookingForm(prev => ({ ...prev, bookingDate: selectedDate }));
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 bg-lime-400 hover:bg-lime-300 text-zinc-950 px-5 py-2.5 rounded-xl font-black text-xs shadow-lg shadow-lime-400/20 transition"
          >
            <Plus className="w-4 h-4" /> Book a Court
          </button>
        </div>
      </div>

      {/* Booking Rules Infobar */}
      <div className="bg-zinc-900 text-zinc-300 p-4 rounded-2xl mb-8 flex flex-wrap items-center justify-between gap-4 border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-lime-400" />
          <span>Sessions: 1 Hour (New slot opens every 30 mins)</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          <Shield className="w-4 h-4 text-sky-400" />
          <span>Gold: Free | Silver/Junior: 50% Off | Walk-in: Full Price</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Member Max Limit: 2 Bookings/Day</span>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/80 text-emerald-200 text-xs p-4 rounded-2xl border border-emerald-800 mb-6 flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4 text-emerald-400" /></button>
        </div>
      )}

      {/* Courts Schedule Table / Grid */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                <th className="py-3 px-4 w-40 sticky left-0 bg-zinc-950 z-10 border-r border-zinc-800">Court / Sport</th>
                {timeSlots.map(slot => (
                  <th key={slot} className="py-3 px-2 text-center border-r border-zinc-800 min-w-[70px]">
                    {slot}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-xs">
              {courts.map(court => (
                <tr key={court.id} className="hover:bg-zinc-800/30">
                  <td className="py-3 px-4 font-black text-white sticky left-0 bg-zinc-900 z-10 border-r border-zinc-800 shadow-xl">
                    <div>{court.name}</div>
                    <div className="text-[10px] font-mono text-lime-400 font-bold">${court.hourlyRate}/hr</div>
                  </td>
                  {timeSlots.map(slot => {
                    const activeBookings = isSlotBooked(court.id, slot);
                    const isBooked = activeBookings.length > 0;
                    const booking = activeBookings[0];

                    return (
                      <td key={slot} className="p-1 border-r border-zinc-800 text-center relative h-14">
                        {isBooked ? (
                          <div
                            onClick={() => handleCancelBooking(booking.id)}
                            title={`Booked by ${booking.customerName} (${booking.startTime} - ${booking.endTime}). Click to cancel.`}
                            className={`w-full h-full rounded-xl p-1 flex flex-col justify-center items-center text-[10px] font-black cursor-pointer transition shadow-md ${
                              booking.isSocialPlay
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                : 'bg-lime-400 text-zinc-950 border border-lime-300'
                            }`}
                          >
                            <span className="truncate max-w-[60px]">{booking.customerName.split(' ')[0]}</span>
                            <span className="text-[9px] opacity-80">{booking.startTime}</span>
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
                            className="w-full h-full rounded-xl border border-dashed border-zinc-800 hover:border-lime-400 hover:bg-lime-400/10 transition flex items-center justify-center text-zinc-600 hover:text-lime-400 font-bold"
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

      {/* Book Court Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-zinc-800 text-zinc-100 max-h-[90vh] overflow-y-auto">
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
                      <option key={c.id} value={c.id}>{c.name} (${c.hourlyRate}/hr)</option>
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

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:bg-zinc-800 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-xl text-xs font-black shadow-lg shadow-lime-400/20"
                >
                  Confirm Court Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
