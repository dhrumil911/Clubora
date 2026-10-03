import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  Clock, Plus, Calendar, UserCheck, UserX, AlertCircle,
  CheckCircle2, X, Users, Shield, Coffee, Briefcase
} from 'lucide-react';

export default function StaffShiftsPage() {
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
    if (role?.includes('Front') || role?.includes('Reception')) return <Shield className="w-4 h-4 text-indigo-500" />;
    if (role?.includes('Bar') || role?.includes('Kitchen')) return <Coffee className="w-4 h-4 text-amber-500" />;
    if (role?.includes('Coach')) return <Users className="w-4 h-4 text-sky-500" />;
    return <Briefcase className="w-4 h-4 text-slate-400" />;
  };

  const getShiftStatusBadge = (status) => {
    const map = {
      SCHEDULED: 'bg-sky-100 text-sky-800 border-sky-200',
      COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
  };

  const getLeaveStatusBadge = (status) => {
    const map = {
      PENDING: 'bg-amber-100 text-amber-800',
      APPROVED: 'bg-emerald-100 text-emerald-800',
      DENIED: 'bg-rose-100 text-rose-800',
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayShifts = shifts.filter(s => s.date === todayStr);
  const pendingLeaves = leaves.filter(l => l.status === 'PENDING');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-7 h-7 text-sky-600" /> Staff Shifts & Leave Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Schedule employee shifts, manage work rosters, and approve leave requests.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowShiftModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-sky-600/20 transition-all">
            <Plus className="w-3.5 h-3.5" /> Add Shift
          </button>
          <button onClick={() => setShowLeaveModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-amber-600/20 transition-all">
            <Plus className="w-3.5 h-3.5" /> Leave Request
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800">
          <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Total Shifts</div>
          <div className="text-2xl font-extrabold mt-1">{shifts.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Today's Shifts</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{todayShifts.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Pending Leave</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{pendingLeaves.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Total Staff on Leave</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{leaves.filter(l => l.status === 'APPROVED').length}</div>
        </div>
      </div>

      {/* Tab Switch */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 mb-6 w-fit">
        <button onClick={() => setActiveTab('shifts')}
          className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'shifts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}>
          <Calendar className="w-3.5 h-3.5" /> Shift Roster ({shifts.length})
        </button>
        <button onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'leaves' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}>
          <AlertCircle className="w-3.5 h-3.5" /> Leave Requests ({leaves.length})
          {pendingLeaves.length > 0 && (
            <span className="ml-1 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-extrabold">{pendingLeaves.length}</span>
          )}
        </button>
      </div>

      {/* Shifts Tab */}
      {activeTab === 'shifts' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs font-semibold text-slate-600">Filter by Date:</label>
            <input type="date" value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500" />
            {dateFilter && (
              <button onClick={() => setDateFilter('')} className="text-xs text-sky-600 font-bold hover:underline">Clear</button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full bg-white p-8 rounded-2xl text-center text-slate-400 border border-slate-200">Loading shifts...</div>
            ) : shifts.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-2xl text-center text-slate-500 border border-slate-200">No shifts found.</div>
            ) : (
              shifts.map(s => (
                <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        {getRoleIcon(s.role)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{s.staffName}</h4>
                        <div className="text-xs text-sky-600 font-semibold">{s.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getShiftStatusBadge(s.status)}
                      <button onClick={() => handleDeleteShift(s.id)}
                        className="p-1 text-slate-300 hover:text-rose-600 rounded transition">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pl-[52px]">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span className="font-medium">{s.date}</span>
                      <span className="text-slate-300">|</span>
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="font-bold text-slate-700">{s.startTime} – {s.endTime}</span>
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
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white p-8 rounded-2xl text-center text-slate-400 border border-slate-200">Loading leave requests...</div>
          ) : leaves.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl text-center text-slate-500 border border-slate-200">No leave requests found.</div>
          ) : (
            leaves.map(lv => (
              <div key={lv.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                        {getRoleIcon(lv.role)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{lv.staffName}</h4>
                        <span className="text-xs text-slate-500 font-medium">{lv.role}</span>
                      </div>
                      {getLeaveStatusBadge(lv.status)}
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px] font-bold">{lv.leaveType}</span>
                    </div>
                    <div className="pl-[52px] text-xs text-slate-500 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span><strong>{lv.startDate}</strong> → <strong>{lv.endDate}</strong></span>
                      </div>
                      {lv.reason && <p className="bg-slate-50 p-2 rounded-lg border border-slate-100 italic">"{lv.reason}"</p>}
                      {lv.reviewedBy && (
                        <div className="text-[10px] text-slate-400">Reviewed by: <strong>{lv.reviewedBy}</strong></div>
                      )}
                    </div>
                  </div>
                  {lv.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleReviewLeave(lv.id, 'APPROVED')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm">
                        <UserCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => handleReviewLeave(lv.id, 'DENIED')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold border border-rose-200">
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-xl font-extrabold text-slate-900 mb-4">Schedule New Shift</h3>
            <form onSubmit={handleCreateShift} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Name</label>
                <input type="text" required value={shiftForm.staffName}
                  onChange={(e) => setShiftForm({ ...shiftForm, staffName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 font-medium"
                  placeholder="Employee name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select value={shiftForm.role}
                    onChange={(e) => setShiftForm({ ...shiftForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 font-medium">
                    <option>Front Desk</option>
                    <option>Bar/Kitchen</option>
                    <option>Tennis Coach</option>
                    <option>Cricket Coach</option>
                    <option>Maintenance</option>
                    <option>Management</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input type="date" required value={shiftForm.date}
                    onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                  <input type="time" required value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                  <input type="time" required value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowShiftModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold">Cancel</button>
                <button type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-600/20">
                  Schedule Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Leave Request Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-xl font-extrabold text-slate-900 mb-4">Submit Leave Request</h3>
            <form onSubmit={handleCreateLeave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Name</label>
                  <input type="text" required value={leaveForm.staffName}
                    onChange={(e) => setLeaveForm({ ...leaveForm, staffName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 font-medium"
                    placeholder="Employee name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select value={leaveForm.role}
                    onChange={(e) => setLeaveForm({ ...leaveForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 font-medium">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Type</label>
                  <select value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 font-medium">
                    <option value="CASUAL">Casual</option>
                    <option value="SICK">Sick</option>
                    <option value="ANNUAL">Annual</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">From Date</label>
                  <input type="date" required value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">To Date</label>
                  <input type="date" required value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason</label>
                <textarea value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 font-medium"
                  rows={2} placeholder="Reason for leave..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-semibold">Cancel</button>
                <button type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-600/20">
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
