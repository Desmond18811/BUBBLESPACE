import { motion } from "motion/react";
import { Briefcase, GraduationCap, Heart, Rocket } from "lucide-react";

const CASES = [
    { icon: Rocket, title: "Startups", text: "Move fast without losing context. Bubblespace scales from 5 to 5,000." },
    { icon: Briefcase, title: "Enterprises", text: "Bring every department onto one calm, secure, beautifully organized space." },
    { icon: GraduationCap, title: "Universities", text: "Connect departments, faculty, and student groups in dedicated channels." },
    { icon: Heart, title: "Non-profits", text: "Coordinate volunteers and chapters worldwide — free for qualifying orgs." },
];

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};
const item = {
    hidden: { opacity: 0, y: 24, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export function UseCases() {
    return (
        <section id="use-cases" className="py-28">
            <div className="mx-auto max-w-6xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-2xl text-center"
                >
                    <p className="font-medium text-primary">Use cases</p>
                    <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                        Built for every kind of team.
                    </h2>
                </motion.div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-80px" }}
                    className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                >
                    {CASES.map((c) => (
                        <motion.div
                            key={c.title}
                            variants={item}
                            whileHover={{ y: -6, transition: { duration: 0.2 } }}
                            className="group relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-bubble transition-shadow hover:shadow-glow"
                        >
                            <motion.div
                                className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-bubble opacity-0 group-hover:opacity-100"
                                transition={{ duration: 0.4 }}
                            />
                            <motion.div
                                whileHover={{ rotate: 8, scale: 1.1 }}
                                className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary"
                            >
                                <c.icon className="h-5 w-5 text-primary" />
                            </motion.div>
                            <h3 className="relative mt-5 font-display text-lg font-semibold text-foreground">
                                {c.title}
                            </h3>
                            <p className="relative mt-1.5 text-sm text-muted-foreground">{c.text}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
