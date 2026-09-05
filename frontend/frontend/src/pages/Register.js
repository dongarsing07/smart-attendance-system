import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const Register = ({ setUser }) => {
  const [step, setStep] = useState('select'); // 'select' or 'form'
  const [selectedRole, setSelectedRole] = useState(null);
  const [form, setForm] = useState({
    name: '',
    prn: '',
    email: '',
    branch: '',
    password: '',
    confirmPassword: '',
    role: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const branches = [
    'Computer Engineering',
    'Information Technology',
    'Artificial Intelligence & Data Science',
    'Artificial Intelligence & Machine Learning',
    'Electronics & Telecommunication',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering',
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setForm((prev) => ({ ...prev, role, prn: '', branch: '' }));
    setStep('form');
  };

  const handleBackToRoles = () => {
    setStep('select');
    setSelectedRole(null);
    setForm({
      name: '',
      prn: '',
      email: '',
      branch: '',
      password: '',
      confirmPassword: '',
      role: '',
    });
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      const res = await authService.register(data);
      const { token, ...userData } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      toast.success('Registration successful!');
      navigate(userData.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Role Selection
  if (step === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Background animations */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900 to-purple-900/20 -z-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="text-center mb-12 w-full max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-4">
            Join Smart Attendance
          </h1>
          <p className="text-gray-300 text-lg">Select your role to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
          {/* Student Card */}
          <div
            onClick={() => handleRoleSelect('student')}
            className="glass-card p-8 text-center cursor-pointer group hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-blue-500/50"
          >
            <div className="text-7xl mb-4 group-hover:animate-bounce">👨‍🎓</div>
            <h2 className="text-2xl font-bold text-white mb-2">Student</h2>
            <p className="text-gray-300">Scan QR codes, mark attendance, track your history</p>
          </div>

          {/* Teacher Card */}
          <div
            onClick={() => handleRoleSelect('teacher')}
            className="glass-card p-8 text-center cursor-pointer group hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-purple-500/50"
          >
            <div className="text-7xl mb-4 group-hover:animate-bounce">👩‍🏫</div>
            <h2 className="text-2xl font-bold text-white mb-2">Teacher</h2>
            <p className="text-gray-300">Create sessions, generate QR codes, view attendance reports</p>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Sign in →
          </Link>
        </div>
      </div>
    );
  }

  // Step 2: Registration Form (dynamic for selected role)
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900 to-purple-900/20 -z-10" />
      <div className="glass-card w-full max-w-2xl p-8 space-y-6 shadow-2xl">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">
            Register as {selectedRole === 'student' ? 'Student' : 'Teacher'}
          </h2>
          <button
            onClick={handleBackToRoles}
            className="text-gray-400 hover:text-white transition text-sm"
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              className="input-field"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* PRN (only for students) */}
          {selectedRole === 'student' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                PRN (Permanent Registration Number) *
              </label>
              <input
                type="text"
                name="prn"
                placeholder="e.g., 231101151"
                className="input-field"
                value={form.prn}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email Address *</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              className="input-field"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Branch (only for students) */}
          {selectedRole === 'student' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Branch *</label>
              <select
                name="branch"
                className="input-field"
                value={form.branch}
                onChange={handleChange}
                required
              >
                <option value="">Select your branch</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password *</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              className="input-field"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              className="input-field"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-lg transition-all hover:shadow-lg hover:shadow-blue-500/25"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-gray-300">
          Already have an account? <Link to="/login" className="text-blue-400">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
