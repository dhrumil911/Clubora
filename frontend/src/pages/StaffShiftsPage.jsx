import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  Clock, Plus, Calendar, UserCheck, UserX, AlertCircle,
  CheckCircle2, X, Users, Shield, Coffee, Briefcase
} from 'lucide-react';

export default function StaffShiftsPage({ isEmbedded = false }) {
  const [activeTab, setActiveTab] = useState('shifts');
  const [shifts, setShifts] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    staffName: '', role: 'Front Desk', date: '', startTime: '', endTime: ''
  });
  const [leaveForm, setLeaveForm] = useState({
    staffName: '', role: 'Front Desk', leaveType: 'CASUAL', startDate: '', endDate: '', reason: ''
  });

  useEffect(() => { fetchData(); }, [dateFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = dateFilter ? { date: dateFilter } : {};
      const [shiftRes, leaveRes] = await Promise.all([
        api.get('/shifts', { params }),
        api.get('/leaves')
      ]);
      setShifts(shiftRes.data);
      setLeaves(leaveRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    try {
      await api.post('/shifts', shiftForm);
      setShowShiftModal(false);
      setShiftForm({ staffName: '', role: 'Front Desk', date: '', startTime: '', endTime: '' });
      fetchData();
    } catch (err) { alert('Failed to create shift.'); }
  };

  const handleDeleteShift = async (id) => {
    if (!confirm('Delete this shift?')) return;
    try { await api.delete(`/shifts/${id}`); fetchData(); }
    catch (err) { alert('Failed to delete shift.'); }
  };

  const handleCreateLeave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leaves', leaveForm);
      setShowLeaveModal(false);
      setLeaveForm({ staffName: '', role: 'Front Desk', leaveType: 'CASUAL', startDate: '', endDate: '', reason: '' });
      fetchData();
    } catch (err) { alert('Failed to submit leave request.'); }
  };

  const handleReviewLeave = async (id, status) => {
    try {
      await api.put(`/leaves/${id}/review`, { status, reviewedBy: 'Owner' });
      fetchData();
    } catch (err) { alert('Failed to review leave request.'); }
  };

  const getRoleIcon = (role) => {
    if (role?.includes('Front') || role?.includes('Reception')) return <Shield className="w-4 h-4 text-lime-400" />;
    if (role?.includes('Bar') || role?.includes('Kitchen')) return <Coffee className="w-4 h-4 text-amber-400" />;
    if (role?.includes('Coach')) return <Users className="w-4 h-4 text-sky-400" />;
    return <Briefcase className="w-4 h-4 text-zinc-400" />;
  };

  const getShiftStatusBadge = (status) => {
    const map = {
      SCHEDULED: 'bg-sky-400/10 text-sky-400 border-sky-400/20',
      COMPLETED: 'bg-lime-400/10 text-lime-400 border-lime-400/20',
      CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${map[status] || 'bg-zinc-800 text-zinc-400'}`}>{status}</span>;
  };

  const getLeaveStatusBadge = (status) => {
    const map = {
      PENDING: 'bg-amber-400/10 text-amber-400 border border-amber-400/20',
      APPROVED: 'bg-lime-400/10 text-lime-400 border border-lime-400/20',
      DENIED: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${map[status] || 'bg-zinc-800 text-zinc-400'}`}>{status}</span>;
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayShifts = shifts.filter(s => s.date === todayStr);
  const pendingLeaves = leaves.filter(l => l.status === 'PENDING');

  return (
    <div className={isEmbedded ? 'w-full min-w-0 text-white' : 'max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-white'}>
      
      {/* Header */}
      <div className={isEmbedded ? 'owner-tab-actions flex justify-end' : 'flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6'}>
        {!isEmbedded && <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-lime-400" /> Staff Shifts & Leave Management
          </h1>
          <p className="text-zinc-400 text-sm mt-1 font-medium">
            Schedule employee shifts, manage work rosters, and approve leave requests.
          </p>
        </div>}
        <div className="flex gap-2">
          <button onClick={() => setShowShiftModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-2xl text-xs font-black shadow-lg shadow-lime-400/20 transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> Add Shift
          </button>
          <button onClick={() => setShowLeaveModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-2xl text-xs font-black shadow-lg shadow-amber-400/20 transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> Leave Request
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${isEmbedded ? 'mb-4' : 'mb-8'}`}>
        <div className="bg-zinc-900 text-white p-5 rounded-3xl border border-zinc-800 shadow-2xl">
          <div className="text-[10px] font-bold text-lime-400 uppercase tracking-wider">Total Shifts</div>
          <div className="text-2xl font-black mt-1">{shifts.length}</div>
        </div>
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-2xl">
          <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Today's Shifts</div>
          <div className="text-2xl font-black text-white mt-1">{todayShifts.length}</div>
        </div>
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-2xl">
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Pending Leave</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{pendingLeaves.length}</div>
        </div>
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-2xl">
          <div className="text-[10px] font-bold text-lime-400 uppercase tracking-wider">Total Staff on Leave</div>
          <div className="text-2xl font-black text-white mt-1">{leaves.filter(l => l.status === 'APPROVED').length}</div>
        </div>
      </div>

      {/* Tab Switch */}
      <div className={`bg-zinc-900 p-1.5 rounded-2xl flex gap-1 ${isEmbedded ? 'mb-4' : 'mb-6'} w-fit border border-zinc-800`}>
        <button onClick={() => setActiveTab('shifts')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition ${
            activeTab === 'shifts' ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20' : 'text-zinc-400 hover:text-white'
          }`}>
          <Calendar className="w-4 h-4" /> Shift Roster ({shifts.length})
        </button>
        <button onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition ${
            activeTab === 'leaves' ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20' : 'text-zinc-400 hover:text-white'
          }`}>
          <AlertCircle className="w-4 h-4" /> Leave Requests ({leaves.length})
          {pendingLeaves.length > 0 && (
            <span className="ml-1 w-5 h-5 bg-amber-400 text-zinc-950 rounded-full flex items-center justify-center text-[10px] font-black">{pendingLeaves.length}</span>
          )}
        </button>
      </div>

      {/* Shifts Tab */}
      {activeTab === 'shifts' && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Filter by Date:</label>
            <input type="date" value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:ring-1 focus:ring-lime-400" />
            {dateFilter && (
              <button onClick={() => setDateFilter('')} className="text-xs text-lime-400 font-bold hover:underline">Clear</button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full bg-zinc-900 p-8 rounded-3xl text-center text-zinc-500 border border-zinc-800 font-medium">Loading shifts...</div>
            ) : shifts.length === 0 ? (
              <div className="col-span-full bg-zinc-900 p-8 rounded-3xl text-center text-zinc-500 border border-zinc-800 font-medium">No shifts found.</div>
            ) : (
              shifts.map(s => (
                <div key={s.id} className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-2xl hover:border-zinc-700 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                        {getRoleIcon(s.role)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-sm">{s.staffName}</h4>
                        <div className="text-xs text-lime-400 font-bold">{s.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getShiftStatusBadge(s.status)}
                      <button onClick={() => handleDeleteShift(s.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 rounded-lg transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 pl-[52px]">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="font-medium text-white">{s.date}</span>
                      <span className="text-zinc-600">|</span>
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="font-black text-lime-400">{s.startTime} – {s.endTime}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Leaves Tab */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-zinc-900 p-8 rounded-3xl text-center text-zinc-500 border border-zinc-800 font-medium">Loading leave requests...</div>
          ) : leaves.length === 0 ? (
            <div className="bg-zinc-900 p-8 rounded-3xl text-center text-zinc-500 border border-zinc-800 font-medium">No leave requests found.</div>
          ) : (
            leaves.map(lv => (
              <div key={lv.id} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                        {getRoleIcon(lv.role)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-base">{lv.staffName}</h4>
                        <span className="text-xs text-zinc-400 font-medium">{lv.role}</span>
                      </div>
                      {getLeaveStatusBadge(lv.status)}
                      <span className="bg-zinc-950 text-zinc-300 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border border-zinc-800">{lv.leaveType}</span>
                    </div>
                    <div className="pl-[52px] text-xs text-zinc-400 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span><strong className="text-white">{lv.startDate}</strong> → <strong className="text-white">{lv.endDate}</strong></span>
                      </div>
                      {lv.reason && <p className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 italic text-zinc-300">"{lv.reason}"</p>}
                      {lv.reviewedBy && (
                        <div className="text-[10px] text-zinc-500">Reviewed by: <strong className="text-zinc-300">{lv.reviewedBy}</strong></div>
                      )}
                    </div>
                  </div>
                  {lv.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleReviewLeave(lv.id, 'APPROVED')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-xl text-xs font-black shadow-md shadow-lime-400/20">
                        <UserCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => handleReviewLeave(lv.id, 'DENIED')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 rounded-xl text-xs font-bold border border-rose-500/20">
                        <UserX className="w-3.5 h-3.5" /> Deny
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 w-[calc(100%-32px)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-800 text-white">
            <h3 className="text-2xl font-black text-white mb-6">Schedule New Shift</h3>
            <form onSubmit={handleCreateShift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Staff Name</label>
                <input type="text" required value={shiftForm.staffName}
                  onChange={(e) => setShiftForm({ ...shiftForm, staffName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 font-medium text-white"
                  placeholder="Employee name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Role</label>
                  <select value={shiftForm.role}
                    onChange={(e) => setShiftForm({ ...shiftForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 font-medium text-white">
                    <option>Front Desk</option>
                    <option>Bar/Kitchen</option>
                    <option>Tennis Coach</option>
                    <option>Cricket Coach</option>
                    <option>Maintenance</option>
                    <option>Management</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Date</label>
                  <input type="date" required value={shiftForm.date}
                    onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Start Time</label>
                  <input type="time" required value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">End Time</label>
                  <input type="time" required value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 text-white" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-5 border-t border-zinc-800">
                <button type="button" onClick={() => setShowShiftModal(false)}
                  className="px-5 py-2.5 text-zinc-400 hover:bg-zinc-800 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit"
                  className="px-6 py-2.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 rounded-xl text-xs font-black shadow-lg shadow-lime-400/20">
                  Schedule Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 w-[calc(100%-32px)] sm:w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-800 text-white">
            <h3 className="text-2xl font-black text-white mb-6">Submit Leave Request</h3>
            <form onSubmit={handleCreateLeave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Staff Name</label>
                  <input type="text" required value={leaveForm.staffName}
                    onChange={(e) => setLeaveForm({ ...leaveForm, staffName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 font-medium text-white"
                    placeholder="Employee name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Role</label>
                  <select value={leaveForm.role}
                    onChange={(e) => setLeaveForm({ ...leaveForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 font-medium text-white">
                    <option>Front Desk</option>
                    <option>Bar/Kitchen</option>
                    <option>Tennis Coach</option>
                    <option>Cricket Coach</option>
                    <option>Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Leave Type</label>
                  <select value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 font-medium text-white">
                    <option value="CASUAL">Casual</option>
                    <option value="SICK">Sick</option>
                    <option value="ANNUAL">Annual</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">From Date</label>
                  <input type="date" required value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">To Date</label>
                  <input type="date" required value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Reason</label>
                <textarea value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:ring-1 focus:ring-lime-400 font-medium text-white"
                  rows={2} placeholder="Reason for leave..." />
              </div>
              <div className="flex justify-end gap-3 pt-5 border-t border-zinc-800">
                <button type="button" onClick={() => setShowLeaveModal(false)}
                  className="px-5 py-2.5 text-zinc-400 hover:bg-zinc-800 rounded-xl text-xs font-bold">Cancel</button>
                <button type="submit"
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl text-xs font-black shadow-lg shadow-amber-400/20">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
