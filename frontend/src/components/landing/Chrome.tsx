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
                <Link to="/" className="flex items-center gap-2">
                    <BubblespaceLogo className="size-8" />
                    <span className="font-display text-lg font-bold tracking-tight text-foreground">
                        Bubblespace
                    </span>
                </Link>
                <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
                    <Link to="/" hash="features" className="hover:text-foreground">Features</Link>
                    <Link to="/" hash="how" className="hover:text-foreground">How it works</Link>
                    <Link to="/" hash="use-cases" className="hover:text-foreground">Use cases</Link>
                    <Link to="/" hash="faq" className="hover:text-foreground">FAQ</Link>
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
                    <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
                    <Link to="/terms" className="hover:text-foreground">Terms</Link>
                    <Link to="/security" className="hover:text-foreground">Security</Link>
                    <Link to="/status" className="hover:text-foreground">Status</Link>
                </nav>
                <p className="text-sm text-muted-foreground">
                    © {new Date().getFullYear()} Bubblespace, Inc.
                </p>
            </div>
        </footer>
    );
}
