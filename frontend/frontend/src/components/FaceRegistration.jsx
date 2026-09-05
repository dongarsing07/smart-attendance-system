import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  loadFaceModels,
  detectFace
} from "../utils/faceRecognition";

const FaceRegistration = ({ user, onComplete }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [status, setStatus] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // ==========================================
  // START CAMERA
  // ==========================================
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCapturing(true);
      setStatus('idle');

    } catch (err) {
      console.error("Camera Error:", err);

      toast.error(
        'Unable to access camera. Please allow camera permissions.'
      );
    }
  };

  // ==========================================
  // STOP CAMERA
  // ==========================================
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach(track => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCapturing(false);
  };

  // ==========================================
  // CAPTURE FACE + GENERATE DESCRIPTOR
  // ==========================================
  const captureFrame = async () => {
    if (!videoRef.current) {
      toast.error("Camera is not ready.");
      return;
    }

    try {
      setStatus('detecting');

      // ------------------------------------------
      // Load face-api.js models
      // ------------------------------------------
      await loadFaceModels();

      console.log("Face models loaded ✅");

      // ------------------------------------------
      // Detect face from LIVE VIDEO
      // ------------------------------------------
      const detection = await detectFace(
        videoRef.current
      );

      // ------------------------------------------
      // No face detected
      // ------------------------------------------
      if (!detection) {
        setStatus('idle');

        toast.error(
          "No face detected. Please look directly at the camera."
        );

        return;
      }

      console.log("Face detected ✅");

      // ------------------------------------------
      // Generate 128-value face descriptor
      // ------------------------------------------
      const descriptor = Array.from(
        detection.descriptor
      );

      console.log(
        "Face descriptor:",
        descriptor
      );

      console.log(
        "Descriptor length:",
        descriptor.length
      );

      // ------------------------------------------
      // Verify descriptor
      // ------------------------------------------
      if (descriptor.length !== 128) {
        setStatus('error');

        toast.error(
          "Face descriptor generation failed."
        );

        return;
      }

      // Save descriptor in React state
      setFaceDescriptor(descriptor);

      // ------------------------------------------
      // Capture image
      // ------------------------------------------
      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const base64 = canvas.toDataURL(
        'image/jpeg',
        0.9
      );

      setCapturedImage(base64);
      setStatus('captured');

      // Stop camera AFTER face detection
      stopCamera();

      toast.success(
        "Face captured successfully!"
      );

    } catch (err) {
      console.error(
        "Face Detection Error:",
        err
      );

      setStatus('error');

      toast.error(
        "Unable to detect face. Please try again."
      );
    }
  };

  // ==========================================
  // REGISTER FACE
  // ==========================================
  const registerFace = async () => {
    if (!capturedImage) {
      toast.error("Please capture your face first.");
      return;
    }

    if (!faceDescriptor) {
      toast.error(
        "Face descriptor not available. Please retake your face."
      );
      return;
    }

    if (faceDescriptor.length !== 128) {
      toast.error(
        "Invalid face descriptor. Please retake your face."
      );
      return;
    }

    setIsRegistering(true);
    setStatus('uploading');

    try {
      console.log(
        "Sending face registration request..."
      );

      console.log(
        "Descriptor length:",
        faceDescriptor.length
      );

      // ------------------------------------------
      // Send image + descriptor to backend
      // ------------------------------------------
      const response = await api.post(
        '/face/register',
        {
          faceImage: capturedImage,
          faceDescriptor: faceDescriptor
        }
      );

      console.log(
        "Registration response:",
        response.data
      );

      if (response.data.success) {

        setStatus('success');

        toast.success(
          'Face registered successfully!'
        );

        if (onComplete) {
          onComplete(response.data);
        }

      } else {

        setStatus('error');

        toast.error(
          response.data.message ||
          'Registration failed'
        );
      }

    } catch (err) {

      console.error(
        "Face Registration Error:",
        err
      );

      setStatus('error');

      toast.error(
        err.response?.data?.message ||
        'Server error'
      );

    } finally {

      setIsRegistering(false);

    }
  };

  // ==========================================
  // RETAKE
  // ==========================================
  const retake = () => {

    setCapturedImage(null);

    setFaceDescriptor(null);

    setStatus('idle');

    startCamera();
  };

  // ==========================================
  // CLEANUP CAMERA
  // ==========================================
  React.useEffect(() => {

    return () => {

      if (streamRef.current) {

        streamRef.current
          .getTracks()
          .forEach(track => track.stop());

      }

    };

  }, []);

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="glass-card p-6 w-full max-w-md mx-auto">

      <h3 className="text-xl font-bold text-white mb-4">
        Face Registration
      </h3>

      <p className="text-gray-300 text-sm mb-4">
        Capture your face to enable biometric
        verification for future attendance.
      </p>

      {/* ======================================
          CAMERA / CAPTURED IMAGE
      ====================================== */}

      <div className="relative bg-black/40 rounded-lg overflow-hidden aspect-video">

        {!capturedImage ? (

          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />

            {!isCapturing && (

              <div className="absolute inset-0 flex items-center justify-center bg-black/60">

                <button
                  onClick={startCamera}
                  className="btn-primary px-6 py-2"
                >
                  📷 Start Camera
                </button>

              </div>

            )}
          </>

        ) : (

          <img
            src={capturedImage}
            alt="Captured face"
            className="w-full h-full object-cover"
          />

        )}

        <canvas
          ref={canvasRef}
          className="hidden"
        />

      </div>

      {/* ======================================
          BUTTONS
      ====================================== */}

      <div className="mt-4 flex flex-wrap gap-3 justify-center">

        {/* Capture */}
        {isCapturing && !capturedImage && (

          <button
            onClick={captureFrame}
            className="btn-primary px-6 py-2"
            disabled={isRegistering}
          >

            {status === 'detecting'
              ? '🔍 Detecting Face...'
              : '📸 Capture Face'}

          </button>

        )}

        {/* Register + Retake */}
        {capturedImage &&
          status !== 'success' && (

            <>

              <button
                onClick={registerFace}
                className="btn-primary px-6 py-2"
                disabled={isRegistering}
              >

                {isRegistering
                  ? 'Registering...'
                  : '✅ Register'}

              </button>

              <button
                onClick={retake}
                className="btn-secondary px-6 py-2"
                disabled={isRegistering}
              >

                🔄 Retake

              </button>

            </>

          )}

        {/* Done */}
        {status === 'success' && (

          <button
            onClick={() => {

              setCapturedImage(null);

              setFaceDescriptor(null);

              setStatus(null);

            }}
            className="btn-primary px-6 py-2"
          >

            Done

          </button>

        )}

      </div>

      {/* ======================================
          STATUS MESSAGES
      ====================================== */}

      {status === 'detecting' && (

        <p className="text-blue-400 text-center mt-2">

          🔍 Detecting face and generating
          face descriptor...

        </p>

      )}

      {status === 'uploading' && (

        <p className="text-yellow-400 text-center mt-2">

          ☁️ Uploading face and saving
          biometric data...

        </p>

      )}

      {status === 'success' && (

        <p className="text-green-400 text-center mt-2">

          ✅ Face registered successfully!

        </p>

      )}

      {status === 'error' && (

        <p className="text-red-400 text-center mt-2">

          ❌ Registration failed. Please retry.

        </p>

      )}

      {/* ======================================
          DESCRIPTOR DEBUG INFO
      ====================================== */}

      {faceDescriptor && status === 'captured' && (

        <p className="text-green-400 text-xs text-center mt-2">

          ✅ Face descriptor generated
          ({faceDescriptor.length} values)

        </p>

      )}

      {!capturedImage &&
        !isCapturing && (

          <p className="text-gray-400 text-xs text-center mt-2">

            Ensure good lighting and face directly
            facing the camera.

          </p>

        )}

    </div>
  );
};

export default FaceRegistration;