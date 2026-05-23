import { useContext } from "react";
import { FaceStudyContext } from "../context/faceStudyContext";

export function useFaceStudyContext() {
  const ctx = useContext(FaceStudyContext);
  if (!ctx) {
    throw new Error("useFaceStudyContext must be used within FaceStudyProvider");
  }
  return ctx;
}
