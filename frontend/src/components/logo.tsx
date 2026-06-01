import { cn } from "@/lib/utils";

export function BubblespaceLogo({ className }: { className?: string }) {
    return (
        <img
            src="/favicon.svg"
            alt="Bubblespace Logo"
            className={cn("size-10 object-contain", className)}
        />
    );
}
