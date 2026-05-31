import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

const ACCENTS = [
    { size: 90, top: "12%", left: "8%", delay: 0 },
    { size: 60, top: "70%", left: "18%", delay: 1.2 },
    { size: 110, top: "30%", left: "82%", delay: 0.6 },
];

export function CTA() {
    return (
        <section id="cta" className="relative overflow-hidden py-28">
            <div className="mx-auto max-w-5xl px-6">
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-primary p-12 text-center shadow-glow sm:p-20">
                    {/* Just a few graceful accent bubbles */}
                    {ACCENTS.map((b, i) => (
                        <motion.span
                            key={i}
                            className="pointer-events-none absolute rounded-full"
                            style={{
                                width: b.size,
                                height: b.size,
                                top: b.top,
                                left: b.left,
                                background:
                                    "radial-gradient(circle at 30% 30%, oklch(1 0 0 / 0.85), oklch(1 0 0 / 0.25) 60%, oklch(1 0 0 / 0.05))",
                                border: "1px solid oklch(1 0 0 / 0.4)",
                            }}
                            animate={{ y: [0, -18, 0], scale: [1, 1.06, 1] }}
                            transition={{
                                duration: 7 + i,
                                delay: b.delay,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    ))}

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative font-display text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl"
                    >
                        Bring your team into the bubble.
                    </motion.h2>
                    <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/90">
                        Get your whole organization on Bubblespace in minutes. Free for the
                        first 30 days — no card required.
                    </p>
                    <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                        <Link
                            to="/login"
                            className="group inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 font-medium text-foreground shadow-bubble transition-transform hover:scale-[1.03]"
                        >
                            Create your workspace
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <a
                            href="mailto:sales@bubblespace.com"
                            className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/40 px-6 py-3 font-medium text-primary-foreground hover:bg-primary-foreground/10"
                        >
                            Talk to sales
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
