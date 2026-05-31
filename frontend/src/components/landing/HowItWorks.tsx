import { motion } from "motion/react";
import { UserPlus, Hash, Send } from "lucide-react";

const STEPS = [
    {
        num: "01",
        icon: UserPlus,
        title: "Create your space",
        text: "Spin up a workspace for your org in under a minute. Invite via email or SSO.",
    },
    {
        num: "02",
        icon: Hash,
        title: "Pop into a channel",
        text: "Channels group your conversations by team, project, or vibe. Threads keep replies clean.",
    },
    {
        num: "03",
        icon: Send,
        title: "Float through your day",
        text: "Messages, files, voice, and search — all in one calm, beautiful place.",
    },
];

export function HowItWorks() {
    return (
        <section id="how" className="relative bg-gradient-hero py-28">
            <div className="mx-auto max-w-6xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-2xl text-center"
                >
                    <p className="font-medium text-primary">How it works</p>
                    <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                        From signup to first message in seconds.
                    </h2>
                </motion.div>

                <div className="mt-16 grid gap-6 md:grid-cols-3">
                    {STEPS.map((s, i) => (
                        <motion.div
                            key={s.num}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.55, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -6 }}
                            className="group relative overflow-hidden rounded-3xl border border-border bg-card/80 p-8 backdrop-blur-sm transition-shadow hover:shadow-glow"
                        >
                            <motion.div
                                className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-bubble opacity-60"
                                animate={{ scale: [1, 1.1, 1], rotate: [0, 8, 0] }}
                                transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <div className="relative flex items-center justify-between">
                                <div className="font-display text-5xl font-bold text-primary/30">
                                    {s.num}
                                </div>
                                <motion.div
                                    whileHover={{ rotate: -8, scale: 1.05 }}
                                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-bubble"
                                >
                                    <s.icon className="h-5 w-5" />
                                </motion.div>
                            </div>
                            <h3 className="relative mt-4 font-display text-xl font-semibold text-foreground">
                                {s.title}
                            </h3>
                            <p className="relative mt-2 text-muted-foreground">{s.text}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
