import React, { useEffect, useRef } from 'react';

/**
 * Volumetric Aura Engine (Sol's RNG Style)
 * Principal Graphics Architecture with Pseudo-3D Projection, Z-Sorting, 
 * and Additive Luminance Rendering.
 */

const MAX_PARTICLES = 250;
const FOCAL_LENGTH = 300;

export function ParticleEngine({ effect = 'NONE', highIntensity = false }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (effect === 'NONE' || !effect) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = [];
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    let width, height, cx, cy;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      cx = width / 2;
      cy = height / 2;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', resize);
    resize();

    // --- RENDER UTILITIES ---

    const drawGlowPoint = (ctx, x, y, size, color, alpha) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, size);
      const intensity = highIntensity ? 1.0 : 0.6;
      g.addColorStop(0, `rgba(255, 255, 255, ${alpha * intensity})`);
      g.addColorStop(0.2, `${color}${Math.floor(alpha * 255 * 0.8).toString(16).padStart(2, '0')}`);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    };

    const drawClockDial = (ctx, time, scale, color) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.rotate(time * 0.0005);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;

      // Outer Ring
      ctx.beginPath(); ctx.arc(0, 0, 150, 0, Math.PI * 2); ctx.stroke();
      
      // Markers
      for (let i = 0; i < 12; i++) {
        ctx.rotate(Math.PI / 6);
        ctx.beginPath(); ctx.moveTo(130, 0); ctx.lineTo(150, 0); ctx.stroke();
      }

      // Snapping hands (Step snap)
      ctx.restore();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      const snapAngle = Math.floor(time / 1000) * (Math.PI / 6);
      ctx.rotate(snapAngle);
      ctx.shadowBlur = 15; ctx.shadowColor = color;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(100, 0); ctx.stroke();
      ctx.restore();
    };

    // --- PRESET LOGIC ---

    const presets = {
      'kota overclock': {
        init: () => {
          if (particlesRef.current.length < MAX_PARTICLES && Math.random() < 0.2) {
            // Golden math equations / embers
            particlesRef.current.push({
              type: 'math',
              x: (Math.random() - 0.5) * 400,
              y: 200,
              z: Math.random() * 400 - 200,
              vx: (Math.random() - 0.5) * 2,
              vy: -(Math.random() * 3 + 1),
              text: ['∑', 'π', 'Ω', 'Δ', '∫'][Math.floor(Math.random() * 5)],
              life: 100, maxLife: 100, color: '#f59e0b'
            });
          }
        },
        render: (ctx, time) => {
          drawClockDial(ctx, time, 1.2, '#f59e0b');
          // Add lightning vectors occasionally
          if (Math.random() < 0.05) {
            ctx.beginPath();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.moveTo(cx + (Math.random()-0.5)*500, cy + (Math.random()-0.5)*500);
            for(let i=0; i<5; i++) ctx.lineTo(cx + (Math.random()-0.5)*500, cy + (Math.random()-0.5)*500);
            ctx.stroke();
          }
        }
      },

      'entropy singularity': {
        init: () => {
          // Cyan/Violet tendrils oozing inward
          if (particlesRef.current.length < MAX_PARTICLES) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 400 + Math.random() * 200;
            particlesRef.current.push({
              type: 'tendril',
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              z: Math.random() * 200 - 100,
              target: { x: 0, y: 0 },
              life: 150, maxLife: 150,
              color: Math.random() > 0.5 ? '#00FFCC' : '#a855f7'
            });
          }
        },
        render: (ctx, time) => {
          // Central Void
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
          g.addColorStop(0, '#000000');
          g.addColorStop(0.8, '#1a1a1a');
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(cx, cy, 100, 0, Math.PI*2); ctx.fill();

          // Volumetric Plasma Rings
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#FFFFFF';
          for(let i=0; i<2; i++) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(time * 0.001 * (i === 0 ? 1 : -1));
            ctx.beginPath();
            ctx.ellipse(0, 0, 120, 40, time * 0.0005, 0, Math.PI*2);
            ctx.stroke();
            ctx.restore();
          }
        }
      },

      'neural overdrive': {
        init: () => {
          // Vertical jets of neon fire
          if (particlesRef.current.length < MAX_PARTICLES && Math.random() < 0.4) {
            particlesRef.current.push({
              type: 'jet',
              x: (Math.random() - 0.5) * 500,
              y: 300,
              z: Math.random() * 200 - 100,
              vx: (Math.random() - 0.5) * 2,
              vy: -(Math.random() * 15 + 5),
              life: 40, maxLife: 40,
              color: ['#ff007f', '#00ffcc', '#ffff00'][Math.floor(Math.random() * 3)]
            });
          }
        },
        render: (ctx, time) => {
          // Chromatic Aberration simulation via subtle offsets (handled in draw loop)
        }
      }
    };

    const effectKey = effect.toLowerCase();
    let currentPreset = presets[effectKey] || null;

    // Fallback mapping for the 50 frames
    if (!currentPreset) {
      if (effectKey.includes('singularity') || effectKey.includes('void') || effectKey.includes('entropy')) currentPreset = presets['entropy singularity'];
      else if (effectKey.includes('overclock') || effectKey.includes('chrono') || effectKey.includes('lock')) currentPreset = presets['kota overclock'];
      else if (effectKey.includes('apex') || effectKey.includes('overdrive') || effectKey.includes('chroma')) currentPreset = presets['neural overdrive'];
    }

    const render = (timestamp) => {
      const dt = timestamp - timeRef.current;
      timeRef.current = timestamp;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      if (currentPreset) {
        currentPreset.init();
        currentPreset.render(ctx, timestamp);
      }

      // --- VOLUMETRIC PARTICLE PIPELINE ---

      // Sort by Z for depth projection
      particlesRef.current.sort((a, b) => b.z - a.z);

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        
        // Update Physics
        if (p.type === 'math') {
          p.x += p.vx; p.y += p.vy; p.z += Math.sin(timestamp * 0.01) * 2;
        } else if (p.type === 'tendril') {
          const dx = p.target.x - p.x; const dy = p.target.y - p.y;
          p.x += dx * 0.05; p.y += dy * 0.05;
          if (Math.abs(dx) < 5 && Math.abs(dy) < 5) p.life = 0;
        } else if (p.type === 'jet') {
          p.x += p.vx; p.y += p.vy; p.vy *= 0.95;
        } else {
          // Generic physics
          p.x += p.vx || 0; p.y += p.vy || 0; p.z += p.vz || 0;
        }

        p.life--;
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        // Project 3D to 2D
        const scale = FOCAL_LENGTH / (FOCAL_LENGTH + p.z);
        const xProj = cx + p.x * scale;
        const yProj = cy + p.y * scale;
        const alpha = (p.life / p.maxLife) * Math.min(1, scale * 2);

        // Draw based on type
        if (p.type === 'math') {
          ctx.font = `${Math.floor(20 * scale)}px monospace`;
          ctx.fillStyle = p.color; ctx.globalAlpha = alpha;
          ctx.fillText(p.text, xProj, yProj);
        } else if (p.type === 'tendril' || p.type === 'jet') {
          drawGlowPoint(ctx, xProj, yProj, (p.type === 'jet' ? 15 : 8) * scale, p.color, alpha);
        } else {
          drawGlowPoint(ctx, xProj, yProj, 5 * scale, p.color || '#FFFFFF', alpha);
        }
      }

      ctx.globalCompositeOperation = 'source-over';
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      particlesRef.current = [];
    };
  }, [effect, highIntensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 h-full w-full transition-opacity duration-1000 ${highIntensity ? 'z-[251] opacity-90' : 'z-[-1] opacity-40'}`}
    />
  );
}
