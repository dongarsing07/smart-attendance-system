import { useState, useEffect } from "react";
import { sessionService } from "../services/api";
import toast from "react-hot-toast";
import LiveClock from "../components/LiveClock";
import socket from "../socket";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const TeacherDashboard = ({ user }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendance, setAttendance] = useState([]);

  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [qrToken, setQrToken] = useState("");
  const [expiry, setExpiry] = useState(null);

  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [presentCount, setPresentCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    today: {
      present: 0,
      absent: 0,
      percentage: 0,
    },
    weekly: [],
    monthly: [],
    branches: [],
  });

  const COLORS = ["#2563EB", "#EF4444", "#16A34A", "#F59E0B"];

  /* =========================================================
     FETCH SESSIONS
  ========================================================= */

  const fetchSessions = async () => {
    setLoading(true);

    try {
      const res = await sessionService.getSessions();

      let data = res.data;

      if (!Array.isArray(data)) {
        data = data?.data || data?.sessions || [];
      }

      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Sessions error:", error);
      toast.error("Unable to load attendance sessions");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FETCH ANALYTICS
  ========================================================= */

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);

    try {
      const res = await sessionService.getTeacherAnalytics();

      const data = res.data?.data || res.data || {};

      setAnalytics({
        totalStudents: Number(data.totalStudents || 0),

        today: {
          present: Number(data.today?.present || 0),
          absent: Number(data.today?.absent || 0),
          percentage: Number(data.today?.percentage || 0),
        },

        weekly: Array.isArray(data.weekly)
          ? data.weekly
          : [],

        monthly: Array.isArray(data.monthly)
          ? data.monthly
          : [],

        branches: Array.isArray(data.branches)
          ? data.branches
          : [],
      });
    } catch (error) {
      console.error("Analytics error:", error);

      setAnalytics({
        totalStudents: 0,
        today: {
          present: 0,
          absent: 0,
          percentage: 0,
        },
        weekly: [],
        monthly: [],
        branches: [],
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  /* =========================================================
     FETCH SESSION ATTENDANCE
  ========================================================= */

  const fetchAttendance = async (sessionId) => {
    try {
      const res =
        await sessionService.getSessionAttendance(sessionId);

      let data =
        res.data?.data ||
        res.data?.attendance ||
        [];

      if (!Array.isArray(data)) {
        data = [];
      }

      setAttendance(data);

      const present = data.filter(
        (item) => item.status === "Present"
      ).length;

      setPresentCount(present);
    } catch (error) {
      console.error("Attendance error:", error);

      toast.error(
        "Unable to load attendance details"
      );

      setAttendance([]);
      setPresentCount(0);
    }
  };

  /* =========================================================
     CREATE ATTENDANCE SESSION
  ========================================================= */

  const createSession = () => {
    if (!navigator.geolocation) {
      toast.error(
        "Location services are not supported"
      );
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response =
            await sessionService.createSession({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });

          setQrCode(response.data.qr);
          setQrToken(response.data.qrToken);

          setExpiry(
            new Date(
              response.data.session.expiry
            )
          );

          setPresentCount(0);
          setShowQR(true);

          await fetchSessions();
          await fetchAnalytics();

          toast.success(
            "Attendance session created"
          );
        } catch (error) {
          console.error(
            "Create session error:",
            error
          );

          toast.error(
            error.response?.data?.message ||
              "Failed to create attendance session"
          );
        } finally {
          setLoading(false);
        }
      },

      () => {
        setLoading(false);

        toast.error(
          "Location access denied. Please enable location services."
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  /* =========================================================
     CSV EXPORT
  ========================================================= */

  const exportAttendanceCSV = () => {
    if (
      !selectedSession ||
      attendance.length === 0
    ) {
      toast.error(
        "No attendance records available"
      );
      return;
    }

    const headers = [
      "Student Name",
      "PRN",
      "Email",
      "Status",
      "Date",
      "Time",
      "Location",
      "Reason",
    ];

    const rows = attendance.map((item) => {
      const date = new Date(
        item.createdAt || item.timestamp
      );

      return [
        item.studentId?.name || "N/A",
        item.studentId?.prn || "N/A",
        item.studentId?.email || "N/A",
        item.status || "N/A",
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        `${item.locationLat?.toFixed(6) || "N/A"}, ${
          item.locationLng?.toFixed(6) || "N/A"
        }`,
        item.rejectionReason || "-",
      ];
    });

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `attendance_${selectedSession.sessionId}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast.success(
      "Attendance report exported"
    );
  };

  /* =========================================================
     QR COUNTDOWN
  ========================================================= */

  useEffect(() => {
    if (!expiry) return;

    const interval = setInterval(() => {
      const now = new Date();

      const difference = Math.max(
        0,
        Math.floor(
          (expiry - now) / 1000
        )
      );

      setTimeRemaining(difference);

      if (difference === 0) {
        clearInterval(interval);

        setShowQR(false);
        setQrCode(null);
        setQrToken("");

        toast.info(
          "QR code has expired"
        );
      }
    }, 1000);

    return () =>
      clearInterval(interval);
  }, [expiry]);

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    fetchSessions();
    fetchAnalytics();

    const interval = setInterval(() => {
      fetchSessions();
      fetchAnalytics();
    }, 15000);

    return () =>
      clearInterval(interval);
  }, []);

  /* =========================================================
     SOCKET.IO LIVE ATTENDANCE
  ========================================================= */

  useEffect(() => {
    const handleAttendanceUpdate = () => {
      fetchSessions();
      fetchAnalytics();

      if (selectedSession?._id) {
        fetchAttendance(
          selectedSession._id
        );
      }
    };

    socket.on(
      "attendance_update",
      handleAttendanceUpdate
    );

    return () => {
      socket.off(
        "attendance_update",
        handleAttendanceUpdate
      );
    };
  }, [selectedSession]);

  /* =========================================================
     JOIN SELECTED SESSION
  ========================================================= */

  useEffect(() => {
    if (!selectedSession?._id) return;

    const handleLiveUpdate = (count) => {
      setPresentCount(count);

      fetchAttendance(
        selectedSession._id
      );

      fetchAnalytics();
    };

    socket.emit(
      "join_session",
      selectedSession._id
    );

    socket.on(
      "attendance_update",
      handleLiveUpdate
    );

    return () => {
      socket.emit(
        "leave_session",
        selectedSession._id
      );

      socket.off(
        "attendance_update",
        handleLiveUpdate
      );
    };
  }, [selectedSession]);

  /* =========================================================
     SUMMARY VALUES
  ========================================================= */

  const totalSessions =
    Array.isArray(sessions)
      ? sessions.length
      : 0;

  const totalPresent =
    Array.isArray(sessions)
      ? sessions.reduce(
          (sum, session) =>
            sum +
            Number(
              session.presentCount || 0
            ),
          0
        )
      : 0;

  const totalAttendance =
    Array.isArray(sessions)
      ? sessions.reduce(
          (sum, session) =>
            sum +
            Number(
              session.totalMarked || 0
            ),
          0
        )
      : 0;

  const averageAttendance =
    totalAttendance === 0
      ? 0
      : (
          (totalPresent /
            totalAttendance) *
          100
        ).toFixed(1);

  const activeSessions =
    Array.isArray(sessions)
      ? sessions.filter(
          (session) =>
            new Date(session.expiry) >
            new Date()
        ).length
      : 0;

  /* =========================================================
     CHART DATA
  ========================================================= */

  const weeklyData =
    analytics.weekly.map((item) => ({
      ...item,
      name:
        item.name ||
        item.day ||
        item.date ||
        "",
      present: Number(
        item.present || 0
      ),
    }));

  const monthlyData =
    analytics.monthly.map((item) => ({
      ...item,
      name:
        item.name ||
        item.month ||
        "",
      present: Number(
        item.present || 0
      ),
    }));

  const branchData =
    analytics.branches.map((item) => ({
      ...item,
      name:
        item.name ||
        item.branch ||
        "Unknown",
      present: Number(
        item.present || 0
      ),
    }));

  const distributionData = [
    {
      name: "Present",
      value: analytics.today.present,
    },
    {
      name: "Rejected",
      value: analytics.today.absent,
    },
  ].filter(
    (item) => item.value > 0
  );

  /* =========================================================
     COMPONENT UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <section
          id="dashboard"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#EFF6FF] via-white to-[#F0FDF4] border border-[#E2E8F0] p-6 md:p-8 mb-6 shadow-sm"
        >

          <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-60" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div>

              <div className="flex items-center gap-4">

                <div className="w-14 h-14 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-3xl">
                  👨‍🏫
                </div>

                <div>
                  <p className="text-sm font-medium text-[#64748B]">
                    Teacher Portal
                  </p>

                  <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">
                    Welcome,{" "}
                    <span className="text-[#2563EB]">
                      {user?.name || "Teacher"}
                    </span>
                  </h1>

                  <p className="text-sm text-[#64748B] mt-1">
                    {user?.department ||
                      "Computer Engineering"}
                  </p>
                </div>

              </div>

              <p className="text-sm text-[#64748B] mt-5 max-w-2xl">
                Manage attendance sessions,
                monitor student participation,
                and view real-time academic
                attendance analytics.
              </p>

            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3">

              <LiveClock />

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#DCFCE7] text-[#16A34A] text-sm font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                System Live
              </div>

            </div>

          </div>
        </section>

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          {/* Sessions */}

          <div className="group rounded-2xl bg-white border border-[#E2E8F0] p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm text-[#64748B]">
                  Total Sessions
                </p>

                <p className="text-3xl font-bold text-[#0F172A] mt-1">
                  {totalSessions}
                </p>

                <p className="text-xs text-[#2563EB] mt-2">
                  Created sessions
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-xl">
                📋
              </div>

            </div>

          </div>

          {/* Present */}

          <div className="group rounded-2xl bg-white border border-[#E2E8F0] p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm text-[#64748B]">
                  Total Present
                </p>

                <p className="text-3xl font-bold text-[#16A34A] mt-1">
                  {totalPresent}
                </p>

                <p className="text-xs text-[#16A34A] mt-2">
                  Attendance marked
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-[#F0FDF4] flex items-center justify-center text-xl">
                ✓
              </div>

            </div>

          </div>

          {/* Average */}

          <div className="group rounded-2xl bg-white border border-[#E2E8F0] p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm text-[#64748B]">
                  Average Attendance
                </p>

                <p className="text-3xl font-bold text-[#D97706] mt-1">
                  {averageAttendance}%
                </p>

                <p className="text-xs text-[#D97706] mt-2">
                  Across sessions
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-[#FFFBEB] flex items-center justify-center text-xl">
                📊
              </div>

            </div>

          </div>

          {/* Active */}

          <div className="group rounded-2xl bg-white border border-[#E2E8F0] p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm text-[#64748B]">
                  Active Sessions
                </p>

                <p className="text-3xl font-bold text-[#7C3AED] mt-1">
                  {activeSessions}
                </p>

                <p className="text-xs text-[#7C3AED] mt-2">
                  Currently active
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-[#F5F3FF] flex items-center justify-center text-xl">
                🔴
              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            CREATE SESSION
        ===================================================== */}

        <section
          id="sessions"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
        >

          <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#EFF6FF] to-[#F8FAFC] border border-[#DBEAFE] p-6 shadow-sm hover:shadow-lg transition-all duration-300">

            <div className="absolute -right-12 -bottom-12 w-40 h-40 rounded-full bg-blue-100 blur-2xl opacity-70" />

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div>

                <div className="flex items-center gap-3 mb-3">

                  <div className="w-11 h-11 rounded-xl bg-white border border-[#DBEAFE] flex items-center justify-center text-xl">
                    📱
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider font-semibold text-[#64748B]">
                      Attendance
                    </p>

                    <h2 className="text-xl font-bold text-[#0F172A]">
                      Create New Session
                    </h2>
                  </div>

                </div>

                <p className="text-sm text-[#64748B] max-w-xl">
                  Start a secure attendance
                  session using QR Code,
                  GPS verification and face
                  verification.
                </p>

                <div className="flex flex-wrap gap-2 mt-4">

                  <span className="px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-xs font-medium text-[#475569]">
                    📱 QR Code
                  </span>

                  <span className="px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-xs font-medium text-[#475569]">
                    📍 GPS
                  </span>

                  <span className="px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-xs font-medium text-[#475569]">
                    👤 Face
                  </span>

                </div>

              </div>

              <button
                onClick={createSession}
                disabled={loading}
                className="relative z-10 shrink-0 px-6 py-3.5 rounded-xl bg-[#2563EB] text-white font-semibold text-sm shadow-md hover:bg-[#1D4ED8] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Creating..."
                  : "+ Create Attendance Session"}
              </button>

            </div>

          </div>

          {/* TODAY */}

          <div className="rounded-2xl bg-white border border-[#E2E8F0] p-5 shadow-sm">

            <div className="flex items-center justify-between mb-5">

              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-[#64748B]">
                  Today
                </p>

                <h3 className="font-bold text-[#0F172A]">
                  Attendance Summary
                </h3>
              </div>

              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                📅
              </div>

            </div>

            <div>

              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[#64748B]">
                  Attendance Rate
                </span>

                <span className="font-bold text-[#0F172A]">
                  {analytics.today.percentage}%
                </span>
              </div>

              <div className="h-2.5 rounded-full bg-[#E2E8F0] overflow-hidden">

                <div
                  className="h-full rounded-full bg-[#2563EB] transition-all duration-1000"
                  style={{
                    width: `${Math.min(
                      Number(
                        analytics.today.percentage
                      ) || 0,
                      100
                    )}%`,
                  }}
                />

              </div>

            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">

              <div className="rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] p-3">
                <p className="text-xs text-[#16A34A]">
                  Present
                </p>

                <p className="text-2xl font-bold text-[#16A34A]">
                  {analytics.today.present}
                </p>
              </div>

              <div className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] p-3">
                <p className="text-xs text-[#DC2626]">
                  Absent
                </p>

                <p className="text-2xl font-bold text-[#DC2626]">
                  {analytics.today.absent}
                </p>
              </div>

            </div>

          </div>

        </section>
                {/* =====================================================
            CHARTS
        ===================================================== */}

        <section
          id="analytics"
          className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6"
        >

          {/* WEEKLY ATTENDANCE */}

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm hover:shadow-lg transition-all duration-300">

            <div className="flex items-start justify-between mb-5">

              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-[#64748B]">
                  Attendance Trend
                </p>

                <h3 className="text-lg font-bold text-[#0F172A] mt-1">
                  Weekly Attendance
                </h3>

                <p className="text-sm text-[#94A3B8] mt-1">
                  Student attendance over the last 7 days
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                📈
              </div>

            </div>

            <div className="h-64">

              {analyticsLoading ? (

                <div className="h-full flex items-center justify-center">

                  <div className="text-center">

                    <div className="w-8 h-8 border-2 border-[#DBEAFE] border-t-[#2563EB] rounded-full animate-spin mx-auto" />

                    <p className="text-sm text-[#94A3B8] mt-3">
                      Loading analytics...
                    </p>

                  </div>

                </div>

              ) : weeklyData.length === 0 ? (

                <div className="h-full flex flex-col items-center justify-center text-center">

                  <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] flex items-center justify-center text-xl">
                    📊
                  </div>

                  <p className="text-sm font-medium text-[#64748B] mt-3">
                    No weekly data available
                  </p>

                </div>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <AreaChart data={weeklyData}>

                    <defs>

                      <linearGradient
                        id="teacherWeeklyGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >

                        <stop
                          offset="5%"
                          stopColor="#2563EB"
                          stopOpacity={0.28}
                        />

                        <stop
                          offset="95%"
                          stopColor="#2563EB"
                          stopOpacity={0}
                        />

                      </linearGradient>

                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E2E8F0"
                    />

                    <XAxis
                      dataKey="name"
                      tick={{
                        fill: "#64748B",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fill: "#64748B",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #E2E8F0",
                        boxShadow:
                          "0 10px 30px rgba(15,23,42,0.08)",
                        backgroundColor: "#FFFFFF",
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="present"
                      name="Present"
                      stroke="#2563EB"
                      strokeWidth={3}
                      fill="url(#teacherWeeklyGradient)"
                      dot={{
                        r: 4,
                        fill: "#2563EB",
                      }}
                      activeDot={{
                        r: 6,
                      }}
                    />

                  </AreaChart>

                </ResponsiveContainer>

              )}

            </div>

          </div>


          {/* MONTHLY ATTENDANCE */}

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm hover:shadow-lg transition-all duration-300">

            <div className="flex items-start justify-between mb-5">

              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-[#64748B]">
                  Long Term
                </p>

                <h3 className="text-lg font-bold text-[#0F172A] mt-1">
                  Monthly Attendance
                </h3>

                <p className="text-sm text-[#94A3B8] mt-1">
                  Attendance performance by month
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center">
                📅
              </div>

            </div>

            <div className="h-64">

              {monthlyData.length === 0 ? (

                <div className="h-full flex flex-col items-center justify-center text-center">

                  <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] flex items-center justify-center text-xl">
                    📊
                  </div>

                  <p className="text-sm font-medium text-[#64748B] mt-3">
                    No monthly data available
                  </p>

                </div>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart data={monthlyData}>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E2E8F0"
                    />

                    <XAxis
                      dataKey="name"
                      tick={{
                        fill: "#64748B",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fill: "#64748B",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #E2E8F0",
                        boxShadow:
                          "0 10px 30px rgba(15,23,42,0.08)",
                        backgroundColor: "#FFFFFF",
                      }}
                    />

                    <Bar
                      dataKey="present"
                      name="Present"
                      fill="#16A34A"
                      radius={[
                        7,
                        7,
                        0,
                        0,
                      ]}
                      animationDuration={900}
                    />

                  </BarChart>

                </ResponsiveContainer>

              )}

            </div>

          </div>

        </section>


        {/* =====================================================
            BRANCH + DISTRIBUTION
        ===================================================== */}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* BRANCH */}

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm hover:shadow-lg transition-all duration-300">

            <div className="flex items-start justify-between mb-5">

              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-[#64748B]">
                  Departments
                </p>

                <h3 className="text-lg font-bold text-[#0F172A] mt-1">
                  Branch-wise Attendance
                </h3>

                <p className="text-sm text-[#94A3B8] mt-1">
                  Student participation by branch
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] flex items-center justify-center">
                🏫
              </div>

            </div>

            {branchData.length === 0 ? (

              <div className="h-64 flex flex-col items-center justify-center text-center">

                <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] flex items-center justify-center text-xl">
                  🏫
                </div>

                <p className="text-sm font-medium text-[#64748B] mt-3">
                  No branch data available
                </p>

              </div>

            ) : (

              <div className="h-72">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    data={branchData}
                    layout="vertical"
                    margin={{
                      left: 10,
                      right: 20,
                      top: 5,
                      bottom: 5,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E2E8F0"
                    />

                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{
                        fill: "#64748B",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{
                        fill: "#475569",
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #E2E8F0",
                        boxShadow:
                          "0 10px 30px rgba(15,23,42,0.08)",
                        backgroundColor: "#FFFFFF",
                      }}
                    />

                    <Bar
                      dataKey="present"
                      name="Present"
                      fill="#7C3AED"
                      radius={[
                        0,
                        7,
                        7,
                        0,
                      ]}
                      animationDuration={900}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            )}

          </div>


          {/* DISTRIBUTION */}

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm hover:shadow-lg transition-all duration-300">

            <div className="flex items-start justify-between mb-2">

              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-[#64748B]">
                  Overview
                </p>

                <h3 className="text-lg font-bold text-[#0F172A] mt-1">
                  Attendance Distribution
                </h3>

                <p className="text-sm text-[#94A3B8] mt-1">
                  Present vs rejected attendance
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                🥧
              </div>

            </div>

            {distributionData.length === 0 ? (

              <div className="h-64 flex flex-col items-center justify-center text-center">

                <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] flex items-center justify-center text-xl">
                  📊
                </div>

                <p className="text-sm font-medium text-[#64748B] mt-3">
                  No distribution data available
                </p>

              </div>

            ) : (

              <div className="h-72">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <PieChart>

                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={900}
                    >

                      {distributionData.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              COLORS[
                                index %
                                  COLORS.length
                              ]
                            }
                          />
                        )
                      )}

                    </Pie>

                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #E2E8F0",
                        boxShadow:
                          "0 10px 30px rgba(15,23,42,0.08)",
                        backgroundColor: "#FFFFFF",
                      }}
                    />

                    <Legend />

                  </PieChart>

                </ResponsiveContainer>

              </div>

            )}

          </div>

        </section>


        {/* =====================================================
            SESSION MANAGEMENT
        ===================================================== */}

        <section id="students">

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">

            <div>

              <p className="text-xs uppercase tracking-wider font-semibold text-[#64748B]">
                Management
              </p>

              <h2 className="text-xl font-bold text-[#0F172A] mt-1">
                Attendance Sessions
              </h2>

              <p className="text-sm text-[#94A3B8] mt-1">
                View and manage your attendance sessions
              </p>

            </div>

            <div className="px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-sm font-medium text-[#64748B] shadow-sm">
              {totalSessions}{" "}
              {totalSessions === 1
                ? "session"
                : "sessions"}
            </div>

          </div>


          {/* LOADING */}

          {loading &&
          sessions.length === 0 ? (

            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center shadow-sm">

              <div className="w-9 h-9 border-2 border-[#DBEAFE] border-t-[#2563EB] rounded-full animate-spin mx-auto" />

              <p className="text-sm text-[#64748B] mt-4">
                Loading attendance sessions...
              </p>

            </div>

          ) : totalSessions === 0 ? (

            /* EMPTY */

            <div className="bg-white rounded-2xl border border-dashed border-[#CBD5E1] p-12 text-center">

              <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] flex items-center justify-center text-3xl mx-auto">
                📋
              </div>

              <h3 className="text-lg font-bold text-[#0F172A] mt-5">
                No attendance sessions yet
              </h3>

              <p className="text-sm text-[#64748B] mt-2 max-w-md mx-auto">
                Create your first attendance
                session to start recording
                student attendance.
              </p>

              <button
                onClick={createSession}
                disabled={loading}
                className="mt-5 px-5 py-3 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 disabled:opacity-60"
              >
                + Create Session
              </button>

            </div>

          ) : (

            /* SESSION CARDS */

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

              {sessions.map((session) => {

                const isActive =
                  new Date(
                    session.expiry
                  ) > new Date();

                const present =
                  Number(
                    session.presentCount ||
                      0
                  );

                const total =
                  Number(
                    session.totalMarked ||
                      0
                  );

                const rate =
                  total > 0
                    ? Math.round(
                        (present /
                          total) *
                          100
                      )
                    : 0;

                return (

                  <div
                    key={session._id}
                    onClick={() => {
                      setSelectedSession(
                        session
                      );

                      fetchAttendance(
                        session._id
                      );
                    }}
                    className="group relative overflow-hidden bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >

                    {/* SHINE */}

                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

                    <div className="relative">

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <p className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">
                            Session
                          </p>

                          <p className="font-mono text-sm font-semibold text-[#0F172A] mt-1">
                            #
                            {session.sessionId
                              ?.substring(
                                0,
                                10
                              )}
                            ...
                          </p>

                        </div>

                        <span
                          className={
                            isActive
                              ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] text-[#16A34A] text-xs font-semibold"
                              : "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] text-xs font-semibold"
                          }
                        >

                          <span
                            className={
                              isActive
                                ? "w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"
                                : "w-1.5 h-1.5 rounded-full bg-[#94A3B8]"
                            }
                          />

                          {isActive
                            ? "Active"
                            : "Expired"}

                        </span>

                      </div>


                      <div className="flex items-center gap-2 mt-5 text-sm text-[#64748B]">

                        <span className="w-8 h-8 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
                          📅
                        </span>

                        <span>
                          {session.createdAt
                            ? new Date(
                                session.createdAt
                              ).toLocaleString()
                            : "Date unavailable"}
                        </span>

                      </div>


                      <div className="mt-5 pt-4 border-t border-[#E2E8F0]">

                        <div className="flex items-center justify-between">

                          <div>

                            <p className="text-xs text-[#94A3B8]">
                              Attendance
                            </p>

                            <p className="text-lg font-bold text-[#0F172A] mt-0.5">

                              <span className="text-[#16A34A]">
                                {present}
                              </span>

                              <span className="text-[#CBD5E1]">
                                {" "}
                                /{" "}
                              </span>

                              {total}

                            </p>

                          </div>

                          <div className="text-right">

                            <p className="text-xs text-[#94A3B8]">
                              Rate
                            </p>

                            <p className="text-lg font-bold text-[#2563EB]">
                              {rate}%
                            </p>

                          </div>

                        </div>


                        <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden mt-3">

                          <div
                            className="h-full bg-[#16A34A] rounded-full transition-all duration-700"
                            style={{
                              width: `${rate}%`,
                            }}
                          />

                        </div>


                        <button
                          onClick={(event) => {
                            event.stopPropagation();

                            setSelectedSession(
                              session
                            );

                            fetchAttendance(
                              session._id
                            );
                          }}
                          className="w-full mt-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-sm font-semibold text-[#2563EB] hover:bg-[#EFF6FF] hover:border-[#BFDBFE] transition-all duration-300"
                        >
                          View Attendance →
                        </button>

                      </div>

                    </div>

                  </div>

                );

              })}

            </div>

          )}

        </section>

      </div>


      {/* =====================================================
          QR CODE MODAL
      ===================================================== */}

      {showQR && qrCode && (

        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">

            {/* HEADER */}

            <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between">

              <div>

                <p className="text-xs uppercase tracking-wider font-semibold text-[#64748B]">
                  Live Attendance
                </p>

                <h3 className="text-xl font-bold text-[#0F172A] mt-1">
                  Scan QR Code
                </h3>

              </div>

              <button
                onClick={() =>
                  setShowQR(false)
                }
                className="w-9 h-9 rounded-xl bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all"
              >
                ✕
              </button>

            </div>


            <div className="p-6 text-center">

              {/* LIVE STATUS */}

              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] text-[#16A34A] text-sm font-semibold">

                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />

                {presentCount}{" "}
                {presentCount === 1
                  ? "student"
                  : "students"}{" "}
                present

              </div>


              {/* QR */}

              <div className="mt-5 p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl inline-block">

                <img
                  src={qrCode}
                  alt="Attendance QR Code"
                  className="w-56 h-56 object-contain rounded-xl"
                />

              </div>


              {/* TIMER */}

              <div className="mt-5">

                <p className="text-sm text-[#64748B]">
                  QR code expires in
                </p>

                <div
                  className={
                    timeRemaining <= 10
                      ? "text-3xl font-bold text-[#DC2626] mt-1"
                      : "text-3xl font-bold text-[#2563EB] mt-1"
                  }
                >

                  {Math.floor(
                    timeRemaining / 60
                  )}
                  :
                  {String(
                    timeRemaining % 60
                  ).padStart(2, "0")}

                </div>

              </div>


              {/* SECURITY INFO */}

              <div className="grid grid-cols-3 gap-2 mt-5">

                <div className="rounded-xl bg-[#EFF6FF] p-3">

                  <div className="text-lg">
                    📱
                  </div>

                  <p className="text-xs font-medium text-[#475569] mt-1">
                    QR
                  </p>

                </div>

                <div className="rounded-xl bg-[#F0FDF4] p-3">

                  <div className="text-lg">
                    📍
                  </div>

                  <p className="text-xs font-medium text-[#475569] mt-1">
                    GPS
                  </p>

                </div>

                <div className="rounded-xl bg-[#F5F3FF] p-3">

                  <div className="text-lg">
                    👤
                  </div>

                  <p className="text-xs font-medium text-[#475569] mt-1">
                    Face
                  </p>

                </div>

              </div>


              {/* TOKEN */}

              {qrToken && (

                <details className="mt-5 text-left">

                  <summary className="cursor-pointer text-sm font-semibold text-[#64748B]">
                    Technical QR Token
                  </summary>

                  <div className="mt-2 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] break-all font-mono">
                    {qrToken}
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        qrToken
                      );

                      toast.success(
                        "Token copied"
                      );
                    }}
                    className="mt-2 text-sm font-semibold text-[#2563EB] hover:underline"
                  >
                    Copy token
                  </button>

                </details>

              )}


              {/* ACTIONS */}

              <div className="grid grid-cols-2 gap-3 mt-6">

                <button
                  onClick={createSession}
                  disabled={loading}
                  className="py-3 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 disabled:opacity-60"
                >
                  {loading
                    ? "Creating..."
                    : "Generate New"}
                </button>

                <button
                  onClick={() =>
                    setShowQR(false)
                  }
                  className="py-3 rounded-xl bg-white border border-[#E2E8F0] text-[#475569] text-sm font-semibold hover:bg-[#F8FAFC] transition-all"
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          ATTENDANCE DETAILS MODAL
      ===================================================== */}

      {selectedSession && (

        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="w-full max-w-6xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">

            {/* HEADER */}

            <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">

              <div>

                <p className="text-xs uppercase tracking-wider font-semibold text-[#64748B]">
                  Attendance Records
                </p>

                <h3 className="text-xl font-bold text-[#0F172A] mt-1">
                  Session Attendance
                </h3>

              </div>

              <button
                onClick={() =>
                  setSelectedSession(null)
                }
                className="w-9 h-9 rounded-xl bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all"
              >
                ✕
              </button>

            </div>


            {/* BODY */}

            <div className="p-6 overflow-y-auto">

              {/* SESSION SUMMARY */}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

                <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4">

                  <p className="text-xs text-[#94A3B8]">
                    Session ID
                  </p>

                  <p className="text-sm font-mono font-semibold text-[#0F172A] mt-1 break-all">
                    {selectedSession.sessionId}
                  </p>

                </div>


                <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4">

                  <p className="text-xs text-[#94A3B8]">
                    Created
                  </p>

                  <p className="text-sm font-semibold text-[#0F172A] mt-1">
                    {selectedSession.createdAt
                      ? new Date(
                          selectedSession.createdAt
                        ).toLocaleString()
                      : "N/A"}
                  </p>

                </div>


                <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4">

                  <p className="text-xs text-[#94A3B8]">
                    Status
                  </p>

                  <p
                    className={
                      new Date(
                        selectedSession.expiry
                      ) > new Date()
                        ? "text-sm font-bold text-[#16A34A] mt-1"
                        : "text-sm font-bold text-[#64748B] mt-1"
                    }
                  >
                    {new Date(
                      selectedSession.expiry
                    ) > new Date()
                      ? "● Active"
                      : "● Expired"}
                  </p>

                </div>


                <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4">

                  <p className="text-xs text-[#94A3B8]">
                    Records
                  </p>

                  <p className="text-2xl font-bold text-[#2563EB] mt-1">
                    {attendance.length}
                  </p>

                </div>

              </div>


              {/* TOOLBAR */}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

                <div>

                  <h4 className="font-bold text-[#0F172A]">
                    Student Attendance
                  </h4>

                  <p className="text-sm text-[#94A3B8] mt-1">
                    {attendance.length}{" "}
                    {attendance.length === 1
                      ? "attendance record"
                      : "attendance records"}
                  </p>

                </div>

                <button
                  onClick={
                    exportAttendanceCSV
                  }
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >

                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14"
                    />

                  </svg>

                  Export CSV

                </button>

              </div>


              {/* TABLE */}

              {attendance.length === 0 ? (

                <div className="border border-dashed border-[#CBD5E1] rounded-2xl py-14 text-center">

                  <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center text-2xl mx-auto">
                    👥
                  </div>

                  <p className="text-sm font-semibold text-[#475569] mt-4">
                    No attendance records yet
                  </p>

                  <p className="text-xs text-[#94A3B8] mt-1">
                    Student attendance will
                    appear here in real time.
                  </p>

                </div>

              ) : (

                <div className="overflow-x-auto border border-[#E2E8F0] rounded-2xl">

                  <table className="w-full min-w-[850px]">

                    <thead className="bg-[#F8FAFC]">

                      <tr className="border-b border-[#E2E8F0]">

                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#64748B]">
                          Student
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#64748B]">
                          PRN
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#64748B]">
                          Email
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#64748B]">
                          Status
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#64748B]">
                          Time
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#64748B]">
                          Reason
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {attendance.map(
                        (item) => (

                          <tr
                            key={item._id}
                            className="border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8FAFC] transition-colors"
                          >

                            <td className="px-4 py-4">

                              <div className="flex items-center gap-3">

                                <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-sm">
                                  👤
                                </div>

                                <div>

                                  <p className="font-semibold text-[#0F172A]">
                                    {item
                                      .studentId
                                      ?.name ||
                                      "N/A"}
                                  </p>

                                </div>

                              </div>

                            </td>


                            <td className="px-4 py-4 text-sm text-[#64748B]">
                              {item.studentId
                                ?.prn || "—"}
                            </td>


                            <td className="px-4 py-4 text-sm text-[#64748B]">
                              {item.studentId
                                ?.email || "N/A"}
                            </td>


                            <td className="px-4 py-4">

                              {item.status ===
                              "Present" ? (

                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] text-[#16A34A] text-xs font-bold">
                                  ✓ Present
                                </span>

                              ) : (

                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-bold">
                                  ● Rejected
                                </span>

                              )}

                            </td>


                            <td className="px-4 py-4 text-sm text-[#64748B]">

                              {new Date(
                                item.createdAt ||
                                  item.timestamp
                              ).toLocaleTimeString()}

                            </td>


                            <td className="px-4 py-4 text-sm text-[#94A3B8]">

                              {item.rejectionReason ||
                                "—"}

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default TeacherDashboard;