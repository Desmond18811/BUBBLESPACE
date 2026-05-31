import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { resetPassword } from "@/lib/api";
import { toast } from "sonner";
import { BubblespaceLogo } from "@/components/logo";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { PasswordValidator, getPasswordRequirements } from "@/components/auth/password-validator";

export const Route = createFileRoute("/reset-password")({
    validateSearch: (search: Record<string, unknown>) => {
        return {
            email: (search.email as string) || undefined,
            otp: (search.otp as string) || undefined,
        };
    },
    component: ResetPasswordPage,
});

function ResetPasswordPage() {
    const search = useSearch({ from: "/reset-password" });
    const [email, setEmail] = useState(search.email || "");
    const [otp, setOtp] = useState(search.otp || "");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        const requirements = getPasswordRequirements(newPassword);
        const unmet = requirements.filter(r => !r.met);
        if (unmet.length > 0) {
            toast.error('Password does not meet requirements: ' + unmet[0].label);
            return;
        }

        setLoading(true);
        try {
            await resetPassword({ email, otp, newPassword });
            toast.success("Password override successful! You can now log in.");
            navigate({ to: "/login" });
        } catch (error: any) {
            toast.error(error.message || "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-hero flex items-center justify-center px-4">
            <Link
                to="/login"
                className="absolute left-6 top-6 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to login
            </Link>

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
                        Reset Key
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Complete your password override
                    </p>

                    <form onSubmit={handleResetPassword} className="mt-8 space-y-4 text-left">
                        <div className="space-y-4">
                            {!search.email && (
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all relative z-10 pointer-events-auto"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            )}
                            {!search.otp && (
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">OTP Code</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-center text-2xl font-bold tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all relative z-10 pointer-events-auto"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">New Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-background border border-border rounded-2xl px-4 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all relative z-10 pointer-events-auto"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <PasswordValidator password={newPassword} />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-gradient-primary text-primary-foreground font-bold shadow-bubble transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 mt-4"
                        >
                            {loading ? "Resetting..." : "Save New Password"}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
