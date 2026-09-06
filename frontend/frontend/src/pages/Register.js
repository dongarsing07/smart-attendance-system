import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/api";
import toast from "react-hot-toast";

const Register = ({ setUser }) => {
  const [step, setStep] = useState("select");
  const [selectedRole, setSelectedRole] = useState(null);

  const [form, setForm] = useState({
    name: "",
    prn: "",
    email: "",
    branch: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const branches = [
    "Computer Engineering",
    "Information Technology",
    "Artificial Intelligence & Data Science",
    "Artificial Intelligence & Machine Learning",
    "Electronics & Telecommunication",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Civil Engineering",
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);

    setForm((prev) => ({
      ...prev,
      role,
      prn: "",
      branch: "",
    }));

    setStep("form");
  };

  const handleBack = () => {
    setStep("select");
    setSelectedRole(null);

    setForm({
      name: "",
      prn: "",
      email: "",
      branch: "",
      password: "",
      confirmPassword: "",
      role: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getPasswordStrength = () => {
    const password = form.password;

    if (!password) {
      return {
        label: "",
        width: "0%",
        level: 0,
      };
    }

    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) {
      return {
        label: "Weak password",
        width: "25%",
        level: 1,
      };
    }

    if (score === 2) {
      return {
        label: "Fair password",
        width: "50%",
        level: 2,
      };
    }

    if (score === 3) {
      return {
        label: "Good password",
        width: "75%",
        level: 3,
      };
    }

    return {
      label: "Strong password",
      width: "100%",
      level: 4,
    };
  };

  const passwordStrength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const prn = form.prn.trim();

    if (!name) {
      toast.error("Please enter your full name");
      return;
    }

    if (selectedRole === "student" && !prn) {
      toast.error("Please enter your PRN");
      return;
    }

    if (selectedRole === "student" && !form.branch) {
      toast.error("Please select your branch");
      return;
    }

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const data = {
        name,
        email,
        password: form.password,
        role: form.role,
      };

      if (selectedRole === "student") {
        data.prn = prn;
        data.branch = form.branch;
      }

      const res = await authService.register(data);

      const { token, ...userData } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);

      toast.success("Registration successful!");

      if (userData.role === "teacher") {
        navigate("/teacher/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     ROLE SELECTION
  ============================================================ */

  if (step === "select") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10">

        <div className="w-full max-w-4xl">

          {/* Header */}

          <div className="text-center mb-10">

            <div className="flex items-center justify-center gap-3 mb-5">

              <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center shadow-sm">

                <svg
                  className="w-8 h-8 text-[#2563EB]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l9-5-9-5-9 5 9 5z"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14v7"
                  />

                </svg>

              </div>

            </div>

            <h1 className="text-3xl font-bold text-[#1D4ED8]">
              Smart Attendance
            </h1>

            <p className="text-sm text-[#64748B] mt-1">
              R. C. Patel Institute of Technology
            </p>

            <div className="mt-6">

              <h2 className="text-3xl font-bold text-[#0F172A]">
                Create your account
              </h2>

              <p className="text-[#64748B] mt-2">
                Select your role to get started
              </p>

            </div>

          </div>

          {/* Role Cards */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

            {/* Student */}

            <button
              type="button"
              onClick={() => handleRoleSelect("student")}
              className="group text-left bg-white rounded-3xl border border-[#E2E8F0] p-7 sm:p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-[#93C5FD] relative overflow-hidden"
            >

              <div className="absolute inset-x-0 top-0 h-1 bg-[#2563EB] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

              <div className="flex items-start justify-between">

                <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center">

                  <svg
                    className="w-8 h-8 text-[#2563EB]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
                    />

                    <circle
                      cx="9"
                      cy="7"
                      r="4"
                      strokeWidth={2}
                    />

                    <path
                      strokeLinecap="round"
                      strokeWidth={2}
                      d="M19 8v6m3-3h-6"
                    />

                  </svg>

                </div>

                <span className="text-[#CBD5E1] group-hover:text-[#2563EB] text-2xl transition">
                  →
                </span>

              </div>

              <h3 className="text-xl font-bold text-[#0F172A] mt-6">
                Student
              </h3>

              <p className="text-[#64748B] mt-2 leading-relaxed">
                Mark attendance using QR scanning, GPS verification
                and face recognition.
              </p>

              <div className="flex flex-wrap gap-2 mt-5">

                <Badge>QR Scan</Badge>
                <Badge>GPS</Badge>
                <Badge>Face ID</Badge>

              </div>

            </button>

            {/* Teacher */}

            <button
              type="button"
              onClick={() => handleRoleSelect("teacher")}
              className="group text-left bg-white rounded-3xl border border-[#E2E8F0] p-7 sm:p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-[#93C5FD] relative overflow-hidden"
            >

              <div className="absolute inset-x-0 top-0 h-1 bg-[#1D4ED8] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>

              <div className="flex items-start justify-between">

                <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] border border-[#E0E7FF] flex items-center justify-center">

                  <svg
                    className="w-8 h-8 text-[#1D4ED8]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 19h16"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 17V5h12v12"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 9h6M9 12h4"
                    />

                  </svg>

                </div>

                <span className="text-[#CBD5E1] group-hover:text-[#1D4ED8] text-2xl transition">
                  →
                </span>

              </div>

              <h3 className="text-xl font-bold text-[#0F172A] mt-6">
                Teacher
              </h3>

              <p className="text-[#64748B] mt-2 leading-relaxed">
                Create attendance sessions, generate QR codes and
                monitor attendance analytics.
              </p>

              <div className="flex flex-wrap gap-2 mt-5">

                <Badge>Sessions</Badge>
                <Badge>QR Code</Badge>
                <Badge>Analytics</Badge>

              </div>

            </button>

          </div>

          {/* Login Link */}

          <p className="text-center text-sm text-[#64748B] mt-8">

            Already have an account?{" "}

            <Link
              to="/login"
              className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition"
            >
              Sign in
            </Link>

          </p>

        </div>

      </div>
    );
  }

  /* ============================================================
     REGISTRATION FORM
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-xl">

        {/* Header */}

        <div className="text-center mb-6">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] text-xs font-semibold">

            <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>

            {selectedRole === "student"
              ? "Student Registration"
              : "Teacher Registration"}

          </div>

        </div>

        {/* Card */}

        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-lg p-6 sm:p-8">

          {/* Card Header */}

          <div className="flex items-center justify-between mb-7">

            <div>

              <h2 className="text-2xl font-bold text-[#0F172A]">
                Create your account
              </h2>

              <p className="text-sm text-[#64748B] mt-1">
                Enter your details to continue
              </p>

            </div>

            <button
              type="button"
              onClick={handleBack}
              className="px-3 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition"
            >
              ← Back
            </button>

          </div>

          {/* Role Indicator */}

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] mb-6">

            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] font-bold">

              {selectedRole === "student" ? "S" : "T"}

            </div>

            <div>

              <p className="text-sm font-semibold text-[#0F172A]">
                Registering as{" "}
                {selectedRole === "student"
                  ? "Student"
                  : "Teacher"}
              </p>

              <p className="text-xs text-[#64748B]">
                Your account will be configured automatically.
              </p>

            </div>

          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}

            <div>

              <label className="block text-sm font-semibold text-[#334155] mb-2">
                Full Name *
              </label>

              <input
                type="text"
                name="name"
                required
                autoComplete="name"
                className="w-full h-12 rounded-xl border border-[#CBD5E1] px-4 text-sm text-[#0F172A] outline-none transition-all focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 placeholder:text-[#94A3B8]"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
              />

            </div>

            {/* Student fields */}

            {selectedRole === "student" && (
              <>

                {/* PRN */}

                <div>

                  <label className="block text-sm font-semibold text-[#334155] mb-2">
                    PRN *
                  </label>

                  <input
                    type="text"
                    name="prn"
                    required
                    inputMode="numeric"
                    className="w-full h-12 rounded-xl border border-[#CBD5E1] px-4 text-sm text-[#0F172A] outline-none transition-all focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 placeholder:text-[#94A3B8]"
                    placeholder="Enter your PRN"
                    value={form.prn}
                    onChange={handleChange}
                  />

                  <p className="text-xs text-[#94A3B8] mt-1.5">
                    Enter the PRN provided by your institute.
                  </p>

                </div>

                {/* Branch */}

                <div>

                  <label className="block text-sm font-semibold text-[#334155] mb-2">
                    Branch *
                  </label>

                  <select
                    name="branch"
                    required
                    className="w-full h-12 rounded-xl border border-[#CBD5E1] bg-white px-4 text-sm text-[#0F172A] outline-none transition-all focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10"
                    value={form.branch}
                    onChange={handleChange}
                  >

                    <option value="">
                      Select your branch
                    </option>

                    {branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}

                  </select>

                </div>

              </>
            )}

            {/* Email */}

            <div>

              <label className="block text-sm font-semibold text-[#334155] mb-2">
                Email Address *
              </label>

              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="w-full h-12 rounded-xl border border-[#CBD5E1] px-4 text-sm text-[#0F172A] outline-none transition-all focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 placeholder:text-[#94A3B8]"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />

            </div>

            {/* Password */}

            <div>

              <label className="block text-sm font-semibold text-[#334155] mb-2">
                Password *
              </label>

              <div className="relative">

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  autoComplete="new-password"
                  className="w-full h-12 rounded-xl border border-[#CBD5E1] px-4 pr-12 text-sm text-[#0F172A] outline-none transition-all focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 placeholder:text-[#94A3B8]"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#2563EB]"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>

              </div>

              {/* Password strength */}

              {form.password && (
                <div className="mt-2">

                  <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">

                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.level <= 1
                          ? "bg-[#DC2626]"
                          : passwordStrength.level === 2
                          ? "bg-[#D97706]"
                          : passwordStrength.level === 3
                          ? "bg-[#2563EB]"
                          : "bg-[#16A34A]"
                      }`}
                      style={{
                        width: passwordStrength.width,
                      }}
                    />

                  </div>

                  <p className="text-xs text-[#64748B] mt-1">
                    {passwordStrength.label}
                  </p>

                </div>
              )}

              <p className="text-xs text-[#94A3B8] mt-1">
                Use at least 6 characters.
              </p>

            </div>

            {/* Confirm Password */}

            <div>

              <label className="block text-sm font-semibold text-[#334155] mb-2">
                Confirm Password *
              </label>

              <div className="relative">

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  required
                  autoComplete="new-password"
                  className={`w-full h-12 rounded-xl border px-4 pr-12 text-sm text-[#0F172A] outline-none transition-all focus:ring-4 focus:ring-[#2563EB]/10 placeholder:text-[#94A3B8] ${
                    form.confirmPassword &&
                    form.password !== form.confirmPassword
                      ? "border-[#DC2626] focus:border-[#DC2626]"
                      : form.confirmPassword &&
                        form.password ===
                          form.confirmPassword
                      ? "border-[#16A34A] focus:border-[#16A34A]"
                      : "border-[#CBD5E1] focus:border-[#2563EB]"
                  }`}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#2563EB]"
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>

              </div>

              {form.confirmPassword && (
                <p
                  className={`text-xs mt-1.5 ${
                    form.password ===
                    form.confirmPassword
                      ? "text-[#16A34A]"
                      : "text-[#DC2626]"
                  }`}
                >
                  {form.password ===
                  form.confirmPassword
                    ? "✓ Passwords match"
                    : "Passwords do not match"}
                </p>
              )}

            </div>

            {/* Submit */}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 overflow-hidden"
            >

              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>

              <span className="relative flex items-center justify-center gap-2">

                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <span>→</span>
                  </>
                )}

              </span>

            </button>

          </form>

          {/* Login */}

          <p className="text-center text-sm text-[#64748B] mt-6">

            Already have an account?{" "}

            <Link
              to="/login"
              className="font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
            >
              Sign in
            </Link>

          </p>

        </div>

        <p className="text-center text-xs text-[#94A3B8] mt-5">
          © Smart Attendance System • R. C. Patel Institute of Technology
        </p>

      </div>

    </div>
  );
};


/* ============================================================
   SMALL UI COMPONENTS
============================================================ */

const Badge = ({ children }) => {
  return (
    <span className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-medium text-[#64748B]">
      {children}
    </span>
  );
};

export default Register;