// Home hero with animated wave lines on a canvas (bundle `O4`).
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Calendar, MessageCircle } from 'lucide-react';
import { whatsappUrl } from '@/api/config';
import { createPageUrl } from '@/lib/utils';

const EASE = [0.25, 0.46, 0.45, 0.94];
const WAVES = [
  { color: '#E50914', width: 3, speed: 0.3, amplitude: 40, yBase: 0.15 },
  { color: 'rgba(255,255,255,0.2)', width: 1.5, speed: 0.25, amplitude: 30, yBase: 0.28 },
  { color: 'rgba(229,9,20,0.4)', width: 5, speed: 0.35, amplitude: 50, yBase: 0.42 },
  { color: 'rgba(255,149,0,0.5)', width: 6, speed: 0.3, amplitude: 60, yBase: 0.55 },
  { color: '#E50914', width: 2, speed: 0.28, amplitude: 45, yBase: 0.68 },
  { color: 'rgba(255,255,255,0.15)', width: 4, speed: 0.32, amplitude: 55, yBase: 0.78 },
  { color: 'rgba(229,9,20,0.25)', width: 3, speed: 0.22, amplitude: 35, yBase: 0.88 },
];

function useWaveCanvas(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let frame = null;
    let t = 0;
    let inView = true;
    let visible = true; // in view AND tab visible

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      for (const wave of WAVES) {
        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = wave.width;
        ctx.lineCap = 'round';
        for (let x = -50; x <= w + 50; x += 4) {
          const y =
            h * wave.yBase +
            Math.sin(x * 0.005 + t * wave.speed) * wave.amplitude +
            Math.sin(x * 0.002 + t * wave.speed * 0.7) * wave.amplitude * 0.5;
          if (x === -50) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    const loop = () => {
      draw();
      t += 0.018;
      frame = visible && !reduceMotion ? requestAnimationFrame(loop) : null;
    };

    const onResize = () => {
      resize();
      if (!frame) draw();
    };

    // Animate only while the hero is in view and the tab is visible (saves CPU/battery).
    const update = () => {
      visible = inView && document.visibilityState !== 'hidden';
      if (visible && !frame && !reduceMotion) frame = requestAnimationFrame(loop);
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = null;
      }
    };
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });

    resize();
    loop(); // with reduced motion this draws a single static frame
    io.observe(canvas);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', update);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      io.disconnect();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', update);
    };
  }, [canvasRef]);
}

export default function HomeHero() {
  const canvasRef = useRef(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 80]);
  useWaveCanvas(canvasRef);

  return (
    <section className="relative h-screen min-h-[700px] flex items-center justify-center bg-black overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.6 }} aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 to-black/80 pointer-events-none" />
      <motion.div style={{ y }} className="relative z-10 max-w-5xl mx-auto px-5 sm:px-6 text-center text-white">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE }}>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-[#E50914] mb-6"
          >
            Masso Lab · Simone Ciacchi
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: EASE }}
            className="text-5xl sm:text-7xl md:text-[6rem] lg:text-[7.5rem] font-black leading-[0.9] mb-6"
            style={{ letterSpacing: '-0.045em', fontFamily: 'Inter, -apple-system, sans-serif' }}
          >
            Il massaggio
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E50914] via-orange-400 to-[#E50914]">
              che cambia tutto.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-lg sm:text-xl md:text-2xl text-white/60 mb-10 max-w-2xl mx-auto font-light"
            style={{ letterSpacing: '-0.01em' }}
          >
            Precisione tecnica. Risultati reali. Direttamente a casa tua.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            <Link
              to={createPageUrl('GuestBooking')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#E50914] hover:bg-[#cc0812] text-white rounded-full px-9 py-4 text-base font-bold shadow-2xl shadow-red-900/60 transition-all duration-300 hover:scale-[1.04] active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              Prenota ora
            </Link>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/[0.08] hover:bg-white/15 border border-white/20 text-white rounded-full px-9 py-4 text-base font-medium backdrop-blur-md transition-all duration-300 hover:scale-[1.04]"
            >
              <MessageCircle className="w-4 h-4 text-green-400" />
              Scrivimi
            </a>
          </motion.div>
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20 pointer-events-none"
      >
        <div className="w-[1px] h-12 bg-gradient-to-b from-white/40 to-transparent" />
        <div className="w-1 h-1 rounded-full bg-white/30" />
      </motion.div>
    </section>
  );
}
