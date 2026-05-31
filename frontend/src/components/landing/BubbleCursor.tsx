import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type Bubble = { id: number; x: number; y: number; size: number; hue: number };

let counter = 0;

export function BubbleCursor() {
    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const lastSpawn = useRef(0);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        function onMove(e: PointerEvent) {
            const now = performance.now();
            const prev = lastPos.current;
            lastPos.current = { x: e.clientX, y: e.clientY };

            let speed = 0;
            if (prev) {
                const dx = e.clientX - prev.x;
                const dy = e.clientY - prev.y;
                speed = Math.sqrt(dx * dx + dy * dy);
            }
            // only spawn when moving with intent (flicks), throttled
            if (speed < 8) return;
            if (now - lastSpawn.current < 22) return;
            lastSpawn.current = now;

            const count = Math.min(4, Math.floor(speed / 14));
            const next: Bubble[] = [];
            for (let i = 0; i < count; i++) {
                next.push({
                    id: ++counter,
                    x: e.clientX + (Math.random() - 0.5) * 24,
                    y: e.clientY + (Math.random() - 0.5) * 24,
                    size: 10 + Math.random() * 26,
                    hue: 280 + Math.random() * 40,
                });
            }
            setBubbles((b) => [...b.slice(-40), ...next]);
        }

        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
    }, []);

    // Clean up old bubbles
    useEffect(() => {
        const t = setInterval(() => {
            setBubbles((b) => b.slice(-30));
        }, 800);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            <AnimatePresence>
                {bubbles.map((b) => (
                    <motion.span
                        key={b.id}
                        initial={{ opacity: 0.9, scale: 0.3, x: b.x, y: b.y }}
                        animate={{
                            opacity: 0,
                            scale: 1.4,
                            x: b.x + (Math.random() - 0.5) * 80,
                            y: b.y - 60 - Math.random() * 80,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2 + Math.random() * 0.6, ease: "easeOut" }}
                        onAnimationComplete={() =>
                            setBubbles((arr) => arr.filter((x) => x.id !== b.id))
                        }
                        style={{
                            width: b.size,
                            height: b.size,
                            position: "absolute",
                            left: -b.size / 2,
                            top: -b.size / 2,
                            borderRadius: "9999px",
                            background: `radial-gradient(circle at 30% 30%, oklch(0.98 0.02 ${b.hue} / 0.9), oklch(0.7 0.18 ${b.hue} / 0.35) 55%, oklch(0.55 0.22 ${b.hue} / 0.1))`,
                            boxShadow: `0 4px 14px oklch(0.62 0.21 ${b.hue} / 0.35), inset 0 0 10px oklch(1 0 0 / 0.4)`,
                            border: "1px solid oklch(1 0 0 / 0.4)",
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
