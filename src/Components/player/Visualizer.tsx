import { useEffect, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useTheme } from '@/context/ThemeContext';

const BAR_COUNT = 48;

export function Visualizer({ className }: { className?: string }) {
  const { getAnalyser, canAnalyze, isPlaying } = usePlayer();
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const style = getComputedStyle(document.documentElement);
    const accent = style.getPropertyValue('--accent').trim() || '#7c5cfc';
    const ember = style.getPropertyValue('--ember').trim() || '#ff9d5c';

    let rafId: number;
    const freqData = new Uint8Array(256);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const drawBars = (heights: number[]) => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);
      const gap = 3;
      const barWidth = (w - gap * (BAR_COUNT - 1)) / BAR_COUNT;
      const gradient = ctx.createLinearGradient(0, h, 0, 0);
      gradient.addColorStop(0, accent);
      gradient.addColorStop(1, ember);
      ctx.fillStyle = gradient;
      heights.forEach((value, i) => {
        const barHeight = Math.max(3, value * h);
        const x = i * (barWidth + gap);
        const radius = Math.min(barWidth / 2, 3);
        ctx.beginPath();
        ctx.roundRect(x, h - barHeight, barWidth, barHeight, radius);
        ctx.fill();
      });
    };

    const renderReal = () => {
      const analyser = getAnalyser();
      if (!analyser) return false;
      analyser.getByteFrequencyData(freqData);
      const usableBins = Math.floor(freqData.length * 0.75); // upper bins are mostly silent for music
      const binsPerBar = Math.max(1, Math.floor(usableBins / BAR_COUNT));
      const heights: number[] = [];
      for (let i = 0; i < BAR_COUNT; i++) {
        let sum = 0;
        for (let j = 0; j < binsPerBar; j++) sum += freqData[i * binsPerBar + j] ?? 0;
        heights.push(Math.min(1, sum / binsPerBar / 255));
      }
      drawBars(heights);
      return true;
    };

    const renderAmbient = () => {
      phaseRef.current += isPlaying && !prefersReducedMotion ? 0.045 : 0;
      const heights: number[] = [];
      for (let i = 0; i < BAR_COUNT; i++) {
        const wave =
          Math.sin(phaseRef.current + i * 0.35) * 0.5 + Math.sin(phaseRef.current * 1.7 + i * 0.2) * 0.3 + 0.5;
        heights.push(isPlaying ? Math.max(0.06, wave * 0.7) : 0.06);
      }
      drawBars(heights);
    };

    const loop = () => {
      if (canAnalyze) {
        const ok = renderReal();
        if (!ok) renderAmbient();
      } else {
        renderAmbient();
      }
      rafId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [canAnalyze, isPlaying, getAnalyser, theme]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
