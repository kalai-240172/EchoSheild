import React, { useEffect, useRef } from 'react';

interface WaveformProps {
  active: boolean;
  color?: string;
  height?: number;
}

export default function LiveWaveform({ active, color = '#3b82f6', height = 60 }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (!active) {
        // Flat line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(99,179,237,0.2)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        return;
      }

      phaseRef.current += 0.05;
      const p = phaseRef.current;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;

      for (let x = 0; x <= w; x++) {
        const t = x / w;
        const y = h / 2 +
          Math.sin(t * 20 + p) * 12 +
          Math.sin(t * 8 + p * 0.7) * 8 +
          Math.sin(t * 35 + p * 1.3) * 5;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [active, color]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={height}
      className="w-full rounded"
      style={{ background: 'rgba(8,12,28,0.6)' }}
    />
  );
}
