import * as faceapi from "face-api.js";

let modelsLoaded = false;

export const loadFaceModels = async () => {
  if (modelsLoaded) {
    return;
  }

  const MODEL_URL = "/models";

  console.log("Loading Tiny Face Detector...");

  await faceapi.nets.tinyFaceDetector.loadFromUri(
    MODEL_URL
  );

  console.log("Loading Face Landmark Model...");

  await faceapi.nets.faceLandmark68Net.loadFromUri(
    MODEL_URL
  );

  console.log("Loading Face Recognition Model...");

  await faceapi.nets.faceRecognitionNet.loadFromUri(
    MODEL_URL
  );

  modelsLoaded = true;

  console.log(
    "All face models loaded successfully ✅"
  );
};

export const detectFace = async (video) => {
  await loadFaceModels();

  const detection = await faceapi
    .detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.5
      })
    )
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    return null;
  }

  return detection;
};