import { createContext, useContext } from "react";

export const FaceStudyContext = createContext({
  videoRef: null,
  active: false,
  loading: false,
  error: "",
  faceDetected: false,
  confidence: 0,
  secondsTowardMinute: 0,
  minuteBurst: null,
  progressPercent: 0,
  navigationPersistence: 'pending', // 'pending' | 'keep' | 'stop'
  startCamera: () => {},
  stopCamera: () => {},
  setPersistence: () => {},
});
