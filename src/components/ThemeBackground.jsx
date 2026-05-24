import { useEffect, useState, useRef } from "react";

export function ThemeBackground({ cozyPreset = "default" }) {
  const [isTwilight, setIsTwilight] = useState(false);
  const rainContainerRef = useRef(null);

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
    if ((isTwilight || cozyPreset === "monsoon") && rainContainerRef.current) {
      // Create rain drops with simplified interaction
      const container = rainContainerRef.current;
      const dropCount = 80;

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
      const handleScroll = () => {
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

      window.addEventListener("scroll", handleScroll);
      handleScroll();

      return () => {
        window.removeEventListener("scroll", handleScroll);
        container.innerHTML = "";
      };
    }
  }, [isTwilight, cozyPreset]);

  const getThemeClass = () => {
    if (cozyPreset === "library") return "library-bg";
    if (cozyPreset === "monsoon") return "twilight-bg";
    if (isTwilight) return "twilight-bg";
    return "";
  };

  return (
    <>
      <div className={`mesh-bg pointer-events-none fixed inset-0 -z-10 ${getThemeClass()}`} />
      {(isTwilight || cozyPreset === "monsoon") && (
        <div ref={rainContainerRef} className="twilight-rain" />
      )}
    </>
  );
}
