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
    if (token && storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  if (loading) return <div className="text-center mt-20 text-white">Loading...</div>;

  return (
    <BrowserRouter>
      <Navbar user={user} setUser={setUser} />
      <Toaster position="top-right" />
      <DemoBadge />
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              user.role === 'teacher' ? (
                <Navigate to="/teacher/dashboard" />
              ) : (
                <Navigate to="/student/dashboard" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/login"
          element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />}
        />
        <Route
          path="/register"
          element={!user ? <Register setUser={setUser} /> : <Navigate to="/" />}
        />
        <Route
          path="/teacher/dashboard"
          element={
            user?.role === 'teacher' ? <TeacherDashboard user={user} /> : <Navigate to="/" />
          }
        />
        <Route
          path="/student/dashboard"
          element={
            user?.role === 'student' ? <StudentDashboard user={user} /> : <Navigate to="/" />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;