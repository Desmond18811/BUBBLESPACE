import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";

const FAQS = [
    { q: "Is Bubblespace free to try?", a: "Yes. Every workspace starts on a generous free plan. No credit card required." },
    { q: "Can I migrate from Slack or Teams?", a: "Of course. Our importer brings your channels, members, and message history over in minutes." },
    { q: "Is it secure enough for enterprise?", a: "Bubblespace is SOC 2 Type II compliant with SSO, SCIM, audit logs, and end-to-end encryption." },
    { q: "Does it work offline?", a: "Yes — desktop and mobile apps cache recent conversations so you can read and queue messages offline." },
    { q: "Can I use it across multiple organizations?", a: "Switch between any number of workspaces from one app, on any device." },
];

export function FAQ() {
    const [open, setOpen] = useState<number | null>(0);
    return (
        <section id="faq" className="py-28">
            <div className="mx-auto max-w-3xl px-6">
                <div className="text-center">
                    <p className="font-medium text-primary">FAQ</p>
                    <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                        Questions, popped.
                    </h2>
                </div>
                <div className="mt-12 space-y-3">
                    {FAQS.map((f, i) => {
                        const isOpen = open === i;
                        return (
                            <div
                                key={f.q}
                                className="overflow-hidden rounded-2xl border border-border bg-card"
                            >
                                <button
                                    onClick={() => setOpen(isOpen ? null : i)}
                                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                                >
                                    <span className="font-display text-lg font-medium text-foreground">
                                        {f.q}
                                    </span>
                                    <motion.span
                                        animate={{ rotate: isOpen ? 45 : 0 }}
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </motion.span>
                                </button>
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                        >
                                            <p className="px-6 pb-5 text-muted-foreground">{f.a}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
