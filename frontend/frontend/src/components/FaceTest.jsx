import React, { useEffect, useRef, useState } from "react";
import { detectFace, loadFaceModels } from "../utils/faceRecognition";

const FaceTest = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [message, setMessage] = useState(
    "Loading face recognition models..."
  );

  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      // Load models
      await loadFaceModels();

      setLoading(false);

      // Start camera
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user"
          },
          audio: false
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraReady(true);

      setMessage(
        "Camera ready. Look directly at the camera."
      );
    } catch (error) {
      console.error("Face Test Error:", error);

      setLoading(false);

      setMessage(
        "❌ Failed to start face recognition."
      );
    }
  };

  const handleDetectFace = async () => {
    try {
      setMessage("Detecting face...");

      if (!videoRef.current) {
        setMessage("Camera is not ready.");
        return;
      }

      const detection = await detectFace(
        videoRef.current
      );

      if (!detection) {
        setMessage(
          "❌ No face detected. Look directly at the camera."
        );

        return;
      }

      console.log(
        "Face Detection:",
        detection
      );

      console.log(
        "Face Descriptor:",
        detection.descriptor
      );

      console.log(
        "Descriptor Length:",
        detection.descriptor.length
      );

      setMessage(
        "✅ Face detected successfully!"
      );
    } catch (error) {
      console.error(
        "Face Detection Error:",
        error
      );

      setMessage(
        "❌ Face detection failed."
      );
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "700px",
        margin: "auto"
      }}
    >
      <h2>
        Face Recognition Test
      </h2>

      <p>{message}</p>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        width="100%"
        style={{
          maxWidth: "500px",
          borderRadius: "12px",
          marginTop: "20px"
        }}
      />

      <br />

      <button
        onClick={handleDetectFace}
        disabled={!cameraReady || loading}
        style={{
          marginTop: "20px",
          padding: "12px 20px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer"
        }}
      >
        Detect Face
      </button>
    </div>
  );
};

export default FaceTest;