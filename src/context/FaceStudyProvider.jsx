import { useCallback, useEffect, useRef, useState } from "react";
import * as blazeface from "@tensorflow-models/blazeface";
import "@tensorflow/tfjs";
import { FaceStudyContext } from "./faceStudyContext";
import { useTrackerStore } from "../store/useTrackerStore";

const CONFIDENCE_THRESHOLD = 0.6;
const TICK_MS = 1000;
const SECONDS_PER_MINUTE = 60;

export function FaceStudyProvider({ children }) {
  const addStudyMinute = useTrackerStore((s) => s.addStudyMinute);

  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [secondsTowardMinute, setSecondsTowardMinute] = useState(0);
  const [minuteBurst, setMinuteBurst] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const modelRef = useRef(null);
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
    setConfidence(0);
    consecutiveRef.current = 0;
    setSecondsTowardMinute(0);
  }, []);

  const startCamera = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      if (!modelRef.current) modelRef.current = await blazeface.load();
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

      tickRef.current = setInterval(async () => {
        const video = videoRef.current;
        const model = modelRef.current;
        if (!video || !model || video.readyState < 2) return;
        try {
          const predictions = await model.estimateFaces(video, false);
          const best =
            predictions.length > 0
              ? Math.max(
                  ...predictions.map((p) => {
                    const prob = p.probability;
                    if (typeof prob === "number") return prob;
                    if (Array.isArray(prob)) return prob[0] ?? 0;
                    return 0;
                  }),
                )
              : 0;
          setConfidence(best);
          const present = best >= CONFIDENCE_THRESHOLD;
          setFaceDetected(present);
          if (present) {
            consecutiveRef.current += 1;
            setSecondsTowardMinute(consecutiveRef.current);
            if (consecutiveRef.current >= SECONDS_PER_MINUTE) {
              addStudyMinute();
              useTrackerStore.setState((s) => ({ xp: s.xp + 1 }));
              triggerMinuteReward();
              consecutiveRef.current = 0;
              setSecondsTowardMinute(0);
            }
          } else {
            consecutiveRef.current = 0;
            setSecondsTowardMinute(0);
          }
        } catch {
          /* skip frame */
        }
      }, TICK_MS);
    } catch (e) {
      setError(e.message || "Camera access denied or unavailable.");
      stopCamera();
    } finally {
      setLoading(false);
    }
  }, [addStudyMinute, stopCamera, triggerMinuteReward]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const value = {
    videoRef,
    active,
    loading,
    error,
    faceDetected,
    confidence,
    secondsTowardMinute,
    minuteBurst,
    progressPercent: (secondsTowardMinute / SECONDS_PER_MINUTE) * 100,
    startCamera,
    stopCamera,
  };

  return <FaceStudyContext.Provider value={value}>{children}</FaceStudyContext.Provider>;
}
