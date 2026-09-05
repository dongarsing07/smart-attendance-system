// ==========================================
// DETECT FACE + GENERATE 128-VALUE DESCRIPTOR
// ==========================================
export const detectFace = async (video) => {
  try {
    // ==========================================
    // LOAD MODELS
    // ==========================================
    await loadFaceModels();

    console.log("========== FACE DEBUG ==========");

    console.log(
      "Video element:",
      video
    );

    console.log(
      "Video readyState:",
      video?.readyState
    );

    console.log(
      "Video width:",
      video?.videoWidth
    );

    console.log(
      "Video height:",
      video?.videoHeight
    );

    console.log(
      "Video paused:",
      video?.paused
    );

    console.log(
      "================================"
    );

    // ==========================================
    // VALIDATE VIDEO
    // ==========================================
    if (!video) {
      throw new Error(
        "Video element not found"
      );
    }

    if (video.readyState < 2) {
      throw new Error(
        "Video is not ready yet"
      );
    }

    if (
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      throw new Error(
        "Video has no dimensions"
      );
    }

    // ==========================================
    // DETECT FACE
    // ==========================================
    const detection = await faceapi
      .detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.3
        })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    // ==========================================
    // FACE NOT FOUND
    // ==========================================
    if (!detection) {
      console.log(
        "❌ Face API could not find a face"
      );

      return null;
    }

    console.log(
      "✅ FACE DETECTED"
    );

    // ==========================================
    // GET 128-VALUE DESCRIPTOR
    // ==========================================
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

    // ==========================================
    // VALIDATE DESCRIPTOR
    // ==========================================
    if (descriptor.length !== 128) {
      console.error(
        "❌ Invalid face descriptor length:",
        descriptor.length
      );

      return null;
    }

    // ==========================================
    // RETURN DETECTION + DESCRIPTOR
    // ==========================================
    return {
      detection,
      descriptor
    };

  } catch (error) {

    console.error(
      "❌ FACE DETECTION ERROR:",
      error
    );

    throw error;
  }
};