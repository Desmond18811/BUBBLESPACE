import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { forgotPassword, resetPassword } from "@/lib/api";
import { toast } from "sonner";
import { BubblespaceLogo } from "@/components/logo";
import { motion } from "motion/react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { PasswordValidator, getPasswordRequirements } from "@/components/auth/password-validator";

export const Route = createFileRoute("/forgot-password")({
    component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await forgotPassword(email);
            toast.success("Reset code sent to your email.");
            setStep(2);
        } catch (error: any) {
            toast.error(error.message || "Failed to request reset");
        } finally {
            setLoading(false);
        }
    };

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
            toast.success("Password reset successful! Sign in now.");
            navigate({ to: "/login" });
        } catch (error: any) {
            toast.error(error.message || "Password reset failed");
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
                        {step === 1 ? "Recovery" : "Reset Key"}
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        {step === 1 ? "Enter your email to receive a reset code" : "Enter the code and your new password"}
                    </p>

                    {step === 1 ? (
                        <form onSubmit={handleRequestOTP} className="mt-8 space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1 mt-12">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-background border border-border rounded-2xl px-4 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all relative z-10 pointer-events-auto"
                                    placeholder="explorer@bubblespace.io"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-2xl bg-gradient-primary text-primary-foreground font-bold shadow-bubble transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? "Transmitting..." : "Send Reset Code"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="mt-8 space-y-6 text-left">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">6-Digit Code</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        className="w-full bg-background border border-border rounded-2xl px-4 py-4 text-center text-3xl font-bold tracking-[0.5rem] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all relative z-10 pointer-events-auto"
                                        placeholder="000000"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            className="w-full bg-background border border-border rounded-2xl pl-4 pr-12 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all relative z-10 pointer-events-auto"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none z-20"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    <PasswordValidator password={newPassword} />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-2xl bg-gradient-primary text-primary-foreground font-bold shadow-bubble transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? "Resetting..." : "Override & Sign In"}
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
