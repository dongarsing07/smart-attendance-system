import { useState, useEffect } from "react";

import QRScanner from "../components/QRScanner";
import FaceRegistration from "../components/FaceRegistration";
import FaceVerification from "../components/FaceVerification";

import { attendanceService } from "../services/api";

import toast from "react-hot-toast";
import LiveClock from "../components/LiveClock";

const StudentDashboard = ({ user }) => {
  const [scanning, setScanning] = useState(false);
  const [history, setHistory] = useState([]);
  const [location, setLocation] = useState(null);

  const [manualToken, setManualToken] = useState("");

  const [showFaceRegistration, setShowFaceRegistration] =
    useState(false);

  const [showFaceVerification, setShowFaceVerification] =
    useState(false);

  const [pendingQrToken, setPendingQrToken] = useState(null);

  const [selectedRecord, setSelectedRecord] = useState(null);

  const [search, setSearch] = useState("");

  const [loadingHistory, setLoadingHistory] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    fetchHistory();
    getLocation();
  }, []);

  /* =====================================================
     GPS LOCATION
  ===================================================== */

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error(
        "Geolocation is not supported by your browser."
      );
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });

        setLocationLoading(false);

        toast.success("GPS location detected");
      },
      () => {
        setLocationLoading(false);

        toast.error(
          "Enable GPS for attendance"
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  /* =====================================================
     FETCH ATTENDANCE HISTORY
  ===================================================== */

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);

      const res =
        await attendanceService.getMyAttendance();

      let historyData =
        res.data?.data || res.data;

      if (!Array.isArray(historyData)) {
        historyData = [];
      }

      setHistory(historyData);
    } catch (err) {
      console.error(
        "History error:",
        err
      );

      toast.error(
        "Failed to load attendance history"
      );

      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  /* =====================================================
     CHECK FACE REGISTRATION
  ===================================================== */

  const isFaceRegistered =
    user?.faceDescriptor &&
    Array.isArray(user.faceDescriptor) &&
    user.faceDescriptor.length === 128;

  /* =====================================================
     QR SCAN
  ===================================================== */

  const handleScan = (qrToken) => {
    setScanning(false);

    if (!qrToken) {
      toast.error(
        "Invalid QR code."
      );
      return;
    }

    /* ---------------- GPS CHECK ---------------- */

    if (!location) {
      toast.error(
        "Location unavailable. Please enable GPS."
      );

      getLocation();

      return;
    }

    /* ---------------- FACE CHECK ---------------- */

    if (!isFaceRegistered) {
      toast.error(
        "Please register your face before marking attendance."
      );

      setShowFaceRegistration(true);

      return;
    }

    /* ---------------- SAVE TOKEN ---------------- */

    setPendingQrToken(qrToken);

    /* ---------------- OPEN FACE VERIFICATION ---------------- */

    setShowFaceVerification(true);
  };

  /* =====================================================
     FACE VERIFICATION RESULT
  ===================================================== */

  const handleFaceVerified = async (result) => {
    if (!result || !result.matched) {
      toast.error(
        "Face verification failed. Attendance not marked."
      );

      return;
    }

    if (
      !result.descriptor ||
      result.descriptor.length !== 128
    ) {
      toast.error(
        "Invalid face descriptor."
      );

      return;
    }

    if (!pendingQrToken) {
      toast.error(
        "QR session is missing."
      );

      return;
    }

    if (!location) {
      toast.error(
        "GPS location is unavailable."
      );

      return;
    }

    try {
      setAttendanceLoading(true);

      toast.loading(
        "Verifying QR + GPS + Face...",
        {
          id: "attendance",
        }
      );

      const descriptor =
        Array.from(result.descriptor);

      const res =
        await attendanceService.markAttendance(
          pendingQrToken,
          location,
          descriptor
        );

      toast.success(
        res.data?.message ||
          "Attendance marked successfully!",
        {
          id: "attendance",
        }
      );

      setShowFaceVerification(false);

      setPendingQrToken(null);

      setManualToken("");

      await fetchHistory();
    } catch (err) {
      console.error(
        "Attendance error:",
        err
      );

      const message =
        err.response?.data?.message ||
        err.response?.data?.reason ||
        err.message ||
        "Attendance failed";

      toast.error(
        message,
        {
          id: "attendance",
        }
      );
    } finally {
      setAttendanceLoading(false);
    }
  };

  /* =====================================================
     MANUAL QR TOKEN
  ===================================================== */

  const handleManualSubmit = () => {
    const token =
      manualToken.trim();

    if (!token) {
      toast.error(
        "Please enter the QR token."
      );

      return;
    }

    handleScan(token);
  };

  /* =====================================================
     DEMO MOCK SCAN
  ===================================================== */

  const mockScan = () => {
    handleScan(
      "mock-session-id-for-demo"
    );
  };

  /* =====================================================
     STATISTICS
  ===================================================== */

  const presentCount =
    Array.isArray(history)
      ? history.filter(
          (item) =>
            item.status === "Present"
        ).length
      : 0;

  const rejectedCount =
    Array.isArray(history)
      ? history.filter(
          (item) =>
            item.status === "Rejected"
        ).length
      : 0;

  const totalAttempts =
    presentCount +
    rejectedCount;

  const attendanceRate =
    totalAttempts === 0
      ? 0
      : (
          (presentCount /
            totalAttempts) *
          100
        ).toFixed(1);

  /* =====================================================
     FILTER HISTORY
  ===================================================== */

  const filteredHistory =
    history.filter((record) => {
      if (!search.trim()) {
        return true;
      }

      const value =
        search.toLowerCase();

      const session =
        record.sessionId?.sessionId ||
        record.sessionId ||
        "";

      const status =
        record.status || "";

      const reason =
        record.rejectionReason || "";

      return (
        session
          .toString()
          .toLowerCase()
          .includes(value) ||
        status
          .toLowerCase()
          .includes(value) ||
        reason
          .toLowerCase()
          .includes(value)
      );
    });

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date)
      .toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
  };

  const formatTime = (date) => {
    if (!date) return "N/A";

    return new Date(date)
      .toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="min-h-screen bg-[#F7F9FD] text-[#18345F]">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="hero-gradient p-6 md:p-8 mb-6 animate-fade-in-up">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div>

              <div className="flex items-center gap-4">

                <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center text-3xl shadow-sm">
                  🎓
                </div>

                <div>

                  <p className="text-xs uppercase tracking-widest font-semibold text-[#63728A]">
                    Student Portal
                  </p>

                  <h1 className="text-2xl md:text-3xl font-bold text-[#18345F] mt-1">
                    Welcome back,{" "}
                    <span className="text-[#2F80C9]">
                      {user?.name || "Student"}
                    </span>
                  </h1>

                  <p className="text-sm text-[#63728A] mt-1">
                    Manage your attendance and verification securely.
                  </p>

                </div>

              </div>

            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">

              <LiveClock />

              <button
                onClick={() =>
                  setShowFaceRegistration(true)
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#2F80C9] border border-[#DCE5F1] font-semibold text-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
              >
                👤{" "}
                {isFaceRegistered
                  ? "Update Face"
                  : "Register Face"}
              </button>

            </div>

          </div>

        </div>


        {/* =================================================
            STUDENT PROFILE
        ================================================= */}

        <div
          id="profile"
          className="portal-card p-5 mb-6"
        >

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div className="flex items-center gap-4">

              <div className="w-12 h-12 rounded-xl bg-[#EAF3FF] flex items-center justify-center text-xl">
                👨‍🎓
              </div>

              <div>

                <p className="text-xs uppercase tracking-wider font-semibold text-[#8A96A8]">
                  Student Information
                </p>

                <h2 className="font-bold text-[#18345F] mt-1">
                  {user?.name || "Student"}
                </h2>

              </div>

            </div>


            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">

              <div>

                <p className="text-xs text-[#8A96A8]">
                  PRN
                </p>

                <p className="font-mono font-semibold text-sm text-[#18345F] mt-1">
                  {user?.prn || "Not assigned"}
                </p>

              </div>

              <div>

                <p className="text-xs text-[#8A96A8]">
                  Branch
                </p>

                <p className="font-semibold text-sm text-[#18345F] mt-1 max-w-[220px]">
                  {user?.branch || "Not assigned"}
                </p>

              </div>

              <div className="col-span-2 md:col-span-1">

                <p className="text-xs text-[#8A96A8]">
                  Face Verification
                </p>

                {isFaceRegistered ? (

                  <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full bg-[#E7FAF3] text-[#20B486] text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#20B486]" />
                    Registered
                  </span>

                ) : (

                  <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full bg-[#FFF6E5] text-[#D89000] text-xs font-semibold">
                    ⚠ Not Registered
                  </span>

                )}

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

          {/* PRESENT */}

          <div className="stat-card stat-card-green">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-[#63728A]">
                  Present
                </p>

                <p className="text-3xl font-bold text-[#18345F] mt-1">
                  {presentCount}
                </p>

                <p className="text-xs text-[#20B486] mt-1">
                  Successful attendance
                </p>

              </div>

              <div className="stat-icon">
                ✓
              </div>

            </div>

          </div>


          {/* REJECTED */}

          <div className="stat-card stat-card-red">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-[#63728A]">
                  Rejected
                </p>

                <p className="text-3xl font-bold text-[#18345F] mt-1">
                  {rejectedCount}
                </p>

                <p className="text-xs text-[#EF5B72] mt-1">
                  Failed attempts
                </p>

              </div>

              <div className="stat-icon">
                !
              </div>

            </div>

          </div>


          {/* RATE */}

          <div className="stat-card stat-card-blue">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-[#63728A]">
                  Attendance Rate
                </p>

                <p className="text-3xl font-bold text-[#18345F] mt-1">
                  {attendanceRate}%
                </p>

                <p className="text-xs text-[#2F80C9] mt-1">
                  Based on recorded attempts
                </p>

              </div>

              <div className="stat-icon">
                %
              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            ATTENDANCE PROCESS
        ================================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* QR CARD */}

          <div className="lg:col-span-2 portal-card p-6">

            <div className="flex items-start justify-between gap-4 mb-5">

              <div>

                <p className="text-xs uppercase tracking-wider font-semibold text-[#63728A]">
                  Mark Attendance
                </p>

                <h2 className="text-xl font-bold text-[#18345F] mt-1">
                  Scan Classroom QR Code
                </h2>

                <p className="text-sm text-[#8A96A8] mt-1">
                  Attendance is verified using QR, GPS and face recognition.
                </p>

              </div>

              <div className="w-11 h-11 rounded-xl bg-[#EAF3FF] flex items-center justify-center text-xl">
                📱
              </div>

            </div>


            {/* PROCESS STEPS */}

            <div className="grid grid-cols-3 gap-2 mb-6">

              <div className="rounded-xl bg-[#F7F9FD] border border-[#DCE5F1] p-3 text-center">

                <div className="text-xl">
                  📱
                </div>

                <p className="text-xs font-semibold text-[#18345F] mt-1">
                  QR Scan
                </p>

              </div>

              <div className="rounded-xl bg-[#F7F9FD] border border-[#DCE5F1] p-3 text-center">

                <div className="text-xl">
                  📍
                </div>

                <p className="text-xs font-semibold text-[#18345F] mt-1">
                  GPS Check
                </p>

              </div>

              <div className="rounded-xl bg-[#F7F9FD] border border-[#DCE5F1] p-3 text-center">

                <div className="text-xl">
                  👤
                </div>

                <p className="text-xs font-semibold text-[#18345F] mt-1">
                  Face Check
                </p>

              </div>

            </div>


            {!scanning ? (

              <div className="space-y-3">

                <button
                  onClick={() =>
                    setScanning(true)
                  }
                  disabled={!location || locationLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#2F80C9] text-white font-semibold hover:bg-[#2563C7] hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📷{" "}
                  {locationLoading
                    ? "Getting GPS..."
                    : "Start Camera Scanner"}
                </button>


                <div className="relative">

                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#DCE5F1]" />
                  </div>

                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs text-[#8A96A8]">
                      OR ENTER TOKEN
                    </span>
                  </div>

                </div>


                <div className="flex flex-col sm:flex-row gap-2">

                  <input
                    type="text"
                    value={manualToken}
                    onChange={(e) =>
                      setManualToken(
                        e.target.value
                      )
                    }
                    placeholder="Paste QR token here"
                    className="flex-1 px-4 py-3 rounded-xl border border-[#DCE5F1] bg-white text-[#18345F] placeholder:text-[#A5AFBE] focus:outline-none focus:ring-2 focus:ring-[#2F80C9]/20 focus:border-[#2F80C9]"
                  />

                  <button
                    onClick={handleManualSubmit}
                    className="px-5 py-3 rounded-xl border border-[#DCE5F1] bg-white text-[#2F80C9] font-semibold hover:bg-[#F7F9FD] transition"
                  >
                    Verify
                  </button>

                </div>


                {/* DEMO BUTTON */}

                <button
                  onClick={mockScan}
                  className="w-full text-xs text-[#8A96A8] hover:text-[#2F80C9] transition py-2"
                >
                  Demo / Test Scan
                </button>

              </div>

            ) : (

              <div>

                <div className="rounded-2xl overflow-hidden border border-[#DCE5F1] bg-[#0F172A]">

                  <QRScanner
                    onScanSuccess={handleScan}
                  />

                </div>

                <button
                  onClick={() =>
                    setScanning(false)
                  }
                  className="w-full mt-4 px-5 py-3 rounded-xl border border-[#DCE5F1] bg-white text-[#63728A] font-semibold hover:bg-[#F7F9FD] transition"
                >
                  Stop Scanner
                </button>

              </div>

            )}

          </div>


          {/* GPS CARD */}

          <div className="portal-card p-6">

            <div className="flex items-center justify-between mb-5">

              <div>

                <p className="text-xs uppercase tracking-wider font-semibold text-[#63728A]">
                  Security Check
                </p>

                <h2 className="text-lg font-bold text-[#18345F] mt-1">
                  GPS Location
                </h2>

              </div>

              <div className="w-10 h-10 rounded-xl bg-[#E7FAF3] flex items-center justify-center">
                📍
              </div>

            </div>


            <div className="rounded-xl bg-[#F7F9FD] border border-[#DCE5F1] p-4">

              <div className="flex items-center gap-2 mb-3">

                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    location
                      ? "bg-[#20B486]"
                      : "bg-[#EF5B72]"
                  }`}
                />

                <span className="text-sm font-semibold text-[#18345F]">
                  {location
                    ? "Location Available"
                    : "Location Required"}
                </span>

              </div>


              {location ? (

                <div className="space-y-2 font-mono text-xs text-[#63728A]">

                  <div className="flex justify-between gap-3">

                    <span>
                      Latitude
                    </span>

                    <span className="font-semibold text-[#18345F]">
                      {location.lat.toFixed(6)}
                    </span>

                  </div>

                  <div className="flex justify-between gap-3">

                    <span>
                      Longitude
                    </span>

                    <span className="font-semibold text-[#18345F]">
                      {location.lng.toFixed(6)}
                    </span>

                  </div>

                </div>

              ) : (

                <p className="text-sm text-[#EF5B72]">
                  GPS location has not been detected.
                </p>

              )}

            </div>


            <button
              onClick={getLocation}
              disabled={locationLoading}
              className="w-full mt-4 px-4 py-2.5 rounded-xl border border-[#DCE5F1] bg-white text-[#2F80C9] text-sm font-semibold hover:bg-[#F7F9FD] transition disabled:opacity-50"
            >
              {locationLoading
                ? "Detecting..."
                : "↻ Refresh Location"}
            </button>


            <div className="mt-5 p-4 rounded-xl bg-[#FFF9ED] border border-[#F6E4B7]">

              <p className="text-xs text-[#8A6A1D] leading-relaxed">
                Your location is used to verify that you are within the allowed classroom attendance area.
              </p>

            </div>

          </div>

        </div>


        {/* =================================================
            ATTENDANCE HISTORY
        ================================================= */}

        <div
          id="attendance"
          className="portal-card p-5 md:p-6"
        >

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">

            <div>

              <p className="text-xs uppercase tracking-wider font-semibold text-[#63728A]">
                Records
              </p>

              <h2 className="text-xl font-bold text-[#18345F] mt-1">
                Attendance History
              </h2>

              <p className="text-sm text-[#8A96A8] mt-1">
                Review your attendance attempts and verification results.
              </p>

            </div>


            <div className="flex flex-col sm:flex-row gap-2">

              <div className="relative">

                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A96A8]">
                  🔎
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search records..."
                  className="w-full sm:w-64 pl-9 pr-4 py-2.5 rounded-xl border border-[#DCE5F1] bg-white text-sm text-[#18345F] placeholder:text-[#A5AFBE] focus:outline-none focus:ring-2 focus:ring-[#2F80C9]/20 focus:border-[#2F80C9]"
                />

              </div>

              <button
                onClick={fetchHistory}
                className="px-4 py-2.5 rounded-xl border border-[#DCE5F1] bg-white text-[#63728A] text-sm font-semibold hover:bg-[#F7F9FD] transition"
              >
                ↻ Refresh
              </button>

            </div>

          </div>


          {/* RECORD COUNT */}

          <div className="flex items-center gap-2 mb-4">

            <span className="px-3 py-1.5 rounded-full bg-[#EEF4FB] text-[#2F80C9] text-xs font-semibold">
              {filteredHistory.length} records
            </span>

            {search && (
              <span className="text-xs text-[#8A96A8]">
                Filtered from {history.length}
              </span>
            )}

          </div>


          {/* LOADING */}

          {loadingHistory ? (

            <div className="py-14 text-center">

              <div className="w-8 h-8 border-2 border-[#DCE5F1] border-t-[#2F80C9] rounded-full animate-spin mx-auto" />

              <p className="text-sm text-[#8A96A8] mt-4">
                Loading attendance records...
              </p>

            </div>

          ) : filteredHistory.length === 0 ? (

            <div className="py-14 text-center border border-dashed border-[#DCE5F1] rounded-2xl">

              <div className="w-14 h-14 rounded-2xl bg-[#F7F9FD] flex items-center justify-center mx-auto text-2xl">
                📋
              </div>

              <h3 className="font-semibold text-[#18345F] mt-4">
                {search
                  ? "No matching records"
                  : "No attendance records yet"}
              </h3>

              <p className="text-sm text-[#8A96A8] mt-1">
                {search
                  ? "Try a different search term."
                  : "Your attendance activity will appear here."}
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto border border-[#DCE5F1] rounded-2xl">

              <table className="portal-table">

                <thead>

                  <tr>

                    <th>
                      Date & Time
                    </th>

                    <th>
                      Session
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Distance / Reason
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredHistory.map(
                    (record) => {

                      const date =
                        record.createdAt ||
                        record.timestamp;

                      const session =
                        record.sessionId?.sessionId ||
                        record.sessionId ||
                        "N/A";

                      return (

                        <tr
                          key={
                            record._id ||
                            `${session}-${date}`
                          }
                          className="hover:bg-[#F8FAFD] transition-colors"
                        >

                          {/* DATE */}

                          <td>

                            <div className="font-semibold text-[#18345F]">
                              {formatDate(date)}
                            </div>

                            <div className="text-xs text-[#8A96A8] mt-0.5">
                              {formatTime(date)}
                            </div>

                          </td>


                          {/* SESSION */}

                          <td>

                            <span className="inline-flex px-2.5 py-1 rounded-lg bg-[#F7F9FD] border border-[#DCE5F1] font-mono text-xs text-[#63728A]">
                              {session
                                .toString()
                                .substring(0, 12)}
                              {session.length > 12
                                ? "..."
                                : ""}
                            </span>

                          </td>


                          {/* STATUS */}

                          <td>

                            {record.status ===
                            "Present" ? (

                              <span className="badge-success">
                                ✓ Present
                              </span>

                            ) : (

                              <span className="badge-danger">
                                × Rejected
                              </span>

                            )}

                          </td>


                          {/* REASON */}

                          <td>

                            {record.rejectionReason ? (

                              <span className="text-sm text-[#EF5B72]">
                                {record.rejectionReason}
                              </span>

                            ) : (

                              <span className="text-sm text-[#20B486]">
                                ✓ Location verified
                              </span>

                            )}

                          </td>


                          {/* ACTION */}

                          <td>

                            <button
                              onClick={() =>
                                setSelectedRecord(
                                  record
                                )
                              }
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2F80C9] hover:bg-[#EAF3FF] transition"
                            >
                              View
                            </button>

                          </td>

                        </tr>

                      );

                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>


      {/* =================================================
          FACE REGISTRATION MODAL
      ================================================= */}

      {showFaceRegistration && (

        <div className="modal-overlay">

          <div className="modal-content max-w-lg">

            <div className="modal-header">

              <div>

                <p className="text-xs uppercase tracking-wider font-semibold text-[#63728A]">
                  Biometric Security
                </p>

                <h3 className="text-lg font-bold text-[#18345F]">
                  Face Registration
                </h3>

                <p className="text-sm text-[#8A96A8] mt-1">
                  Register your face for secure attendance verification.
                </p>

              </div>

              <button
                onClick={() =>
                  setShowFaceRegistration(false)
                }
                className="w-9 h-9 rounded-lg hover:bg-[#F7F9FD] flex items-center justify-center text-[#8A96A8]"
              >
                ✕
              </button>

            </div>


            <div className="modal-body">

              <FaceRegistration
                user={user}
                onComplete={() => {

                  setShowFaceRegistration(
                    false
                  );

                  toast.success(
                    "Face registration completed!"
                  );

                }}
              />

            </div>

          </div>

        </div>

      )}


      {/* =================================================
          FACE VERIFICATION MODAL
      ================================================= */}

      {showFaceVerification && (

        <div className="modal-overlay">

          <div className="modal-content max-w-lg">

            <div className="modal-header">

              <div>

                <p className="text-xs uppercase tracking-wider font-semibold text-[#63728A]">
                  Security Verification
                </p>

                <h3 className="text-lg font-bold text-[#18345F]">
                  Verify Your Identity
                </h3>

                <p className="text-sm text-[#8A96A8] mt-1">
                  Look at the camera to verify your face.
                </p>

              </div>

              <button
                onClick={() => {

                  setShowFaceVerification(
                    false
                  );

                  setPendingQrToken(
                    null
                  );

                }}
                disabled={attendanceLoading}
                className="w-9 h-9 rounded-lg hover:bg-[#F7F9FD] flex items-center justify-center text-[#8A96A8] disabled:opacity-50"
              >
                ✕
              </button>

            </div>


            <div className="modal-body">

              <FaceVerification
                storedDescriptor={
                  user.faceDescriptor
                }

                onVerified={
                  handleFaceVerified
                }

                onCancel={() => {

                  setShowFaceVerification(
                    false
                  );

                  setPendingQrToken(
                    null
                  );

                }}
              />

            </div>

          </div>

        </div>

      )}


      {/* =================================================
          ATTENDANCE DETAILS MODAL
      ================================================= */}

      {selectedRecord && (

        <div className="modal-overlay">

          <div className="modal-content max-w-md">

            <div className="modal-header">

              <div>

                <p className="text-xs uppercase tracking-wider font-semibold text-[#63728A]">
                  Attendance Record
                </p>

                <h3 className="text-lg font-bold text-[#18345F]">
                  Attendance Details
                </h3>

              </div>

              <button
                onClick={() =>
                  setSelectedRecord(
                    null
                  )
                }
                className="w-9 h-9 rounded-lg hover:bg-[#F7F9FD] flex items-center justify-center text-[#8A96A8]"
              >
                ✕
              </button>

            </div>


            <div className="modal-body">

              <div className="space-y-4">

                {/* STATUS */}

                <div className="rounded-xl bg-[#F7F9FD] p-4">

                  <p className="text-xs text-[#8A96A8]">
                    Status
                  </p>

                  <div className="mt-2">

                    {selectedRecord.status ===
                    "Present" ? (

                      <span className="badge-success">
                        ✓ Present
                      </span>

                    ) : (

                      <span className="badge-danger">
                        × Rejected
                      </span>

                    )}

                  </div>

                </div>


                {/* DATE */}

                <div className="grid grid-cols-2 gap-3">

                  <div className="rounded-xl bg-[#F7F9FD] p-4">

                    <p className="text-xs text-[#8A96A8]">
                      Date
                    </p>

                    <p className="text-sm font-semibold text-[#18345F] mt-1">
                      {formatDate(
                        selectedRecord.createdAt ||
                        selectedRecord.timestamp
                      )}
                    </p>

                  </div>


                  <div className="rounded-xl bg-[#F7F9FD] p-4">

                    <p className="text-xs text-[#8A96A8]">
                      Time
                    </p>

                    <p className="text-sm font-semibold text-[#18345F] mt-1">
                      {formatTime(
                        selectedRecord.createdAt ||
                        selectedRecord.timestamp
                      )}
                    </p>

                  </div>

                </div>


                {/* SESSION */}

                <div className="rounded-xl bg-[#F7F9FD] p-4">

                  <p className="text-xs text-[#8A96A8]">
                    Session
                  </p>

                  <p className="text-xs font-mono text-[#18345F] mt-2 break-all">
                    {selectedRecord.sessionId?.sessionId ||
                      selectedRecord.sessionId ||
                      "N/A"}
                  </p>

                </div>


                {/* LOCATION */}

                <div className="rounded-xl bg-[#F7F9FD] p-4">

                  <p className="text-xs text-[#8A96A8]">
                    Location
                  </p>

                  {selectedRecord.locationLat != null &&
                  selectedRecord.locationLng != null ? (

                    <div className="text-xs font-mono text-[#63728A] mt-2 space-y-1">

                      <p>
                        Latitude:{" "}
                        {Number(
                          selectedRecord.locationLat
                        ).toFixed(6)}
                      </p>

                      <p>
                        Longitude:{" "}
                        {Number(
                          selectedRecord.locationLng
                        ).toFixed(6)}
                      </p>

                    </div>

                  ) : (

                    <p className="text-sm text-[#8A96A8] mt-1">
                      Location information unavailable.
                    </p>

                  )}

                </div>


                {/* REASON */}

                {selectedRecord.rejectionReason && (

                  <div className="rounded-xl bg-[#FFF0F3] border border-[#F8D5DC] p-4">

                    <p className="text-xs text-[#EF5B72] font-semibold">
                      Rejection Reason
                    </p>

                    <p className="text-sm text-[#B43E52] mt-1">
                      {
                        selectedRecord.rejectionReason
                      }
                    </p>

                  </div>

                )}

              </div>


              <button
                onClick={() =>
                  setSelectedRecord(
                    null
                  )
                }
                className="w-full mt-5 btn-secondary"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default StudentDashboard;