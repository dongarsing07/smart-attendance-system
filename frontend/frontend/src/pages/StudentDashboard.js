import { useState, useEffect } from "react";

import QRScanner from "../components/QRScanner";
import FaceRegistration from "../components/FaceRegistration";
import FaceVerification from "../components/FaceVerification";

import { attendanceService } from "../services/api";

import toast from "react-hot-toast";
import LiveClock from "../components/LiveClock";


const StudentDashboard = ({ user }) => {

  // ==========================================
  // ATTENDANCE / QR / GPS
  // ==========================================

  const [scanning, setScanning] = useState(false);

  const [history, setHistory] = useState([]);

  const [location, setLocation] = useState(null);

  const [manualToken, setManualToken] = useState("");


  // ==========================================
  // FACE REGISTRATION
  // ==========================================

  const [showFaceRegistration, setShowFaceRegistration] =
    useState(false);


  // ==========================================
  // FACE VERIFICATION
  // ==========================================

  const [showFaceVerification, setShowFaceVerification] =
    useState(false);

  const [pendingQrToken, setPendingQrToken] =
    useState(null);


  // ==========================================
  // LOAD DASHBOARD
  // ==========================================

  useEffect(() => {

    fetchHistory();
    getLocation();

  }, []);


  // ==========================================
  // GET GPS LOCATION
  // ==========================================

  const getLocation = () => {

    if (!navigator.geolocation) {

      toast.error(
        "Geolocation is not supported by your browser."
      );

      return;
    }


    navigator.geolocation.getCurrentPosition(

      (pos) => {

        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });

        toast.success(
          "GPS location detected ✅"
        );
      },

      () => {

        toast.error(
          "Enable GPS for attendance"
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };


  // ==========================================
  // FETCH ATTENDANCE HISTORY
  // ==========================================

  const fetchHistory = async () => {

    try {

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
        "Failed to load history"
      );

      setHistory([]);
    }
  };


  // ==========================================
  // QR SCAN
  // ==========================================

  const handleScan = async (qrToken) => {

    setScanning(false);


    // ==========================================
    // CHECK GPS
    // ==========================================

    if (!location) {

      toast.error(
        "Location not available. Please enable GPS."
      );

      getLocation();

      return;
    }


    // ==========================================
    // CHECK FACE REGISTRATION
    // ==========================================

    if (
      !user.faceDescriptor ||
      !Array.isArray(user.faceDescriptor) ||
      user.faceDescriptor.length !== 128
    ) {

      toast.error(
        "Please register your face before marking attendance."
      );

      setShowFaceRegistration(true);

      return;
    }


    // ==========================================
    // SAVE QR TOKEN
    // ==========================================

    setPendingQrToken(qrToken);


    // ==========================================
    // OPEN FACE VERIFICATION
    // ==========================================

    setShowFaceVerification(true);

  };


  // ==========================================
  // FACE VERIFICATION RESULT
  // ==========================================

  const handleFaceVerified = async (result) => {

  console.log(
    "🔥 RECEIVED IN STUDENT DASHBOARD"
  );

  console.log(
    "Matched:",
    result?.matched
  );

  console.log(
    "Descriptor:",
    result?.descriptor
  );

  console.log(
    "Is Array:",
    Array.isArray(result?.descriptor)
  );

  console.log(
    "Descriptor length:",
    result?.descriptor?.length
  );

  // rest of your code...

    console.log(
      "=============================================="
    );


    // ==========================================
    // FACE FAILED
    // ==========================================

    if (
      !result ||
      !result.matched
    ) {

      toast.error(
        "Face verification failed. Attendance not marked."
      );

      return;
    }


    // ==========================================
    // CHECK DESCRIPTOR
    // ==========================================

    if (
      !result.descriptor ||
      result.descriptor.length !== 128
    ) {

      toast.error(
        "Invalid face descriptor."
      );

      return;
    }


    // ==========================================
    // CHECK QR TOKEN
    // ==========================================

    if (!pendingQrToken) {

      toast.error(
        "QR session is missing."
      );

      return;
    }


    // ==========================================
    // CHECK LOCATION
    // ==========================================

    if (!location) {

      toast.error(
        "GPS location is unavailable."
      );

      return;
    }


    try {

      toast.loading(
        "Verifying QR + GPS + Face...",
        {
          id: "attendance"
        }
      );


      // ==========================================
      // FINAL ATTENDANCE REQUEST
      // ==========================================

      console.log(
        "========== ATTENDANCE REQUEST =========="
      );

      console.log(
        "QR token exists:",
        !!pendingQrToken
      );

      console.log(
        "Location:",
        location
      );

      console.log(
        "Face descriptor length:",
        result.descriptor.length
      );

      console.log(
        "========================================"
      );


      const res =
        await attendanceService.markAttendance(
          pendingQrToken,
          location,
          result.descriptor
        );


      // ==========================================
      // SUCCESS
      // ==========================================

      console.log(
        "========== ATTENDANCE SUCCESS =========="
      );

      console.log(
        "Backend response:",
        res.data
      );

      console.log(
        "========================================"
      );


      toast.success(
        res.data?.message ||
        "Attendance marked successfully!",
        {
          id: "attendance"
        }
      );


      // ==========================================
      // CLOSE FACE MODAL
      // ==========================================

      setShowFaceVerification(false);

      setPendingQrToken(null);


      // ==========================================
      // CLEAR MANUAL TOKEN
      // ==========================================

      setManualToken("");


      // ==========================================
      // REFRESH HISTORY
      // ==========================================

      fetchHistory();


    } catch (err) {

      // ==========================================
      // DETAILED ERROR DEBUG
      // ==========================================

      console.error(
        "========== ATTENDANCE ERROR =========="
      );

      console.error(
        "Full error:",
        err
      );

      console.error(
        "HTTP status:",
        err.response?.status
      );

      console.error(
        "Backend response:",
        err.response?.data
      );

      console.error(
        "Backend message:",
        err.response?.data?.message
      );

      console.error(
        "Backend reason:",
        err.response?.data?.reason
      );

      console.error(
        "======================================"
      );


      // ==========================================
      // GET REAL BACKEND ERROR
      // ==========================================

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.reason ||
        err.message ||
        "Attendance failed";


      toast.error(
        errorMessage,
        {
          id: "attendance"
        }
      );

    }
  };


  // ==========================================
  // MOCK QR SCAN
  // ==========================================

  const mockScan = () => {

    handleScan(
      "mock-session-id-for-demo"
    );
  };


  // ==========================================
  // MANUAL QR TOKEN
  // ==========================================

  const handleManualSubmit = () => {

    if (!manualToken) {

      toast.error(
        "Please paste QR token"
      );

      return;
    }

    handleScan(
      manualToken
    );
  };


  // ==========================================
  // STATS
  // ==========================================

  const presentCount =
    Array.isArray(history)
      ? history.filter(
          h => h.status === "Present"
        ).length
      : 0;


  const rejectedCount =
    Array.isArray(history)
      ? history.filter(
          h => h.status === "Rejected"
        ).length
      : 0;


  const totalAttempts =
    presentCount + rejectedCount;


  const attendanceRate =
    totalAttempts === 0
      ? 0
      : (
          (presentCount /
            totalAttempts) *
          100
        ).toFixed(1);


  // ==========================================
  // UI
  // ==========================================

  return (

    <div className="container mx-auto px-4 py-8 text-white">


      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <div className="flex justify-between items-start mb-8">

        <div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">

            Student Dashboard

          </h1>


          <p className="text-gray-300 mt-1">

            Welcome back, {user.name} ✨

          </p>

        </div>


        <div className="flex flex-col items-end gap-2">

          <LiveClock />


          <button

            onClick={() =>
              setShowFaceRegistration(true)
            }

            className="btn-primary text-sm px-4 py-2"

          >

            🧑‍💻 Register Face

          </button>

        </div>

      </div>


      {/* ====================================== */}
      {/* FACE STATUS */}
      {/* ====================================== */}

      <div className="glass-card p-4 mb-6">

        <div className="flex items-center justify-between">

          <div>

            <h3 className="font-semibold">
              Face Recognition
            </h3>

            <p className="text-sm text-gray-400">
              Biometric attendance verification
            </p>

          </div>


          {user.faceDescriptor &&
          Array.isArray(user.faceDescriptor) &&
          user.faceDescriptor.length === 128 ? (

            <span className="text-green-400 font-semibold">
              ✅ Registered
            </span>

          ) : (

            <span className="text-yellow-400 font-semibold">
              ⚠️ Not Registered
            </span>

          )}

        </div>

      </div>


      {/* ====================================== */}
      {/* STUDENT INFO */}
      {/* ====================================== */}

      <div className="glass-card p-4 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>

            <span className="text-gray-400 text-sm">
              📚 PRN
            </span>

            <p className="text-xl font-mono text-blue-300 mt-1">
              {user.prn || "Not assigned"}
            </p>

          </div>


          <div>

            <span className="text-gray-400 text-sm">
              🏛️ Branch
            </span>

            <p className="text-xl text-cyan-300 mt-1">
              {user.branch || "Not assigned"}
            </p>

          </div>

        </div>

      </div>


      {/* ====================================== */}
      {/* STATS */}
      {/* ====================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">


        <div className="glass-card p-4 text-center">

          <div className="text-3xl font-bold text-green-400">
            {presentCount}
          </div>

          <div className="text-sm text-gray-300">
            ✅ Present
          </div>

        </div>


        <div className="glass-card p-4 text-center">

          <div className="text-3xl font-bold text-red-400">
            {rejectedCount}
          </div>

          <div className="text-sm text-gray-300">
            ❌ Rejected
          </div>

        </div>


        <div className="glass-card p-4 text-center">

          <div className="text-3xl font-bold text-blue-400">
            {attendanceRate}%
          </div>

          <div className="text-sm text-gray-300">
            📊 Attendance Rate
          </div>

        </div>

      </div>


      {/* ====================================== */}
      {/* QR + GPS */}
      {/* ====================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">


        {/* QR SCANNER */}

        <div className="glass-card p-6 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20">

          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">

            📷 Scan QR Code

            <span className="text-xs bg-blue-600 px-2 py-1 rounded-full">
              Active
            </span>

          </h2>


          {!scanning ? (

            <div className="space-y-3">


              <button

                onClick={() =>
                  setScanning(true)
                }

                className="btn-primary w-full py-3 text-lg"

                disabled={!location}

              >

                Start Camera Scanner

              </button>


              <button

                onClick={mockScan}

                className="btn-secondary w-full py-3 text-lg"

              >

                🎬 Mock Scan (Demo)

              </button>


              <input

                type="text"

                placeholder="Paste QR Token here"

                value={manualToken}

                onChange={(e) =>
                  setManualToken(
                    e.target.value
                  )
                }

                className="w-full p-3 rounded-lg bg-black/30 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"

              />


              <button

                onClick={handleManualSubmit}

                className="btn-primary w-full py-3"

              >

                Submit Token

              </button>

            </div>

          ) : (

            <>

              <QRScanner
                onScanSuccess={handleScan}
              />


              <button

                onClick={() =>
                  setScanning(false)
                }

                className="btn-secondary mt-4 w-full"

              >

                Stop Scanner

              </button>

            </>

          )}

        </div>


        {/* GPS */}

        <div className="glass-card p-6">

          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">

            📍 GPS Location

          </h2>


          <div className="space-y-3">


            <div className="bg-black/30 rounded-lg p-3 font-mono text-sm">

              {location ? (

                <>

                  <div>
                    Latitude:{" "}
                    {location.lat.toFixed(6)}
                  </div>

                  <div>
                    Longitude:{" "}
                    {location.lng.toFixed(6)}
                  </div>

                </>

              ) : (

                <div className="text-yellow-400">
                  Waiting for GPS signal...
                </div>

              )}

            </div>


            <button

              onClick={getLocation}

              className="text-blue-400 text-sm hover:text-blue-300 transition w-full text-center"

            >

              🔄 Refresh Location

            </button>


            <p className="text-xs text-gray-400 mt-2">

              Your location is used to verify
              you are within 50m of the class.

            </p>

          </div>

        </div>

      </div>


      {/* ====================================== */}
      {/* ATTENDANCE HISTORY */}
      {/* ====================================== */}

      <div className="glass-card p-6">

        <div className="flex justify-between items-center mb-4">

          <h2 className="text-2xl font-bold flex items-center gap-2">

            📋 Attendance History

            <span className="text-sm bg-gray-700 px-2 py-1 rounded-full">

              {history.length} records

            </span>

          </h2>

        </div>


        {history.length === 0 ? (

          <div className="text-center py-8 text-gray-400">

            No attendance records yet.

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="border-b border-white/10">

                  <th className="text-left py-3 px-2">
                    Date & Time
                  </th>

                  <th className="text-left py-3 px-2">
                    Session
                  </th>

                  <th className="text-left py-3 px-2">
                    Status
                  </th>

                  <th className="text-left py-3 px-2">
                    Distance / Reason
                  </th>

                </tr>

              </thead>


              <tbody>

                {history.map(
                  (record) => (

                    <tr
                      key={record._id}
                      className="border-b border-white/5"
                    >

                      <td className="py-3 px-2">

                        <div className="font-medium">

                          {new Date(
                            record.createdAt ||
                            record.timestamp
                          ).toLocaleDateString()}

                        </div>

                        <div className="text-xs text-gray-400">

                          {new Date(
                            record.createdAt ||
                            record.timestamp
                          ).toLocaleTimeString()}

                        </div>

                      </td>


                      <td className="py-3 px-2">

                        <span className="text-xs font-mono">

                          {record.sessionId?.sessionId?.substring(
                            0,
                            8
                          ) ||
                            record.sessionId ||
                            "N/A"}

                          ...

                        </span>

                      </td>


                      <td className="py-3 px-2">

                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            record.status ===
                            "Present"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >

                          {record.status ===
                          "Present"
                            ? "✅"
                            : "❌"}

                          {" "}

                          {record.status}

                        </span>

                      </td>


                      <td className="py-3 px-2 text-sm">

                        {record.rejectionReason ? (

                          <span className="text-red-300">
                            {record.rejectionReason}
                          </span>

                        ) : (

                          <span className="text-green-300">

                            📍{" "}

                            {record.distance ||
                              "~"}m from class

                          </span>

                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ====================================== */}
      {/* FACE REGISTRATION MODAL */}
      {/* ====================================== */}

      {showFaceRegistration && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">

          <FaceRegistration

            user={user}

            onComplete={() => {

              setShowFaceRegistration(false);

              toast.success(
                "Face registration completed!"
              );

            }}

          />

        </div>

      )}


      {/* ====================================== */}
      {/* FACE VERIFICATION MODAL */}
      {/* ====================================== */}

      {showFaceVerification && (

        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">

          <FaceVerification

            storedDescriptor={
              user.faceDescriptor
            }

            onVerified={
              handleFaceVerified
            }

            onCancel={() => {

              setShowFaceVerification(false);

              setPendingQrToken(null);

            }}

          />

        </div>

      )}

    </div>
  );
};


export default StudentDashboard;