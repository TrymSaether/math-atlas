import { useEffect, useRef } from "react";

/**
 * Cinematic animated background:
 * - radial gradient depth field
 * - parallax dot-grid
 * - drifting glowing rings
 * - particle starfield
 */
export function Background() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cnv = ref.current!;
    const ctx = cnv.getContext("2d")!;
    let raf = 0;
    let w = 0, h = 0;
    type P = { x: number; y: number; z: number; r: number };
    let particles: P[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = cnv.clientWidth; h = cnv.clientHeight;
      cnv.width = w * dpr; cnv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: 140 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 0.8 + 0.2,
        r: Math.random() * 1.4 + 0.3,
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    const draw = () => {
      if (document.hidden) {
        raf = requestAnimationFrame(draw);
        return;
      }
      t += 0.0035;
      ctx.clearRect(0, 0, w, h);

      // depth gradient
      const g = ctx.createRadialGradient(w * 0.6, h * 0.35, 60, w * 0.6, h * 0.35, Math.max(w, h));
      g.addColorStop(0, "rgba(60,90,180,0.18)");
      g.addColorStop(0.4, "rgba(20,28,70,0.10)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // rings
      for (let i = 0; i < 4; i++) {
        const cx = w * 0.5 + Math.cos(t * 0.6 + i) * 60;
        const cy = h * 0.5 + Math.sin(t * 0.5 + i * 1.3) * 40;
        const radius = 220 + i * 110 + Math.sin(t + i) * 18;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(120,160,255,${0.06 - i * 0.012})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // particles
      for (const p of particles) {
        p.x += Math.cos(t + p.z * 4) * 0.15 * p.z;
        p.y += 0.06 * p.z;
        if (p.y > h + 4) { p.y = -4; p.x = Math.random() * w; }
        if (p.x > w + 4) p.x = -4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,220,255,${0.18 + p.z * 0.5})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.4] dark:opacity-100"
        style={{
          backgroundImage:
            "radial-gradient(rgba(120,140,255,0.18) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)",
        }}
      />
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.55)_100%)] dark:block hidden" />
    </div>
  );
}
