import { useState, useEffect } from 'react';
import { sessionService } from '../services/api';
import toast from 'react-hot-toast';
import LiveClock from '../components/LiveClock';
import socket from '../socket';

const TeacherDashboard = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [qrToken, setQrToken] = useState('');
  const [expiry, setExpiry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [presentCount, setPresentCount] = useState(0);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await sessionService.getSessions();
      let sessionsData = res.data;
      if (!Array.isArray(sessionsData)) {
        sessionsData = sessionsData?.data || sessionsData?.sessions || [];
      }
      setSessions(sessionsData);
    } catch (err) {
      toast.error('Failed to load sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (sessionId) => {
    try {
      const res = await sessionService.getSessionAttendance(sessionId);
      let attendanceData = res.data?.attendance;
      if (!Array.isArray(attendanceData)) {
        attendanceData = [];
      }
      setAttendance(attendanceData);
    } catch (err) {
      toast.error('Failed to load attendance');
      setAttendance([]);
    }
  };

  const createSession = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await sessionService.createSession({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setQrCode(res.data.qr);
          setQrToken(res.data.qrToken);
          setExpiry(new Date(res.data.session.expiry));
          setShowQR(true);
          fetchSessions();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to create session');
        }
      },
      () => toast.error('Location access denied')
    );
  };

  const exportAttendanceCSV = () => {
    if (!selectedSession || attendance.length === 0) {
      toast.error('No attendance data to export');
      return;
    }
    const headers = ['Student Name', 'Email', 'Status', 'Time', 'Location (Lat, Lng)', 'Reason'];
    const rows = attendance.map(a => [
      a.studentId?.name || 'N/A',
      a.studentId?.email || 'N/A',
      a.status,
      new Date(a.createdAt || a.timestamp).toLocaleString(), // fallback to timestamp if needed
      `${a.locationLat?.toFixed(6) || 'N/A'}, ${a.locationLng?.toFixed(6) || 'N/A'}`,
      a.rejectionReason || '-'
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedSession.sessionId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Attendance exported');
  };

  // Auto-close QR modal after 60 seconds
  useEffect(() => {
    if (qrCode) {
      const timer = setTimeout(() => {
        setShowQR(false);
        setQrCode(null);
        setQrToken('');
      }, 60000);
      return () => clearTimeout(timer);
    }
  }, [qrCode]);

  // Auto-refresh every 5 seconds (polling)
  useEffect(() => {
    fetchSessions();
    const interval = setInterval(() => {
      fetchSessions();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Socket real‑time refresh
  useEffect(() => {
    const handleAttendanceUpdate = () => {
      fetchSessions();
    };
    socket.on('attendance_update', handleAttendanceUpdate);
    return () => {
      socket.off('attendance_update', handleAttendanceUpdate);
    };
  }, []);

  // Selected session live updates
  useEffect(() => {
    if (!selectedSession) return;

    const handleLiveUpdate = (count) => {
      setPresentCount(count);
      fetchAttendance(selectedSession._id);
      toast.success('New attendance recorded');
    };

    socket.emit('join_session', selectedSession._id);
    socket.on('attendance_update', handleLiveUpdate);

    return () => {
      socket.emit('leave_session', selectedSession._id);
      socket.off('attendance_update', handleLiveUpdate);
    };
  }, [selectedSession]);

  // ✅ FIXED stats calculations – use presentCount and totalMarked
  const totalSessions = Array.isArray(sessions) ? sessions.length : 0;
  const totalPresent = Array.isArray(sessions)
    ? sessions.reduce((sum, s) => sum + (s.presentCount || 0), 0)
    : 0;
  const totalAttendance = Array.isArray(sessions)
    ? sessions.reduce((sum, s) => sum + (s.totalMarked || 0), 0)
    : 0;
  const avgAttendance = totalAttendance === 0 ? 0 : ((totalPresent / totalAttendance) * 100).toFixed(1);

  return (
    <div className="container mx-auto px-4 py-8 text-white">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
            Teacher Dashboard
          </h1>
          <p className="text-gray-300 mt-1">Manage attendance sessions • {user.name}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <LiveClock />
          <button
            onClick={fetchSessions}
            className="text-sm bg-white/10 px-3 py-1 rounded-lg hover:bg-white/20 transition"
          >
            🔄 Refresh Sessions
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-4 text-center hover:scale-105 transition-transform cursor-pointer">
          <div className="text-3xl font-bold text-purple-400">{totalSessions}</div>
          <div className="text-sm text-gray-300">📋 Total Sessions</div>
        </div>
        <div className="glass-card p-4 text-center hover:scale-105 transition-transform cursor-pointer">
          <div className="text-3xl font-bold text-green-400">{totalPresent}</div>
          <div className="text-sm text-gray-300">✅ Total Present</div>
        </div>
        <div className="glass-card p-4 text-center hover:scale-105 transition-transform cursor-pointer">
          <div className="text-3xl font-bold text-blue-400">{avgAttendance}%</div>
          <div className="text-sm text-gray-300">📊 Avg Attendance Rate</div>
        </div>
      </div>

      {/* Create Session + Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            🎯 Create New Session
            <span className="text-xs bg-purple-600 px-2 py-1 rounded-full">QR + GPS</span>
          </h2>
          <p className="text-gray-300 mb-4 text-sm">
            Generate a time‑limited QR code (60s) with your current GPS location.
            Students must be within 50m to mark present.
          </p>
          <button onClick={createSession} className="btn-primary w-full py-3 text-lg">
            📍 Create Attendance Session
          </button>
        </div>
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold mb-4">💡 Pro Tips</h2>
          <ul className="space-y-3 text-gray-300">
            <li>• Each QR code expires after 60 seconds for security.</li>
            <li>• Students must enable GPS – distance is validated automatically.</li>
            <li>• Real‑time updates appear instantly when a student scans.</li>
            <li>• Export attendance as CSV for record keeping.</li>
          </ul>
        </div>
      </div>

      {/* Sessions List */}
      <h2 className="text-2xl font-bold mb-4">📌 Your Sessions ({totalSessions})</h2>
      {loading ? (
        <p>Loading sessions...</p>
      ) : totalSessions === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-gray-400">No sessions created yet. Click "Create Session" above to start.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {sessions.map((s) => (
            <div
              key={s._id}
              className="glass-card p-4 hover:scale-102 transition-all cursor-pointer"
              onClick={() => { setSelectedSession(s); fetchAttendance(s._id); }}
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-mono text-xs text-gray-400">{s.sessionId?.substring(0, 8)}...</p>
                <span className={`text-xs px-2 py-1 rounded-full ${new Date(s.expiry) > new Date() ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {new Date(s.expiry) > new Date() ? 'Active' : 'Expired'}
                </span>
              </div>
              <p className="text-gray-200 text-sm">📅 {new Date(s.createdAt).toLocaleString()}</p>
              <div className="mt-2 flex justify-between items-center">
                <div>
                  {/* ✅ FIXED: use presentCount and totalMarked directly */}
                  <span className="text-green-400 font-bold">{s.presentCount || 0}</span>
                  <span className="text-gray-400"> / {s.totalMarked || 0}</span>
                </div>
                <button className="text-purple-400 text-sm hover:text-purple-300">View →</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && qrCode && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="glass-card p-6 text-center max-w-md w-full animate-fadeIn shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">📱 QR Code (valid 60s)</h2>
            <p className="text-green-400 mb-2">👨‍🎓 {presentCount} Students Present (Live)</p>
            <img src={qrCode} alt="QR" className="w-64 h-64 mx-auto mb-4 rounded-lg border-4 border-purple-500 shadow-lg" />
            <p className="text-red-300">Expires at {expiry?.toLocaleTimeString()}</p>
            {qrToken && (
              <div className="mt-4">
                <p className="text-sm text-gray-400">QR Token (JWT):</p>
                <div className="bg-black/40 p-2 rounded text-xs break-all font-mono">{qrToken}</div>
                <button onClick={() => { navigator.clipboard.writeText(qrToken); toast.success('Token copied'); }} className="mt-2 text-blue-400 text-sm">📋 Copy Token</button>
              </div>
            )}
            <button onClick={createSession} className="btn-primary mt-4 w-full">🔄 Generate New QR</button>
            <button onClick={() => setShowQR(false)} className="btn-secondary mt-2 w-full">Close</button>
          </div>
        </div>
      )}

      {/* Attendance Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto">
          <div className="glass-card p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Attendance Details</h2>
              <button onClick={() => setSelectedSession(null)} className="text-red-400">✕</button>
            </div>
            <div className="mb-4 p-3 bg-white/5 rounded-lg">
              <p>Session ID: {selectedSession.sessionId}</p>
              <p>Created: {new Date(selectedSession.createdAt).toLocaleString()}</p>
              <p>Status: {new Date(selectedSession.expiry) > new Date() ? 'Active' : 'Expired'}</p>
            </div>
            <div className="flex justify-end mb-4">
              <button onClick={exportAttendanceCSV} className="btn-secondary text-sm">📥 Export CSV</button>
            </div>
            {attendance.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No students have marked attendance yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="glass-table min-w-full">
                  <thead>
                    <tr><th>Student</th><th>Email</th><th>Status</th><th>Time</th><th>Reason</th></tr>
                  </thead>
                  <tbody>
                    {attendance.map((a) => (
                      <tr key={a._id}>
                        <td className="p-3">{a.studentId?.name}</td>
                        <td className="p-3 text-sm">{a.studentId?.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${a.status === 'Present' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {a.status}
                          </span>
                        </td>
                        {/* ✅ FIXED: use createdAt instead of timestamp */}
                        <td className="p-3 text-sm">{new Date(a.createdAt || a.timestamp).toLocaleTimeString()}</td>
                        <td className="p-3 text-sm text-gray-400">{a.rejectionReason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;