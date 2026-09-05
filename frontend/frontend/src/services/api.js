import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper to transform backend response to frontend format
const transformAuthResponse = (response) => {
  const { token, user } = response.data;
  return {
    data: {
      token,
      ...user,
    },
  };
};

export const authService = {
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return transformAuthResponse(response);
  },
  login: async (data) => {
    const response = await api.post('/auth/login', data);
    return transformAuthResponse(response);
  },
};

export const sessionService = {
  createSession: (location) => api.post('/sessions', location),
  getSessions: () => api.get('/sessions'),
  getSessionAttendance: (sessionId) => api.get(`/sessions/${sessionId}/attendance`),
};

export const attendanceService = {
  markAttendance: (qrToken, location, faceDescriptor) =>
    api.post('/attendance/mark', {
      qrToken,
      location,
      faceDescriptor
    }),

  getMyAttendance: () =>
    api.get('/attendance/my-attendance'),
};

export default api;