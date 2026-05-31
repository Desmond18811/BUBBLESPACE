import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { MessageCircle, Sparkles, ArrowRight } from "lucide-react";
import chatPreview from "@/assets/chat-preview.png";
import { FloatingBubbles } from "./FloatingBubbles";

export function Hero() {
    return (
        <section className="relative overflow-hidden bg-gradient-hero pt-32 pb-24">
            <FloatingBubbles count={5} />
            {/* wavy background pattern */}
            <svg
                className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <pattern id="waves" width="120" height="120" patternUnits="userSpaceOnUse">
                        <path
                            d="M0 60 Q 30 30, 60 60 T 120 60"
                            stroke="oklch(0.62 0.21 290 / 0.25)"
                            fill="none"
                            strokeWidth="1"
                        />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#waves)" />
            </svg>

            <div className="relative mx-auto max-w-6xl px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/60 px-4 py-1.5 text-sm text-primary backdrop-blur-md"
                >
                    <Sparkles className="h-3.5 w-3.5" />
                    The new home for team conversations
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.05 }}
                    className="font-display text-balance text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl"
                >
                    Where your team's<br />
                    <span className="bg-gradient-primary bg-clip-text text-transparent">
                        conversations float free.
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.15 }}
                    className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground"
                >
                    Bubblespace is the simple, beautiful way to message everyone in your
                    organization. Channels, DMs, files, voice — all wrapped in a calm,
                    delightful experience your team will actually love.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.25 }}
                    className="mt-10 flex flex-wrap items-center justify-center gap-3"
                >
                    <Link
                        to="/login"
                        className="group inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.03]"
                    >
                        Start for free
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <a
                        href="#how"
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-6 py-3 font-medium text-foreground backdrop-blur transition-colors hover:bg-card"
                    >
                        <MessageCircle className="h-4 w-4" />
                        See it in action
                    </a>
                </motion.div>

                {/* Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 60, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="relative mx-auto mt-16 max-w-5xl"
                >
                    <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-primary opacity-30 blur-3xl" />
                    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-glow">
                        <img
                            src={chatPreview}
                            alt="Bubblespace team chat interface"
                            className="w-full"
                        />
                    </div>

                    {/* floating chat bubble accents */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -left-6 top-10 hidden rounded-2xl rounded-bl-sm bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-bubble md:block"
                    >
                        👋 Welcome to the team!
                    </motion.div>
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -right-4 bottom-16 hidden rounded-2xl rounded-br-sm border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-bubble md:block"
                    >
                        ✨ Ship it on Friday?
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
