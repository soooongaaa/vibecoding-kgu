"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import styles from "./ZodiacSlot.module.css";

const SYMBOLS = ["🐭", "🐮", "🐯", "🐰", "🐲", "🐍", "🐴", "🐑", "🐵", "🐔", "🐶", "🐷"];
const WIN_CHANCE = 0.1;
const REEL_STOP_DELAYS = [900, 1300, 1700]; // ms, staggered so reels stop one by one
const FLICKER_INTERVAL = 70; // ms
const PULL_DURATION = 260; // ms, how long the handle stays down before springing back
const FIREWORK_COLORS = ["#e6484f", "#f4c542", "#f2a6c1", "#8ecae6", "#a3d9a5", "#c9a3e0"];

type ReelStatus = "idle" | "spinning" | "landed";
type Reel = { symbol: string; status: ReelStatus };
type Outcome = { isWin: boolean; symbols: string[] };

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  color: string;
  size: number;
};

function randomSymbol(): string {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function decideOutcome(): Outcome {
  const isWin = Math.random() < WIN_CHANCE;
  if (isWin) {
    const symbol = randomSymbol();
    return { isWin: true, symbols: [symbol, symbol, symbol] };
  }
  let symbols: string[];
  do {
    symbols = [randomSymbol(), randomSymbol(), randomSymbol()];
  } while (symbols[0] === symbols[1] && symbols[1] === symbols[2]);
  return { isWin: false, symbols };
}

export default function ZodiacSlot() {
  const [reels, setReels] = useState<Reel[]>([
    { symbol: "🐭", status: "idle" },
    { symbol: "🐮", status: "idle" },
    { symbol: "🐯", status: "idle" },
  ]);
  const [pulled, setPulled] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<"win" | "lose" | null>(null);

  const flickerHandles = useRef<ReturnType<typeof setInterval>[]>([]);
  const timeoutHandles = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafHandleRef = useRef<number | null>(null);

  const clearAllTimers = useCallback(() => {
    flickerHandles.current.forEach(clearInterval);
    timeoutHandles.current.forEach(clearTimeout);
    flickerHandles.current = [];
    timeoutHandles.current = [];
  }, []);

  useEffect(() => clearAllTimers, [clearAllTimers]);

  // ---- canvas sizing for the firework layer ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      if (rafHandleRef.current !== null) cancelAnimationFrame(rafHandleRef.current);
    };
  }, []);

  // ---- sound effects (synthesized, no audio files needed) ----
  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new Ctor();
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback(
    (opts: { freq: number; freqEnd?: number; duration: number; type?: OscillatorType; volume?: number }) => {
      const { freq, freqEnd, duration, type = "sine", volume = 0.15 } = opts;
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    },
    [getAudioCtx],
  );

  const playPullSound = useCallback(() => {
    playTone({ freq: 180, freqEnd: 90, duration: 0.12, type: "square", volume: 0.18 });
    setTimeout(() => playTone({ freq: 900, duration: 0.05, type: "square", volume: 0.1 }), 90);
  }, [playTone]);
  const playTickSound = useCallback(() => {
    playTone({ freq: 640, duration: 0.045, type: "square", volume: 0.05 });
  }, [playTone]);
  const playLandSound = useCallback(() => {
    playTone({ freq: 320, freqEnd: 170, duration: 0.09, type: "triangle", volume: 0.16 });
  }, [playTone]);
  const playWinSound = useCallback(() => {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      setTimeout(() => playTone({ freq, duration: 0.18, type: "sine", volume: 0.15 }), i * 90);
    });
  }, [playTone]);
  const playLoseSound = useCallback(() => {
    playTone({ freq: 330, freqEnd: 220, duration: 0.3, type: "sine", volume: 0.1 });
  }, [playTone]);

  // ---- firework/confetti burst effect (canvas, no libraries) ----
  const spawnBurst = useCallback((x: number, y: number) => {
    const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.25;
      const speed = 2.5 + Math.random() * 3;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.012 + Math.random() * 0.012,
        color,
        size: 2 + Math.random() * 2.2,
      });
    }
  }, []);

  const stepFx = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particlesRef.current.forEach((p) => {
      p.vy += 0.05;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
    });
    particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
    particlesRef.current.forEach((p) => {
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    rafHandleRef.current = particlesRef.current.length > 0 ? requestAnimationFrame(stepFx) : null;
  }, []);

  const celebrate = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const bursts = [
      { x: w * 0.25, y: h * 0.3, delay: 0 },
      { x: w * 0.75, y: h * 0.25, delay: 220 },
      { x: w * 0.5, y: h * 0.42, delay: 440 },
      { x: w * 0.35, y: h * 0.2, delay: 700 },
      { x: w * 0.65, y: h * 0.35, delay: 920 },
    ];
    bursts.forEach(({ x, y, delay }) => {
      const handle = setTimeout(() => {
        spawnBurst(x, y);
        if (rafHandleRef.current === null) rafHandleRef.current = requestAnimationFrame(stepFx);
      }, delay);
      timeoutHandles.current.push(handle);
    });
  }, [spawnBurst, stepFx]);

  function pullLever() {
    if (spinning) return;
    setSpinning(true);
    setPulled(true);
    timeoutHandles.current.push(setTimeout(() => setPulled(false), PULL_DURATION));
    playPullSound();
    setResult(null);

    const outcome = decideOutcome();
    setReels((prev) => prev.map((r) => ({ ...r, status: "spinning" })));

    flickerHandles.current = [0, 1, 2].map((i) =>
      setInterval(() => {
        setReels((prev) => prev.map((r, idx) => (idx === i ? { ...r, symbol: randomSymbol() } : r)));
      }, FLICKER_INTERVAL),
    );

    const lastStopDelay = REEL_STOP_DELAYS[REEL_STOP_DELAYS.length - 1];
    const tickHandle = setInterval(playTickSound, 110);
    timeoutHandles.current.push(setTimeout(() => clearInterval(tickHandle), lastStopDelay));

    REEL_STOP_DELAYS.forEach((delay, i) => {
      const handle = setTimeout(() => {
        clearInterval(flickerHandles.current[i]);
        setReels((prev) => prev.map((r, idx) => (idx === i ? { symbol: outcome.symbols[i], status: "landed" } : r)));
        playLandSound();
      }, delay);
      timeoutHandles.current.push(handle);
    });

    timeoutHandles.current.push(
      setTimeout(() => {
        setSpinning(false);
        if (outcome.isWin) {
          setResult("win");
          playWinSound();
          celebrate();
        } else {
          setResult("lose");
          playLoseSound();
        }
      }, lastStopDelay + 80),
    );
  }

  function handleKeyDown(event: ReactKeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pullLever();
    }
  }

  return (
    <div className={styles.wrap}>
      <canvas ref={canvasRef} className={styles.fxCanvas} aria-hidden="true" />

      <div className={styles.page}>
        <h1 className={styles.title}>두근두근 띠뽑기</h1>

        <div className={styles.machineFigure}>
          <div className={styles.hopper}>
            <div className={styles.hopperPlate} />
          </div>

          <div className={styles.body}>
            <div className={styles.reelRow}>
              {reels.map((reel, i) => (
                <div
                  key={i}
                  className={`${styles.reelSlot} ${reel.status === "spinning" ? styles.spinning : ""} ${reel.status === "landed" ? styles.landed : ""}`}
                >
                  <span className={`${styles.pip} ${styles.pipTl}`} />
                  <span className={`${styles.pip} ${styles.pipTr}`} />
                  <span className={`${styles.pip} ${styles.pipBl}`} />
                  <span className={`${styles.pip} ${styles.pipBr}`} />
                  <span className={styles.symbol}>{reel.symbol}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.neck}>
            <span />
            <span />
            <span />
          </div>

          <div className={styles.base}>
            <div className={styles.tray}>
              <div className={styles.coins}>
                <span />
                <span />
                <span />
              </div>
              <div className={styles.shelf} />
            </div>
          </div>

          <div className={styles.feet}>
            <span />
            <span />
          </div>

          <div
            className={`${styles.lever} ${pulled ? styles.pulled : ""}`}
            role="button"
            tabIndex={0}
            aria-label="막대를 당겨서 뽑기"
            onClick={pullLever}
            onKeyDown={handleKeyDown}
          >
            <div className={styles.mount} />
            <div className={styles.moving}>
              <div className={styles.knob} />
              <div className={styles.rod} />
            </div>
          </div>
        </div>

        <p className={styles.leverLabel}>↓ 오른쪽 막대를 당겨보세요</p>

        <div className={styles.result} aria-live="polite">
          {result === "win" && (
            <div className={`${styles.winCard} ${styles.enter}`}>
              <span className={`${styles.spark} ${styles.sparkS1}`}>✨</span>
              <span className={`${styles.spark} ${styles.sparkS2}`}>🎉</span>
              <span className={`${styles.spark} ${styles.sparkS3}`}>🎊</span>
              <span className={`${styles.spark} ${styles.sparkS4}`}>✨</span>
              <span className={styles.headline}>🎉 당첨! 세 마리가 같아요 🎉</span>
              <span className={styles.sub}>복이 들어왔어요</span>
            </div>
          )}
          {result === "lose" && (
            <span className={styles.enter}>
              아쉬워요
              <span className={styles.sub}>다시 도전해 보세요</span>
            </span>
          )}
        </div>

        <p className={styles.note}>몇 번이든 다시 당길 수 있어요</p>
      </div>
    </div>
  );
}
