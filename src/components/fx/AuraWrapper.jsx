import React, { useEffect, useRef, useMemo } from 'react';
import { useTrackerStore } from '../../store/useTrackerStore';
import { FX_PRESETS } from '../../data/fxPresets';

/**
 * AuraWrapper: Intelligent Border Tracking Engine
 * Wraps any element and renders high-fidelity canvas FX around its boundaries.
 */
export function AuraWrapper({ 
  presetId = "NONE", 
  children, 
  className = "", 
  allowEscape = false // If true, particles can bleed outside top boundary
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);
  const observerRef = useRef(null);
  const dimensionsRef = useRef({ width: 0, height: 0, top: 0, left: 0, radius: 24 });
  
  // Momentum State for Reactivity
  const momentumRef = useRef(1);
  const pulseRef = useRef(0); // 0 to 1 for brightness pulse
  
  const preferences = useTrackerStore((s) => s.preferences);
  const { uiOptimized, reduceGpuUsage } = preferences;

  // Ensure presetId has a fallback for existing profiles
  const effectivePresetId = presetId || "NONE";
  const preset = useMemo(() => FX_PRESETS[effectivePresetId] || null, [effectivePresetId]);

  useEffect(() => {
    const handleActivity = (e) => {
      const { momentum } = e.detail;
      // Multiplier: 1.2x per combo level, capped at 5x original
      momentumRef.current = Math.min(5, 1 + (momentum >= 2 ? (momentum - 1) * 0.2 : 0));
      pulseRef.current = 1.0; // Trigger full brightness pulse
    };

    window.addEventListener("neet:activity", handleActivity);
    return () => window.removeEventListener("neet:activity", handleActivity);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || !preset || uiOptimized) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    
    // --- LAYOUT DETECTION ---
    const updateDimensions = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const style = window.getComputedStyle(containerRef.current);
      const radius = parseInt(style.borderRadius) || 0;
      
      const d = {
        width: rect.width,
        height: rect.height,
        radius: radius,
        padding: 60 // Increased buffer for glow/escape
      };
      
      dimensionsRef.current = d;
      canvas.width = d.width + d.padding * 2;
      canvas.height = d.height + d.padding * 2;
      
      // Re-init particles on resize
      initParticles(preset, d);
    };

    observerRef.current = new ResizeObserver(updateDimensions);
    observerRef.current.observe(containerRef.current);
    updateDimensions();

    // --- PARTICLE LOGIC ---
    function initParticles(p, d) {
      // Base count scaled by momentum
      const baseCount = reduceGpuUsage ? Math.floor(p.particleCount / 2) : p.particleCount;
      const count = Math.floor(baseCount * momentumRef.current);
      const particles = [];
      
      for (let i = 0; i < count; i++) {
        particles.push(createParticle(p, d));
      }
      particlesRef.current = particles;
    }

    function createParticle(p, d) {
      const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
      let x, y;
      
      if (side === 0) { x = Math.random() * d.width; y = 0; }
      else if (side === 1) { x = d.width; y = Math.random() * d.height; }
      else if (side === 2) { x = Math.random() * d.width; y = d.height; }
      else { x = 0; y = Math.random() * d.height; }

      return {
        x, y,
        originX: x, originY: y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 2 + 1,
        color: p.colors[Math.floor(Math.random() * p.colors.length)],
        life: Math.random(),
        decay: 0.005 + Math.random() * 0.01,
        angle: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 2,
        offset: Math.random() * 100
      };
    }

    // --- RENDER LOOP ---
    const render = (time) => {
      const d = dimensionsRef.current;
      const p = preset;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Global Composite: Additive blending for high-impact luminance
      ctx.globalCompositeOperation = 'screen';
      
      const pad = d.padding;
      
      // Gradually decay pulse
      pulseRef.current = Math.max(0, pulseRef.current - 0.02);
      
      // Dynamic scaling based on activity
      const brightnessBoost = 1 + pulseRef.current * 1.5;
      const momentum = momentumRef.current;

      // Adjust particle count if momentum changed significantly
      if (Math.abs(particlesRef.current.length - (p.particleCount * momentum)) > 10) {
        initParticles(p, d);
      }

      const particles = particlesRef.current;

      particles.forEach((part, i) => {
        // Core Animation Logic based on preset style
        updateParticle(part, p, d, time);
        
        // Draw
        ctx.beginPath();
        ctx.fillStyle = part.color;
        
        // Dynamic opacity tied to life, pulse, and momentum
        const alpha = part.life * 0.8 * brightnessBoost;
        ctx.globalAlpha = Math.min(1, alpha);
        
        // Shadow/Glow effect if not on ultra-low performance
        if (!reduceGpuUsage) {
          ctx.shadowBlur = 10 * brightnessBoost; 
          ctx.shadowColor = part.color;
        }
        
        const size = part.size * (1 + pulseRef.current * 0.5);
        ctx.arc(part.x + pad, part.y + pad, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Reset life
        if (part.life <= 0) {
          Object.assign(part, createParticle(p, d));
        }
      });

      animationRef.current = requestAnimationFrame(render);
    };

    function updateParticle(part, p, d, time) {
      part.life -= part.decay;
      
      // Style mapping for safety
      const style = (p.style || "standard").toLowerCase();

      switch (style) {
        case "vortex":
          const centerX = d.width / 2;
          const centerY = d.height / 2;
          const dx = centerX - part.x;
          const dy = centerY - part.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          part.vx += dx / dist * 0.1;
          part.vy += dy / dist * 0.1;
          part.x += part.vx;
          part.y += part.vy;
          break;
          
        case "accelerator":
          part.angle += 0.1;
          const perimeter = (d.width + d.height) * 2;
          const pos = (part.angle * 50 + part.offset) % perimeter;
          
          if (pos < d.width) { part.x = pos; part.y = 0; }
          else if (pos < d.width + d.height) { part.x = d.width; part.y = pos - d.width; }
          else if (pos < d.width * 2 + d.height) { part.x = d.width - (pos - d.width - d.height); part.y = d.height; }
          else { part.x = 0; part.y = d.height - (pos - d.width * 2 - d.height); }
          break;

        case "fire":
          part.y -= part.speed;
          part.x += Math.sin(time / 200 + part.offset) * 0.5;
          if (part.y < -40) part.life = 0; // Better escape limit
          break;

        case "helix":
          part.y += part.speed;
          const sideX = part.originX < d.width / 2 ? 0 : d.width;
          part.x = sideX + Math.sin(part.y / 20 + time / 100) * 10;
          if (part.y > d.height) part.life = 0;
          break;

        default:
          part.x += part.vx;
          part.y += part.vy;
          
          if (!allowEscape || part.y > 0) {
            if (part.x < 0 || part.x > d.width) part.vx *= -1;
            if (part.y < 0 || part.y > d.height) part.vy *= -1;
          }
      }
    }

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [preset, uiOptimized, reduceGpuUsage, allowEscape]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {preset && !uiOptimized && (
        <canvas 
          ref={canvasRef}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[0]"
          style={{ 
            mixBlendMode: 'screen',
            opacity: preset.tier === 'MYTHIC' ? 1 : 0.85, // Increased visibility
            width: 'calc(100% + 120px)',
            height: 'calc(100% + 120px)',
            pointerEvents: 'none'
          }}
        />
      )}
      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
