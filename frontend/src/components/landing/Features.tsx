import { motion } from "motion/react";
import {
    MessageSquare,
    Users,
    Shield,
    Zap,
    FileText,
    Mic,
    Search,
    Globe,
} from "lucide-react";

const FEATURES = [
    { icon: MessageSquare, title: "Channels & DMs", text: "Organize by team, project, or topic. Mention anyone, anywhere." },
    { icon: Users, title: "Org-wide directory", text: "Find every coworker instantly with a beautiful, searchable directory." },
    { icon: Shield, title: "Enterprise security", text: "SSO, SCIM, audit logs, and end-to-end encryption on every message." },
    { icon: Zap, title: "Lightning fast", text: "Instant load, instant search. Bubblespace feels weightless." },
    { icon: FileText, title: "Files & threads", text: "Drag, drop, and discuss. Threads keep conversations tidy." },
    { icon: Mic, title: "Voice & huddles", text: "One-tap voice rooms for quick syncs that don't need a meeting." },
    { icon: Search, title: "Smart search", text: "Find any message, file, or person — even from years ago." },
    { icon: Globe, title: "Works everywhere", text: "Web, macOS, Windows, iOS, Android. Pick up right where you left off." },
];

export function Features() {
    return (
        <section id="features" className="relative py-28">
            <div className="mx-auto max-w-6xl px-6">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                        Everything your team needs.<br />
                        <span className="text-muted-foreground">Nothing it doesn't.</span>
                    </h2>
                </div>

                <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {FEATURES.map((f, i) => (
                        <motion.div
                            key={f.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.5, delay: (i % 4) * 0.07 }}
                            whileHover={{ y: -6 }}
                            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-bubble transition-shadow hover:shadow-glow"
                        >
                            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-bubble opacity-0 transition-opacity group-hover:opacity-100" />
                            <div className="relative">
                                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-bubble">
                                    <f.icon className="h-5 w-5" />
                                </div>
                                <h3 className="font-display text-lg font-semibold text-foreground">
                                    {f.title}
                                </h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                    {f.text}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
