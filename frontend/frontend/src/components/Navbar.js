import { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import toast from "react-hot-toast";

const Navbar = ({ user, setUser }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);

    setDropdownOpen(false);
    setMobileMenuOpen(false);

    toast.success("Logged out successfully");

    navigate("/login");
  };

  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleSectionClick = (path, section = "") => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);

    if (!section) {
      navigate(path);
      return;
    }

    // If already on the dashboard, scroll directly
    if (location.pathname === path) {
      const element = document.getElementById(section);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        window.history.replaceState(
          null,
          "",
          `${path}#${section}`
        );
      }

      return;
    }

    // Navigate to dashboard first
    navigate(`${path}#${section}`);
  };

  // =====================================================
  // SCROLL TO HASH AFTER NAVIGATION
  // =====================================================

  useEffect(() => {
    if (!location.hash) return;

    const section = location.hash.substring(1);

    const timer = setTimeout(() => {
      const element = document.getElementById(section);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [location]);

  // =====================================================
  // STUDENT LINKS
  // =====================================================

  const studentLinks = [
    {
      label: "Dashboard",
      path: "/student/dashboard",
      section: "",
      icon: (
        <svg
          className="w-[18px] h-[18px]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-10.5z"
          />
        </svg>
      ),
    },

    {
      label: "My Attendance",
      path: "/student/dashboard",
      section: "attendance",
      icon: (
        <svg
          className="w-[18px] h-[18px]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <rect
            x="4"
            y="5"
            width="16"
            height="16"
            rx="2"
            strokeWidth="1.8"
          />

          <path
            strokeLinecap="round"
            strokeWidth="1.8"
            d="M8 3v4M16 3v4M4 10h16"
          />
        </svg>
      ),
    },

    {
      label: "Profile",
      path: "/student/dashboard",
      section: "profile",
      icon: (
        <svg
          className="w-[18px] h-[18px]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="8"
            r="3.5"
            strokeWidth="1.8"
          />

          <path
            strokeLinecap="round"
            strokeWidth="1.8"
            d="M5 21a7 7 0 0114 0"
          />
        </svg>
      ),
    },
  ];

  // =====================================================
  // TEACHER LINKS
  // =====================================================

  const teacherLinks = [
    {
      label: "Dashboard",
      path: "/teacher/dashboard",
      section: "",
      icon: (
        <svg
          className="w-[18px] h-[18px]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-10.5z"
          />
        </svg>
      ),
    },

    {
      label: "Sessions",
      path: "/teacher/dashboard",
      section: "sessions",
      icon: (
        <svg
          className="w-[18px] h-[18px]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <rect
            x="4"
            y="5"
            width="16"
            height="16"
            rx="2"
            strokeWidth="1.8"
          />

          <path
            strokeLinecap="round"
            strokeWidth="1.8"
            d="M8 3v4M16 3v4M4 10h16"
          />
        </svg>
      ),
    },

    {
      label: "Analytics",
      path: "/teacher/dashboard",
      section: "analytics",
      icon: (
        <svg
          className="w-[18px] h-[18px]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M4 19V5M4 19h16"
          />

          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M7 15l3-4 3 2 5-7"
          />
        </svg>
      ),
    },

    {
      label: "Students",
      path: "/teacher/dashboard",
      section: "students",
      icon: (
        <svg
          className="w-[18px] h-[18px]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle
            cx="9"
            cy="8"
            r="3"
            strokeWidth="1.8"
          />

          <circle
            cx="17"
            cy="9"
            r="2.3"
            strokeWidth="1.8"
          />

          <path
            strokeLinecap="round"
            strokeWidth="1.8"
            d="M3.5 20a5.5 5.5 0 0111 0M14.5 15.5a4.5 4.5 0 016 4.5"
          />
        </svg>
      ),
    },
  ];

  const links = isTeacher
    ? teacherLinks
    : isStudent
    ? studentLinks
    : [];

  // =====================================================
  // CHECK ACTIVE LINK
  // =====================================================

  const isActive = (link) => {
    if (link.section) {
      return (
        location.pathname === link.path &&
        location.hash === `#${link.section}`
      );
    }

    return (
      location.pathname === link.path &&
      !location.hash
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-[#DCE5F1] sticky top-0 z-50 shadow-[0_3px_15px_rgba(40,80,130,0.06)]">

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between h-[74px]">

          {/* =================================================
              LOGO
          ================================================= */}

          <Link
            to="/"
            className="flex items-center gap-3 group"
          >

            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#EAF3FF] to-[#F1ECFF] flex items-center justify-center border border-[#DCE8F7] shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-0.5">

              <svg
                className="w-6 h-6 text-[#2563C7]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M3 8l9-5 9 5-9 5-9-5z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M7 10.5V16c2.8 2 7.2 2 10 0v-5.5"
                />
              </svg>

            </div>


            <div className="hidden sm:block">

              <div className="text-[18px] font-bold leading-tight text-[#173B78]">
                Smart Attendance
              </div>

              <div className="text-[11px] font-medium text-[#63728A] mt-0.5">
                R. C. Patel Institute of Technology
              </div>

            </div>


            <div className="sm:hidden text-[17px] font-bold text-[#173B78]">
              Smart Attendance
            </div>

          </Link>


          {/* =================================================
              DESKTOP NAVIGATION
          ================================================= */}

          {user && (

            <div className="hidden md:flex items-center gap-1">

              {links.map((link) => (

                <button
                  key={`${link.label}-${link.section}`}
                  onClick={() =>
                    handleSectionClick(
                      link.path,
                      link.section
                    )
                  }
                  className={`
                    group relative flex items-center gap-2
                    px-4 py-2.5
                    rounded-xl
                    text-sm font-semibold
                    transition-all duration-250
                    ${
                      isActive(link)
                        ? "bg-[#EAF3FF] text-[#2563C7] shadow-sm"
                        : "text-[#4E6380] hover:bg-[#F5F8FC] hover:text-[#2563C7]"
                    }
                  `}
                >

                  <span
                    className={`
                      transition-transform duration-200
                      ${
                        isActive(link)
                          ? "scale-105"
                          : "group-hover:scale-105"
                      }
                    `}
                  >
                    {link.icon}
                  </span>

                  <span>
                    {link.label}
                  </span>

                  {/* Active underline */}

                  {isActive(link) && (

                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-[#2563C7] rounded-full" />

                  )}

                </button>

              ))}

            </div>

          )}


          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          {user && (

            <div className="flex items-center gap-2 sm:gap-3">

              {/* Notification */}

              <button
                className="hidden sm:flex relative w-10 h-10 items-center justify-center rounded-xl text-[#63728A] hover:bg-[#F3F7FC] hover:text-[#2563C7] transition-all duration-200 hover:-translate-y-0.5"
                title="Notifications"
              >

                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
                  />

                  <path
                    strokeLinecap="round"
                    strokeWidth="1.8"
                    d="M10 21h4"
                  />

                </svg>


                <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 bg-[#EF5B72] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  0
                </span>

              </button>


              {/* =================================================
                  USER DROPDOWN
              ================================================= */}

              <div className="hidden md:block relative">

                <button
                  onClick={() =>
                    setDropdownOpen(
                      !dropdownOpen
                    )
                  }
                  className="flex items-center gap-3 px-2.5 py-1.5 rounded-xl hover:bg-[#F6F8FC] transition-all duration-200"
                >

                  {/* Avatar */}

                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#DDEBFF] to-[#EEE7FF] border-2 border-white shadow-sm flex items-center justify-center text-[#2563C7] font-bold">

                    {user?.name
                      ?.charAt(0)
                      ?.toUpperCase() || "U"}

                  </div>


                  {/* Name */}

                  <div className="text-left min-w-[95px]">

                    <p className="text-sm font-bold text-[#173B78] truncate max-w-[120px]">
                      {user?.name || "User"}
                    </p>

                    <p className="text-[11px] text-[#63728A] capitalize">
                      {user?.role || "User"}
                    </p>

                  </div>


                  {/* Arrow */}

                  <svg
                    className={`w-4 h-4 text-[#63728A] transition-transform duration-200 ${
                      dropdownOpen
                        ? "rotate-180"
                        : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M6 9l6 6 6-6"
                    />

                  </svg>

                </button>


                {/* =================================================
                    DROPDOWN
                ================================================= */}

                {dropdownOpen && (

                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-[#DCE5F1] shadow-[0_15px_40px_rgba(40,80,130,0.14)] overflow-hidden">

                    {/* User information */}

                    <div className="px-4 py-4 bg-gradient-to-r from-[#F0F6FF] to-[#F7F3FF] border-b border-[#E5ECF5]">

                      <div className="flex items-center gap-3">

                        <div className="w-11 h-11 rounded-full bg-white border border-[#DCE5F1] flex items-center justify-center text-[#2563C7] font-bold">

                          {user?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}

                        </div>

                        <div className="min-w-0">

                          <p className="font-bold text-[#173B78] truncate">
                            {user?.name}
                          </p>

                          <p className="text-xs text-[#63728A] capitalize">
                            {user?.role}
                          </p>

                        </div>

                      </div>

                    </div>


                    {/* Profile */}

                    <button
                      onClick={() =>
                        handleSectionClick(
                          isTeacher
                            ? "/teacher/dashboard"
                            : "/student/dashboard",
                          "profile"
                        )
                      }
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#4E6380] hover:bg-[#F5F8FC] hover:text-[#2563C7] transition"
                    >

                      <span className="w-8 h-8 rounded-lg bg-[#EAF3FF] flex items-center justify-center">

                        <svg
                          className="w-4 h-4 text-[#2563C7]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >

                          <circle
                            cx="12"
                            cy="8"
                            r="3"
                            strokeWidth="1.8"
                          />

                          <path
                            strokeLinecap="round"
                            strokeWidth="1.8"
                            d="M5 21a7 7 0 0114 0"
                          />

                        </svg>

                      </span>

                      Profile

                    </button>


                    {/* Divider */}

                    <div className="border-t border-[#E9EDF3]" />


                    {/* Logout */}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#EF5B72] hover:bg-[#FFF0F3] transition"
                    >

                      <span className="w-8 h-8 rounded-lg bg-[#FFF0F3] flex items-center justify-center">

                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                            d="M10 17l5-5-5-5"
                          />

                          <path
                            strokeLinecap="round"
                            strokeWidth="1.8"
                            d="M15 12H3"
                          />

                          <path
                            strokeLinecap="round"
                            strokeWidth="1.8"
                            d="M19 4v16"
                          />

                        </svg>

                      </span>

                      Logout

                    </button>

                  </div>

                )}

              </div>


              {/* =================================================
                  MOBILE MENU BUTTON
              ================================================= */}

              <button
                onClick={() =>
                  setMobileMenuOpen(
                    !mobileMenuOpen
                  )
                }
                className="md:hidden w-10 h-10 rounded-xl bg-[#F3F7FC] text-[#173B78] flex items-center justify-center hover:bg-[#EAF3FF] hover:text-[#2563C7] transition"
                aria-label="Open menu"
              >

                {mobileMenuOpen ? (

                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 6l12 12M18 6L6 18"
                    />

                  </svg>

                ) : (

                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >

                    <path
                      strokeLinecap="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />

                  </svg>

                )}

              </button>

            </div>

          )}

        </div>


        {/* =====================================================
            MOBILE MENU
        ===================================================== */}

        {mobileMenuOpen && user && (

          <div className="md:hidden border-t border-[#E2E8F0] py-3 animate-[fadeIn_.2s_ease]">

            <div className="space-y-1">

              {links.map((link) => (

                <button
                  key={`${link.label}-mobile-${link.section}`}
                  onClick={() =>
                    handleSectionClick(
                      link.path,
                      link.section
                    )
                  }
                  className={`
                    w-full flex items-center gap-3
                    px-4 py-3
                    rounded-xl
                    text-sm font-semibold
                    text-left
                    transition
                    ${
                      isActive(link)
                        ? "bg-[#EAF3FF] text-[#2563C7]"
                        : "text-[#4E6380] hover:bg-[#F6F8FC]"
                    }
                  `}
                >

                  <span>
                    {link.icon}
                  </span>

                  {link.label}

                </button>

              ))}

            </div>


            {/* Mobile user */}

            <div className="mt-3 pt-3 border-t border-[#E2E8F0]">

              <div className="flex items-center justify-between px-3">

                <div className="flex items-center gap-3">

                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#DDEBFF] to-[#EEE7FF] flex items-center justify-center text-[#2563C7] font-bold text-sm">

                    {user?.name
                      ?.charAt(0)
                      ?.toUpperCase() || "U"}

                  </div>

                  <div>

                    <p className="text-sm font-bold text-[#173B78]">
                      {user?.name}
                    </p>

                    <p className="text-xs text-[#63728A] capitalize">
                      {user?.role}
                    </p>

                  </div>

                </div>


                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-[#EF5B72] hover:bg-[#FFF0F3] transition"
                >
                  Logout
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

    </nav>
  );
};

export default Navbar;