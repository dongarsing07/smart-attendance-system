// Mock API service – works without any backend
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory storage
let users = [
  { 
    _id: 'teacher1', 
    name: 'Demo Teacher', 
    email: 'teacher@demo.com', 
    role: 'teacher', 
    token: 'mock-token-teacher',
    prn: null,
    branch: null
  },
  { 
    _id: 'student1', 
    name: 'Demo Student', 
    email: 'student@demo.com', 
    role: 'student', 
    token: 'mock-token-student',
    prn: '2024CS001',
    branch: 'Computer Engineering'
  },
];
let sessions = [];
let attendanceRecords = [];

export const authService = {
  register: async (data) => {
    await delay(800);
    if (users.find(u => u.email === data.email)) {
      throw { response: { data: { message: 'User already exists' } } };
    }
    const newUser = {
      _id: Date.now().toString(),
      name: data.name,
      email: data.email,
      role: data.role,
      token: `mock-token-${Date.now()}`,
      prn: data.prn || null,
      branch: data.branch || null,
    };
    users.push(newUser);
    return { data: newUser };
  },
  login: async ({ email, password }) => {
    await delay(800);
    let user = users.find(u => u.email === email);
    if (!user) {
      const role = email.includes('teacher') ? 'teacher' : 'student';
      user = {
        _id: Date.now().toString(),
        name: email.split('@')[0],
        email,
        role,
        token: `mock-token-${Date.now()}`,
        prn: role === 'student' ? `PRN${Date.now()}` : null,
        branch: role === 'student' ? 'Computer Engineering' : null,
      };
      users.push(user);
    }
    return { data: user };
  },
};

export const sessionService = {
  createSession: async (location) => {
    await delay(1000);
    const sessionId = Math.random().toString(36).substring(7);
    const expiry = new Date(Date.now() + 60000);
    const newSession = {
      _id: Date.now().toString(),
      sessionId,
      createdBy: 'teacher1',
      expiry,
      latitude: location.latitude,
      longitude: location.longitude,
      createdAt: new Date(),
    };
    sessions.unshift(newSession);
    const qrCode = 'https://via.placeholder.com/300?text=DEMO+QR+CODE';
    return { data: { session: newSession, qrCode } };
  },
  getSessions: async () => {
    await delay(500);
    const mySessions = sessions.filter(s => s.createdBy === 'teacher1');
    const withStats = mySessions.map(s => ({
      ...s,
      stats: {
        present: attendanceRecords.filter(a => a.sessionId === s._id && a.status === 'Present').length,
        total: attendanceRecords.filter(a => a.sessionId === s._id).length,
      }
    }));
    return { data: withStats };
  },
  getSessionAttendance: async (sessionId) => {
    await delay(500);
    const records = attendanceRecords.filter(a => a.sessionId === sessionId).map(a => ({
      ...a,
      studentId: { name: a.studentName, email: a.studentEmail, prn: a.studentPRN, branch: a.studentBranch }
    }));
    return { data: { attendance: records } };
  },
};

export const attendanceService = {
  markAttendance: async (qrToken, location) => {
    await delay(1200);
    if (!sessions.length) throw { response: { data: { message: 'No active session' } } };
    const distance = Math.random() * 100;
    const isPresent = distance <= 50;
    const status = isPresent ? 'Present' : 'Rejected';
    const rejectionReason = isPresent ? null : `Distance ${Math.round(distance)}m > 50m`;
    
    // Get logged-in student details (mock)
    const student = users.find(u => u.role === 'student') || users[1];
    
    const newAttendance = {
      _id: Date.now().toString(),
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      studentPRN: student.prn,
      studentBranch: student.branch,
      sessionId: sessions[0]._id,
      status,
      locationLat: location.lat,
      locationLng: location.lng,
      rejectionReason,
      timestamp: new Date(),
      distance: Math.round(distance),
    };
    attendanceRecords.push(newAttendance);
    return { data: { 
      message: status === 'Present' ? 'Attendance marked' : 'Location out of range', 
      status, 
      distance: Math.round(distance), 
      rejectionReason 
    } };
  },
  getMyAttendance: async () => {
    await delay(500);
    // Return records for the current mock student
    const student = users.find(u => u.role === 'student') || users[1];
    const myRecords = attendanceRecords.filter(a => a.studentId === student._id);
    return { data: myRecords };
  },
};