import { motion, useScroll, useTransform } from "motion/react";
import { Link } from "@tanstack/react-router";
import { BubblespaceLogo } from "../logo";

export function Nav() {
    const { scrollY } = useScroll();
    const blur = useTransform(scrollY, [0, 80], [0, 14]);
    const bg = useTransform(
        scrollY,
        [0, 80],
        ["oklch(1 0 0 / 0)", "oklch(1 0 0 / 0.75)"],
    );

    return (
        <motion.header
            style={{ backdropFilter: useTransform(blur, (v) => `blur(${v}px)`), backgroundColor: bg }}
            className="fixed inset-x-0 top-0 z-40 border-b border-transparent transition-colors"
        >
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <a href="#" className="flex items-center gap-2">
                    <BubblespaceLogo className="size-8" />
                    <span className="font-display text-lg font-bold tracking-tight text-foreground">
                        Bubblespace
                    </span>
                </a>
                <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
                    <a href="#features" className="hover:text-foreground">Features</a>
                    <a href="#how" className="hover:text-foreground">How it works</a>
                    <a href="#use-cases" className="hover:text-foreground">Use cases</a>
                    <a href="#faq" className="hover:text-foreground">FAQ</a>
                </nav>
                <Link
                    to="/login"
                    className="rounded-full bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-bubble transition-transform hover:scale-[1.04]"
                >
                    Get started
                </Link>
            </div>
        </motion.header>
    );
}

export function Footer() {
    return (
        <footer className="border-t border-border bg-card/40 py-12">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
                <div className="flex items-center gap-2">
                    <BubblespaceLogo className="size-7" />
                    <span className="font-display font-bold text-foreground">Bubblespace</span>
                </div>
                <nav className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                    <a href="#" className="hover:text-foreground">Privacy</a>
                    <a href="#" className="hover:text-foreground">Terms</a>
                    <a href="#" className="hover:text-foreground">Security</a>
                    <a href="#" className="hover:text-foreground">Status</a>
                </nav>
                <p className="text-sm text-muted-foreground">
                    © {new Date().getFullYear()} Bubblespace, Inc.
                </p>
            </div>
        </footer>
    );
}
