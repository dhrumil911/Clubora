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
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-sky-600" /> Court Booking Engine
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time schedule grid with 1-hour sessions starting every 30 minutes. Anti-double booking & 2 bookings/day limit enforced.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 shadow-sm focus:ring-2 focus:ring-sky-500"
          />
          <button
            onClick={() => {
              setBookingForm(prev => ({ ...prev, bookingDate: selectedDate }));
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-sky-600/20"
          >
            <Plus className="w-4 h-4" /> Book a Court
          </button>
        </div>
      </div>

      {/* Booking Rules Infobar */}
      <div className="bg-sky-900 text-sky-100 p-4 rounded-2xl mb-8 flex flex-wrap items-center justify-between gap-4 border border-sky-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-sky-400" />
          <span>Sessions: 1 Hour (New slot opens every 30 mins)</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Gold: Free | Silver/Junior: 50% Off | Walk-in: Full Price</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Member Max Limit: 2 Bookings/Day</span>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-700 text-sm p-4 rounded-2xl border border-emerald-200 mb-6 flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Courts Schedule Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-40 sticky left-0 bg-slate-100 z-10 border-r border-slate-200">Court / Sport</th>
                {timeSlots.map(slot => (
                  <th key={slot} className="py-3 px-2 text-center border-r border-slate-200 min-w-[70px]">
                    {slot}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {courts.map(court => (
                <tr key={court.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-sm">
                    <div>{court.name}</div>
                    <div className="text-[10px] font-semibold text-slate-400 font-mono">${court.hourlyRate}/hr</div>
                  </td>
                  {timeSlots.map(slot => {
                    const activeBookings = isSlotBooked(court.id, slot);
                    const isBooked = activeBookings.length > 0;
                    const booking = activeBookings[0];

                    return (
                      <td key={slot} className="p-1 border-r border-slate-200 text-center relative h-14">
                        {isBooked ? (
                          <div
                            onClick={() => handleCancelBooking(booking.id)}
                            title={`Booked by ${booking.customerName} (${booking.startTime} - ${booking.endTime}). Click to cancel.`}
                            className={`w-full h-full rounded-lg p-1 flex flex-col justify-center items-center text-[10px] font-bold cursor-pointer transition ${
                              booking.isSocialPlay
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-sky-600 text-white shadow-sm'
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
                            className="w-full h-full rounded-lg border border-dashed border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition flex items-center justify-center text-slate-300 hover:text-sky-600 font-semibold"
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100">
            <h3 className="text-xl font-extrabold text-slate-900 mb-1">Book a Court Session</h3>
            <p className="text-xs text-slate-500 mb-6">Anti-double booking and daily limits will be automatically validated.</p>

            {errorMsg && (
              <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-xl border border-rose-200 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Court</label>
                  <select
                    value={bookingForm.courtId}
                    onChange={(e) => setBookingForm({ ...bookingForm, courtId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    {courts.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (${c.hourlyRate}/hr)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Booking Date</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.bookingDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Member (for Tier Discount)</label>
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 font-medium"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Walk-in Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Guest Name"
                    value={bookingForm.customerName}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                  <select
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                  >
                    {timeSlots.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                  <select
                    value={bookingForm.durationMinutes}
                    onChange={(e) => setBookingForm({ ...bookingForm, durationMinutes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500"
                  >
                    <option value={60}>1 Hour Session</option>
                    <option value={90}>1.5 Hours Session</option>
                    <option value={120}>2 Hours Session</option>
                  </select>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="socialPlay"
                  checked={bookingForm.isSocialPlay}
                  onChange={(e) => setBookingForm({ ...bookingForm, isSocialPlay: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <label htmlFor="socialPlay" className="text-xs font-semibold text-amber-900 cursor-pointer">
                  Enable Friday Night Social Play (Allow multiple players to share court)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-600/20"
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
