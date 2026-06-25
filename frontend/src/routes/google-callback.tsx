import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { BubblespaceLogo } from "@/components/logo";

export const Route = createFileRoute("/auth/google/callback")({
    component: GoogleCallbackPage,
});

function GoogleCallbackPage() {
    const navigate = useNavigate();
    const handled = useRef(false);

    useEffect(() => {
        if (handled.current) return;
        handled.current = true;

        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const userJson = params.get("user");
        const error = params.get("error");

        if (error) {
            toast.error(`Sign-in failed: ${error}`);
            navigate({ to: "/login", replace: true });
            return;
        }

        if (accessToken && refreshToken && userJson) {
            try {
                const user = JSON.parse(userJson);

                localStorage.setItem("access_token", accessToken);
                localStorage.setItem("refresh_token", refreshToken);
                localStorage.setItem("user", JSON.stringify(user));

                toast.success("Signed in with Google!");
                // Resume at the exact step this user is on. New Google users haven't
                // finished onboarding, so send them into setup — not the dashboard.
                const onboarded = user?.onboardingComplete || user?.onboardingStep === "complete";
                navigate({ to: onboarded ? "/dashboard" : "/setup-profile", replace: true });
            } catch (err) {
                console.error("Failed to parse user JSON:", err);
                toast.error("Authentication error. Please try again.");
                navigate({ to: "/login", replace: true });
            }
        } else {
            console.warn("No tokens found in URL.");
            navigate({ to: "/login", replace: true });
        }
    }, [navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
            <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                    <div className="absolute -inset-4 rounded-full bg-primary/20 animate-ping" />
                    <BubblespaceLogo className="relative size-16 text-primary" />
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight">Signing you in...</h2>
                    <p className="text-muted-foreground mt-2">Securing your session in the Bubble space...</p>
                </div>
                <div className="mt-8 animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        </div>
    );
}
