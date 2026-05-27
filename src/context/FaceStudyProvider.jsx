import { useCallback, useEffect, useRef, useState } from "react";
import * as blazeface from "@tensorflow-models/blazeface";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [secondsTowardMinute, setSecondsTowardMinute] = useState(0);
  const [minuteBurst, setMinuteBurst] = useState(null);
  const [navigationPersistence, setNavigationPersistence] = useState('pending');
  const [activeStream, setActiveStream] = useState(null);

  const persistentVideoRef = useRef(null);
  const streamRef = useRef(null);
  const faceModelRef = useRef(null);
  const tickRef = useRef(null);
  const consecutiveRef = useRef(0);

  const triggerMinuteReward = useCallback(() => {
    setMinuteBurst({ id: Date.now(), label: "+1 Study Min" });
    setTimeout(() => setMinuteBurst(null), 2200);
  }, []);

  const isInitializingRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (tickRef.current) {
      clearTimeout(tickRef.current);
      tickRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (persistentVideoRef.current) persistentVideoRef.current.srcObject = null;
    setActive(false);
    setActiveStream(null);
    setFaceDetected(false);
    setConfidence(0);
    consecutiveRef.current = 0;
    setSecondsTowardMinute(0);
    isInitializingRef.current = false;
  }, []);

  const runDetectionCycle = useCallback(async () => {
    const video = persistentVideoRef.current;
    const faceModel = faceModelRef.current;

    if (!active || !video || !faceModel) return;

    const detectionInterval = 
      preferences.aiDetectionRate === "power-save" ? 3000 : 
      preferences.aiDetectionRate === "ultra-low" ? 5000 : 1000;

    if (video.readyState < 2 || video.paused) {
      tickRef.current = setTimeout(runDetectionCycle, 500);
      return;
    }

    try {
      const faces = await faceModel.estimateFaces(video, false);
      const bestFace = faces.length > 0 ? Math.max(...faces.map(p => {
        const prob = p.probability;
        return typeof prob === "number" ? prob : (Array.isArray(prob) ? prob[0] ?? 0 : 0);
      })) : 0;
      
      setConfidence(bestFace);
      const hasFace = bestFace >= FACE_THRESHOLD;
      setFaceDetected(hasFace);

      if (hasFace) {
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
      }
    } catch (err) {
      console.error("Detection error cycle:", err);
    } finally {
      if (active) {
        tickRef.current = setTimeout(runDetectionCycle, detectionInterval);
      }
    }
  }, [active, preferences.aiDetectionRate, addStudyMinute, triggerMinuteReward]);

  const startCamera = useCallback(async () => {
    if (active || isInitializingRef.current) return;
    
    isInitializingRef.current = true;
    setError("");
    setLoading(true);

    try {
      await new Promise(r => setTimeout(r, 50));
      
      if (!faceModelRef.current) {
        faceModelRef.current = await blazeface.load();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      
      if (!isInitializingRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      streamRef.current = stream;
      setActiveStream(stream);
      
      if (persistentVideoRef.current) {
        persistentVideoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          persistentVideoRef.current.onloadedmetadata = () => {
            persistentVideoRef.current.play().catch(console.error);
            resolve();
          };
        });
      }

      setActive(true);
      setLoading(false);
      setNavigationPersistence('pending');
      isInitializingRef.current = false;
    } catch (e) {
      console.error("AI Context Init Failure:", e);
      setError(e.message || "Hardware access denied.");
      stopCamera();
      setLoading(false);
      isInitializingRef.current = false;
    }
  }, [active, stopCamera]);

  useEffect(() => {
    if (active) {
      runDetectionCycle();
    }
    return () => {
      if (tickRef.current) clearTimeout(tickRef.current);
    };
  }, [active, runDetectionCycle]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const value = {
    videoRef: persistentVideoRef,
    stream: activeStream,
    active,
    loading,
    error,
    faceDetected,
    confidence,
    secondsTowardMinute,
    minuteBurst,
    navigationPersistence,
    progressPercent: (secondsTowardMinute / SECONDS_PER_MINUTE) * 100,
    startCamera,
    stopCamera,
    setPersistence: setNavigationPersistence,
  };

  return (
    <FaceStudyContext.Provider value={value}>
      <video ref={persistentVideoRef} className="hidden" playsInline muted />
      {children}
    </FaceStudyContext.Provider>
  );
}
