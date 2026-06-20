import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { verifyOTP, resendOTP } from "@/lib/api";
import { toast } from "sonner";
import { BubblespaceLogo } from "@/components/logo";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/verify-otp")({
    validateSearch: (search: Record<string, unknown>) => {
        return {
            email: (search.email as string) || undefined,
        };
    },
    component: VerifyOTPPage,
});

function VerifyOTPPage() {
    const search = useSearch({ from: "/verify-otp" });
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Support both search parameters and history state
    // @ts-ignore
    const email = search.email || window.history.state?.usr?.email;

    useEffect(() => {
        if (!email) {
            toast.error("Session expired. Please sign up again.");
            navigate({ to: "/signup" });
        }
    }, [email, navigate]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 5) {
            toast.error("Code must be 5 digits");
            return;
        }
        setLoading(true);
        try {
            const response = await verifyOTP(email!, otp);
            const { accessToken, refreshToken, user } = response.data || response;

            localStorage.setItem("access_token", accessToken);
            localStorage.setItem("refresh_token", refreshToken);
            localStorage.setItem("user", JSON.stringify(user));

            toast.success("Email verified! Welcome to Bubblespace.");
            // Resume at the step the backend says the user is on.
            const goToDashboard = user?.onboardingComplete || user?.onboardingStep === "complete";
            navigate({ to: goToDashboard ? "/dashboard" : "/setup-profile" });
        } catch (error: any) {
            toast.error(error.message || "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            await resendOTP(email!);
            toast.success("A new code has been sent to your email.");
        } catch (err: any) {
            toast.error(err.message || "Failed to resend code.");
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-hero flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-card/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border shadow-glow text-center">
                    <div className="mx-auto mb-6">
                        <BubblespaceLogo className="mx-auto text-primary" />
                    </div>
                    <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
                        Verify Email
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Enter the 5-digit code sent to
                    </p>
                    <p className="text-primary font-bold text-sm mt-1">{email}</p>

                    <form onSubmit={handleVerify} className="mt-8 space-y-6">
                        <input
                            type="text"
                            required
                            maxLength={5}
                            className="w-full bg-background border border-border rounded-2xl px-4 py-5 text-foreground text-center text-4xl font-bold tracking-[1rem] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/10 relative z-10 pointer-events-auto"
                            placeholder="00000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-gradient-primary text-primary-foreground font-bold shadow-bubble transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? "Verifying..." : "Verify & Continue"}
                        </button>
                    </form>

                    <p className="mt-8 text-sm text-muted-foreground">
                        Didn't receive code?{" "}
                        <button
                            type="button"
                            onClick={handleResend}
                            className="text-primary font-bold hover:underline bg-transparent border-none cursor-pointer"
                        >
                            Resend Code
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
