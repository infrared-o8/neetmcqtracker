import { useEffect, useState, useRef } from "react";
import { useTrackerStore } from "../store/useTrackerStore";

export function ThemeBackground({ cozyPreset = "default" }) {
  const [isTwilight, setIsTwilight] = useState(false);
  const rainContainerRef = useRef(null);
  const preferences = useTrackerStore((s) => s.preferences);
  const { uiOptimized, reduceGpuUsage } = preferences;

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsTwilight(hour >= 20 || hour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ((isTwilight || cozyPreset === "monsoon") && rainContainerRef.current && !uiOptimized) {
      // Create rain drops with simplified interaction
      const container = rainContainerRef.current;
      const dropCount = reduceGpuUsage ? 20 : 80;

      const drops = [];
      for (let i = 0; i < dropCount; i++) {
        const drop = document.createElement("div");
        drop.className = "rain-drop";
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDuration = `${0.8 + Math.random() * 1.2}s`;
        drop.style.animationDelay = `${Math.random() * 3}s`;
        container.appendChild(drop);
        drops.push(drop);
      }

      // Simple interaction: fade drops when they reach middle of screen (where cards are)
      // Only run this if GPU usage isn't a concern
      const handleScroll = () => {
        if (reduceGpuUsage) return;
        const scrollY = window.scrollY;
        drops.forEach((drop) => {
          const rect = drop.getBoundingClientRect();
          if (rect.top > window.innerHeight * 0.3 && rect.top < window.innerHeight * 0.7) {
            drop.style.opacity = "0.3";
          } else {
            drop.style.opacity = "1";
          }
        });
      };

      if (!reduceGpuUsage) {
        window.addEventListener("scroll", handleScroll);
        handleScroll();
      }

      return () => {
        window.removeEventListener("scroll", handleScroll);
        container.innerHTML = "";
      };
    }
  }, [isTwilight, cozyPreset, uiOptimized, reduceGpuUsage]);

  const getThemeClass = () => {
    if (cozyPreset === "library") return "library-bg";
    if (cozyPreset === "monsoon") return "twilight-bg";
    if (isTwilight) return "twilight-bg";
    return "";
  };

  return (
    <>
      <div className={`mesh-bg pointer-events-none fixed inset-0 -z-10 ${getThemeClass()} ${uiOptimized ? 'bg-zinc-950' : ''}`} />
      {(isTwilight || cozyPreset === "monsoon") && !uiOptimized && (
        <div ref={rainContainerRef} className="twilight-rain" />
      )}
    </>
  );
}
