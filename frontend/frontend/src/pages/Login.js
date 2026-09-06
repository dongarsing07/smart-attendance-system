import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/api";
import toast from "react-hot-toast";

const Login = ({ setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const res = await authService.login({
        email: cleanEmail,
        password,
      });

      const { token, ...userData } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", cleanEmail);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      setUser(userData);

      toast.success("Welcome back!");

      if (userData.role === "teacher") {
        navigate("/teacher/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Invalid email or password";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-10 items-center">

        {/* ================= LEFT SECTION ================= */}

        <div className="hidden lg:block">

          {/* Logo */}
          <div className="flex items-center gap-4 mb-8">

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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12v4c0 1.5 3.1 3 7 3s7-1.5 7-3v-4"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#1D4ED8]">
                Smart Attendance
              </h1>

              <p className="text-sm text-[#64748B]">
                R. C. Patel Institute of Technology
              </p>
            </div>

          </div>

          {/* Heading */}

          <div className="mb-8">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] text-xs font-semibold mb-4">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
              Smart & Secure Attendance System
            </div>

            <h2 className="text-4xl xl:text-5xl font-bold text-[#0F172A] leading-tight">
              Attendance made
              <span className="text-[#2563EB]"> simple and secure.</span>
            </h2>

            <p className="mt-4 text-[#64748B] text-lg leading-relaxed max-w-xl">
              Manage classroom attendance using QR verification,
              GPS validation and face recognition from one centralized
              platform.
            </p>

          </div>

          {/* Features */}

          <div className="space-y-4">

            <Feature
              icon="QR"
              title="QR Code Attendance"
              description="Quick and secure attendance sessions."
              bg="bg-[#EFF6FF]"
              text="text-[#2563EB]"
            />

            <Feature
              icon="GPS"
              title="GPS Verification"
              description="Attendance is verified using classroom location."
              bg="bg-[#F0FDF4]"
              text="text-[#16A34A]"
            />

            <Feature
              icon="FACE"
              title="Face Recognition"
              description="Additional identity verification for students."
              bg="bg-[#FFF7ED]"
              text="text-[#EA580C]"
            />

          </div>

        </div>

        {/* ================= LOGIN CARD ================= */}

        <div className="w-full max-w-md mx-auto">

          {/* Mobile Logo */}

          <div className="lg:hidden text-center mb-8">

            <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center mx-auto mb-3">

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

            <h1 className="text-2xl font-bold text-[#1D4ED8]">
              Smart Attendance
            </h1>

            <p className="text-sm text-[#64748B] mt-1">
              R. C. Patel Institute of Technology
            </p>

          </div>

          <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-lg p-7 sm:p-9">

            {/* Card Header */}

            <div className="mb-7">

              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center mb-4">

                <svg
                  className="w-6 h-6 text-[#2563EB]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 17l5-5-5-5"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12H3"
                  />
                </svg>

              </div>

              <h2 className="text-2xl font-bold text-[#0F172A]">
                Welcome back
              </h2>

              <p className="text-sm text-[#64748B] mt-1">
                Sign in to access your attendance dashboard.
              </p>

            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}

              <div>

                <label className="block text-sm font-semibold text-[#334155] mb-2">
                  Email Address
                </label>

                <div className="relative">

                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">

                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l9 6 9-6"
                      />
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                        strokeWidth={2}
                      />
                    </svg>

                  </span>

                  <input
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full h-12 rounded-xl border border-[#CBD5E1] bg-white pl-11 pr-4 text-sm text-[#0F172A] outline-none transition-all focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 placeholder:text-[#94A3B8]"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                </div>

              </div>

              {/* Password */}

              <div>

                <div className="flex items-center justify-between mb-2">

                  <label className="block text-sm font-semibold text-[#334155]">
                    Password
                  </label>

                </div>

                <div className="relative">

                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">

                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <rect
                        x="4"
                        y="10"
                        width="16"
                        height="11"
                        rx="2"
                        strokeWidth={2}
                      />
                      <path
                        strokeLinecap="round"
                        strokeWidth={2}
                        d="M8 10V7a4 4 0 018 0v3"
                      />
                    </svg>

                  </span>

                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    className="w-full h-12 rounded-xl border border-[#CBD5E1] bg-white pl-11 pr-12 text-sm text-[#0F172A] outline-none transition-all focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 placeholder:text-[#94A3B8]"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#2563EB] transition"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>

                </div>

              </div>

              {/* Remember Me */}

              <div className="flex items-center justify-between">

                <label className="flex items-center gap-2 cursor-pointer">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(e.target.checked)
                    }
                    className="w-4 h-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                  />

                  <span className="text-sm text-[#64748B]">
                    Remember my email
                  </span>

                </label>

              </div>

              {/* Button */}

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
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <span>→</span>
                    </>
                  )}

                </span>

              </button>

            </form>

            {/* Divider */}

            <div className="flex items-center gap-3 my-6">

              <div className="flex-1 h-px bg-[#E2E8F0]"></div>

              <span className="text-xs text-[#94A3B8]">
                SECURE ACCESS
              </span>

              <div className="flex-1 h-px bg-[#E2E8F0]"></div>

            </div>

            {/* Register */}

            <p className="text-center text-sm text-[#64748B]">

              Don't have an account?{" "}

              <Link
                to="/register"
                className="font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition"
              >
                Create account
              </Link>

            </p>

          </div>

          <p className="text-center text-xs text-[#94A3B8] mt-5">
            © Smart Attendance System • R. C. Patel Institute of Technology
          </p>

        </div>

      </div>

    </div>
  );
};


/* ================= FEATURE COMPONENT ================= */

const Feature = ({
  icon,
  title,
  description,
  bg,
  text,
}) => {
  return (
    <div className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">

      <div
        className={`w-11 h-11 rounded-xl ${bg} ${text} flex items-center justify-center text-[10px] font-bold`}
      >
        {icon}
      </div>

      <div>

        <h3 className="font-semibold text-[#0F172A]">
          {title}
        </h3>

        <p className="text-sm text-[#64748B] mt-0.5">
          {description}
        </p>

      </div>

    </div>
  );
};

export default Login;