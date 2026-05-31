import { cn } from "@/lib/utils";

export function BubblespaceLogo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 40 40" className={cn("size-10", className)} fill="none">
            <path
                d="M20 5 L33 30 H25 L20 19 L15 30 H7 Z"
                fill="currentColor"
            />
            <path
                d="M20 22 L25 32 H15 Z"
                fill="currentColor"
                opacity="0.55"
            />
        </svg>
    );
}
