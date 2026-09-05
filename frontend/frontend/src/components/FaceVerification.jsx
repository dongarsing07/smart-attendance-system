import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import {
  loadFaceModels,
  detectFace
} from "../utils/faceRecognition";

const FaceVerification = ({
  storedDescriptor,
  onVerified,
  onCancel
}) => {

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [distance, setDistance] = useState(null);

  // ==========================================
  // START CAMERA
  // ==========================================
  const startCamera = async () => {
    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user"
          }
        });

      streamRef.current = stream;

      if (videoRef.current) {

        videoRef.current.srcObject =
          stream;

        await videoRef.current.play();
      }

      setIsCameraOn(true);
      setResult(null);
      setDistance(null);

    } catch (error) {

      console.error(
        "Camera error:",
        error
      );

      toast.error(
        "Unable to access camera. Please allow camera permission."
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

    setIsCameraOn(false);
  };

  // ==========================================
  // VERIFY FACE
  // ==========================================
  const verifyFace = async () => {

    if (!storedDescriptor) {

      toast.error(
        "Registered face data not found."
      );

      return;
    }

    if (storedDescriptor.length !== 128) {

      toast.error(
        "Invalid registered face descriptor."
      );

      return;
    }

    if (!videoRef.current) {

      toast.error(
        "Camera is not ready."
      );

      return;
    }

    try {

      setIsVerifying(true);
      setResult(null);
      setDistance(null);

      toast.loading(
        "Detecting your face...",
        {
          id: "face-verification"
        }
      );

      // ==========================================
      // LOAD MODELS
      // ==========================================
      await loadFaceModels();

      // ==========================================
      // DETECT LIVE FACE
      // ==========================================
      const faceResult =
        await detectFace(
          videoRef.current
        );

      if (!faceResult) {

        toast.error(
          "Face not detected. Please look directly at the camera.",
          {
            id: "face-verification"
          }
        );

        setIsVerifying(false);

        return;
      }

      // ==========================================
      // GET LIVE DESCRIPTOR
      // ==========================================
      const currentDescriptor =
        faceResult.descriptor;

      console.log(
        "Stored descriptor length:",
        storedDescriptor.length
      );

      console.log(
        "Current descriptor length:",
        currentDescriptor.length
      );

      // ==========================================
      // CALCULATE EUCLIDEAN DISTANCE
      // ==========================================
      const distanceValue =
        calculateEuclideanDistance(
          storedDescriptor,
          currentDescriptor
        );

      console.log(
        "Face distance:",
        distanceValue
      );

      setDistance(distanceValue);

      // ==========================================
      // MATCH THRESHOLD
      // ==========================================
      const threshold = 0.5;

      const matched =
        distanceValue < threshold;

      // ==========================================
      // MATCH RESULT
      // ==========================================
      if (matched) {

  setResult("verified");

  toast.success(
    "Face verified successfully! ✅",
    {
      id: "face-verification"
    }
  );

  stopCamera();

  if (onVerified) {

    const descriptorArray =
      Array.from(currentDescriptor);

    console.log(
      "🔥 SENDING DESCRIPTOR FROM FACE VERIFICATION"
    );

    console.log(
      "Is Array:",
      Array.isArray(descriptorArray)
    );

    console.log(
      "Length:",
      descriptorArray.length
    );

    console.log(
      "First 5 values:",
      descriptorArray.slice(0, 5)
    );

    onVerified({
      matched: true,
      distance: distanceValue,
      descriptor: descriptorArray
    });
  }

} else {

        setResult("mismatch");

        toast.error(
          "Face does not match registered face.",
          {
            id: "face-verification"
          }
        );

        if (onVerified) {
          onVerified({
            matched: false,
            distance: distanceValue
          });
        }
      }

    } catch (error) {

      console.error(
        "Face verification error:",
        error
      );

      toast.error(
        "Face verification failed.",
        {
          id: "face-verification"
        }
      );

    } finally {

      setIsVerifying(false);

    }
  };

  // ==========================================
  // EUCLIDEAN DISTANCE
  // ==========================================
  const calculateEuclideanDistance = (
    descriptor1,
    descriptor2
  ) => {

    if (
      descriptor1.length !== 128 ||
      descriptor2.length !== 128
    ) {
      throw new Error(
        "Both descriptors must contain 128 values."
      );
    }

    let sum = 0;

    for (let i = 0; i < 128; i++) {

      const difference =
        descriptor1[i] -
        descriptor2[i];

      sum +=
        difference * difference;
    }

    return Math.sqrt(sum);
  };

  // ==========================================
  // CLEANUP
  // ==========================================
  useEffect(() => {

    return () => {
      stopCamera();
    };

  }, []);

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="glass-card p-6 w-full max-w-md mx-auto">

      <h3 className="text-xl font-bold text-white mb-3">
        Face Verification
      </h3>

      <p className="text-gray-300 text-sm mb-4">
        Look directly at the camera to verify
        your identity before marking attendance.
      </p>

      {/* CAMERA */}
      <div className="relative bg-black/40 rounded-lg overflow-hidden aspect-video">

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {!isCameraOn && !result && (

          <div className="absolute inset-0 flex items-center justify-center bg-black/60">

            <button
              onClick={startCamera}
              className="btn-primary px-6 py-2"
            >
              📷 Start Camera
            </button>

          </div>

        )}

      </div>

      {/* BUTTONS */}
      <div className="flex justify-center gap-3 mt-4">

        {isCameraOn && !result && (

          <button
            onClick={verifyFace}
            disabled={isVerifying}
            className="btn-primary px-6 py-2"
          >

            {isVerifying
              ? "🔍 Verifying..."
              : "🔐 Verify Face"}

          </button>

        )}

        {onCancel && !result && (

          <button
            onClick={() => {
              stopCamera();
              onCancel();
            }}
            className="btn-secondary px-6 py-2"
          >
            Cancel
          </button>

        )}

      </div>

      {/* VERIFIED */}
      {result === "verified" && (

        <div className="mt-4 text-center">

          <p className="text-green-400 text-xl font-bold">
            ✅ Face Verified
          </p>

          <p className="text-gray-300 text-sm mt-1">
            Distance: {distance?.toFixed(4)}
          </p>

          <p className="text-green-400 text-sm mt-1">
            Identity confirmed.
          </p>

        </div>

      )}

      {/* MISMATCH */}
      {result === "mismatch" && (

        <div className="mt-4 text-center">

          <p className="text-red-400 text-xl font-bold">
            ❌ Face Mismatch
          </p>

          <p className="text-gray-300 text-sm mt-1">
            Distance: {distance?.toFixed(4)}
          </p>

          <p className="text-red-400 text-sm mt-1">
            Please try again.
          </p>

          <button
            onClick={() => {
              setResult(null);
              setDistance(null);
              startCamera();
            }}
            className="btn-primary px-6 py-2 mt-3"
          >
            🔄 Try Again
          </button>

        </div>

      )}

    </div>
  );
};

export default FaceVerification;