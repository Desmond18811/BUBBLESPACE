import { motion } from "motion/react";

const ALL = Array.from({ length: 14 }, (_, i) => ({
    size: 40 + ((i * 37) % 140),
    left: (i * 73) % 100,
    top: (i * 47) % 100,
    delay: (i % 7) * 0.6,
    duration: 8 + (i % 5) * 2,
    hue: 285 + ((i * 9) % 35),
}));

export function FloatingBubbles({ count = 5 }: { count?: number }) {
    const bubbles = ALL.slice(0, count);
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {bubbles.map((b, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                        width: b.size,
                        height: b.size,
                        left: `${b.left}%`,
                        top: `${b.top}%`,
                        background: `radial-gradient(circle at 30% 30%, oklch(1 0 0 / 0.7), oklch(0.7 0.18 ${b.hue} / 0.22) 60%, oklch(0.55 0.22 ${b.hue} / 0.05))`,
                        border: "1px solid oklch(1 0 0 / 0.4)",
                        backdropFilter: "blur(2px)",
                    }}
                    animate={{
                        y: [0, -30, 0],
                        x: [0, 15, 0],
                        scale: [1, 1.08, 1],
                    }}
                    transition={{
                        duration: b.duration,
                        delay: b.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
}
