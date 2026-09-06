import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import DemoBadge from './components/DemoBadge';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-700 flex items-center justify-center animate-pulse">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19.5 20a7.5 7.5 0 00-15 0"
              />
            </svg>
          </div>

          <p className="text-sm font-medium text-slate-600">
            Loading Smart Attendance...
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar
          user={user}
          setUser={setUser}
        />

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '10px',
              fontSize: '14px',
            },
          }}
        />

        <DemoBadge />

        <Routes>

          {/* Home */}
          <Route
            path="/"
            element={
              user ? (
                user.role === 'teacher' ? (
                  <Navigate to="/teacher/dashboard" replace />
                ) : (
                  <Navigate to="/student/dashboard" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Login */}
          <Route
            path="/login"
            element={
              !user ? (
                <Login setUser={setUser} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Register */}
          <Route
            path="/register"
            element={
              !user ? (
                <Register setUser={setUser} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Teacher */}
          <Route
            path="/teacher/dashboard"
            element={
              user?.role === 'teacher' ? (
                <TeacherDashboard user={user} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Student */}
          <Route
            path="/student/dashboard"
            element={
              user?.role === 'student' ? (
                <StudentDashboard user={user} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Unknown route */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;