import { createFileRoute, Link } from "@tanstack/react-router";
import { BubblespaceLogo } from "@/components/logo";
import { motion } from "motion/react";
import { Home, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/404")({
    component: NotFoundPage,
});

export function NotFoundPage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-canvas flex items-center justify-center p-6 font-poppins">
            {/* Topographic Background */}
            <div
                className="fixed inset-0 pointer-events-none opacity-20 topographic-bg-refined"
                style={{
                    backgroundImage: "url('/topographic_bg_v2_1780147871964.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-lg"
            >
                <div className="bg-white/80 backdrop-blur-2xl p-12 rounded-[3rem] border border-black/5 shadow-2xl text-center space-y-8">
                    <div className="relative inline-block">
                        <div className="absolute -inset-4 bg-purple/10 rounded-full blur-2xl animate-pulse" />
                        <BubblespaceLogo className="relative size-20 text-purple mx-auto" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-[80px] font-bold leading-none tracking-tighter text-purple/20">
                            404
                        </h1>
                        <h2 className="text-3xl font-bold text-ink">
                            Lost in space?
                        </h2>
                        <p className="text-ink-soft max-w-[280px] mx-auto">
                            The bubble you're looking for seems to have floated away into the void.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link
                            to="/dashboard"
                            className="group flex items-center gap-2 bg-purple text-white px-8 py-4 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple/20"
                        >
                            <Home className="size-5" />
                            Return Home
                        </Link>
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center gap-2 bg-purple-soft text-purple px-8 py-4 rounded-2xl font-bold transition-all hover:bg-purple-light"
                        >
                            <ArrowLeft className="size-5" />
                            Go Back
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
