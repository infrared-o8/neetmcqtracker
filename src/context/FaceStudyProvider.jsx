import { useCallback, useEffect, useRef, useState } from "react";
import * as blazeface from "@tensorflow-models/blazeface";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import { FaceStudyContext } from "./faceStudyContext";
import { useTrackerStore } from "../store/useTrackerStore";

const FACE_THRESHOLD = 0.6;
const TICK_MS = 1000;
const SECONDS_PER_MINUTE = 60;

export function FaceStudyProvider({ children }) {
  const addStudyMinute = useTrackerStore((s) => s.addStudyMinute);
  const preferences = useTrackerStore((s) => s.preferences);

  const [active, setActive] = useState(false);
  // ... rest of state ...
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [phoneDetected, setPhoneDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [secondsTowardMinute, setSecondsTowardMinute] = useState(0);
  const [minuteBurst, setMinuteBurst] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const faceModelRef = useRef(null);
  const objectModelRef = useRef(null);
  const tickRef = useRef(null);
  const consecutiveRef = useRef(0);

  const triggerMinuteReward = useCallback(() => {
    setMinuteBurst({ id: Date.now(), label: "+1 Study Min" });
    setTimeout(() => setMinuteBurst(null), 2200);
  }, []);

  const stopCamera = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
    setFaceDetected(false);
    setPhoneDetected(false);
    setConfidence(0);
    consecutiveRef.current = 0;
    setSecondsTowardMinute(0);
  }, []);

  const startCamera = useCallback(async () => {
    // If already active and stream exists, just re-attach to the current videoRef if needed
    if (streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn("Auto-play blocked or failed on re-attach:", e);
        }
      }
      setActive(true);
      return;
    }

    setError("");
    setLoading(true);
    try {
      // Load both models if not already loaded
      if (!faceModelRef.current) {
        faceModelRef.current = await blazeface.load();
      }
      if (!objectModelRef.current) {
        objectModelRef.current = await cocoSsd.load();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);

      if (tickRef.current) clearInterval(tickRef.current);

      const detectionInterval = 
        preferences.aiDetectionRate === "power-save" ? 3000 : 
        preferences.aiDetectionRate === "ultra-low" ? 5000 : 1000;

      tickRef.current = setInterval(async () => {
        const video = videoRef.current;
        const faceModel = faceModelRef.current;
        const objectModel = objectModelRef.current;
        if (!video || !faceModel || !objectModel || video.readyState < 2) return;

        try {
          // Parallel detection
          const [faces, objects] = await Promise.all([
            faceModel.estimateFaces(video, false),
            objectModel.detect(video),
          ]);

          // Face logic
          const bestFace =
            faces.length > 0
              ? Math.max(
                  ...faces.map((p) => {
                    const prob = p.probability;
                    if (typeof prob === "number") return prob;
                    if (Array.isArray(prob)) return prob[0] ?? 0;
                    return 0;
                  }),
                )
              : 0;
          
          setConfidence(bestFace);
          const hasFace = bestFace >= FACE_THRESHOLD;
          setFaceDetected(hasFace);

          // Phone logic
          const hasPhone = objects.some(
            (obj) => obj.class === "cell phone" && obj.score > 0.5
          );
          setPhoneDetected(hasPhone);

          // Advanced Intelligence: Study minute logic
          // Only increment if face is detected AND NO phone is detected
          if (hasFace && !hasPhone) {
            const increment = detectionInterval / 1000;
            consecutiveRef.current += increment;
            setSecondsTowardMinute(Math.floor(consecutiveRef.current));
            if (consecutiveRef.current >= SECONDS_PER_MINUTE) {
              addStudyMinute();
              useTrackerStore.setState((s) => ({ xp: s.xp + 1 }));
              triggerMinuteReward();
              consecutiveRef.current = 0;
              setSecondsTowardMinute(0);
            }
          } else {
            if (hasPhone) {
              const penalty = (detectionInterval / 1000) * 2;
              consecutiveRef.current = Math.max(0, consecutiveRef.current - penalty);
            }
            setSecondsTowardMinute(Math.floor(consecutiveRef.current));
          }
        } catch (err) {
          console.error("Detection error:", err);
        }
      }, detectionInterval);
    } catch (e) {
      setError(e.message || "Camera access denied or unavailable.");
      stopCamera();
    } finally {
      setLoading(false);
    }
  }, [addStudyMinute, stopCamera, triggerMinuteReward, preferences.aiDetectionRate]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const value = {
    videoRef,
    active,
    loading,
    error,
    faceDetected,
    phoneDetected,
    confidence,
    secondsTowardMinute,
    minuteBurst,
    progressPercent: (secondsTowardMinute / SECONDS_PER_MINUTE) * 100,
    startCamera,
    stopCamera,
  };

  return <FaceStudyContext.Provider value={value}>{children}</FaceStudyContext.Provider>;
}
