import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Mail, Lock, Sparkles, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { login } from "@/lib/api";
import { toast } from "sonner";
import { PasswordValidator, getPasswordRequirements } from "@/components/auth/password-validator";
import { resumeFromUser, setStoredStage } from "@/lib/onboarding";

export const Route = createFileRoute("/login")({
    validateSearch: (search: Record<string, unknown>) => {
        return {
            reason: (search.reason as string) || undefined,
            email: (search.email as string) || undefined,
        };
    },
    component: Login,
});

function Login() {
    const search = useSearch({ from: '/login' });
    const [email, setEmail] = useState(typeof search.email === 'string' ? search.email : "");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const sessionExpired = search.reason === 'expired';

    useEffect(() => {
        if (sessionExpired) {
            toast.error("Session expired. Please log in again.");
        }
    }, [sessionExpired]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        const requirements = getPasswordRequirements(password);
        const unmet = requirements.filter(r => !r.met);
        if (unmet.length > 0) {
            toast.error('Password does not meet requirements: ' + unmet[0].label);
            return;
        }

        setLoading(true);
        try {
            const response = await login({ email, password });
            const data = response.data || response;
            const { accessToken, refreshToken, user, requiresVerification } = data;

            if (requiresVerification || !user?.isVerified) {
                setStoredStage('awaiting_otp');
                toast.error('Please verify your account first. A new code has been sent.');
                // @ts-ignore - state is supported but might have typing issues in some versions
                navigate({ to: '/verify-otp', search: { email: user?.email || email }, state: { email: user?.email || email } });
            } else {
                localStorage.setItem('access_token', accessToken);
                localStorage.setItem('refresh_token', refreshToken);
                localStorage.setItem('user', JSON.stringify(user));
                toast.success('Welcome back to Bubblespace!');
                // Resume at the exact step the backend says the user is on (mirrors stage).
                navigate({ to: resumeFromUser(user) });
            }
        } catch (error: any) {
            toast.error(error.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const BASE_URL = ((import.meta as any).env.VITE_API_URL?.trim()) || 'https://bubble-backend-production-9ka0.up.railway.app/api/v1';
        window.location.href = `${BASE_URL}/auth/google`;
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-hero flex items-center justify-center px-4">
            <Link
                to="/"
                className="absolute left-6 top-6 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to home
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-card/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border shadow-glow text-center">
                    <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-bubble border border-border">
                        <img src="/favicon.svg" alt="Bubblespace" className="h-8 w-8 object-contain" />
                    </div>
                    <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
                        Welcome back
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Log in to your Bubblespace account
                    </p>

                    <form onSubmit={handleLogin} className="mt-8 space-y-4 text-left">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-20" />
                            <input
                                type="email"
                                placeholder="Email address"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all relative z-10"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-20" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-12 py-3 rounded-2xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all relative z-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none z-20"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>

                        <PasswordValidator password={password} />

                        <div className="flex justify-end px-2">
                            <Link to="/forgot-password" className="text-xs text-primary font-semibold hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-gradient-primary text-primary-foreground font-bold shadow-bubble transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                        >
                            {loading ? "Authenticating..." : "Sign in"}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full py-3 flex items-center justify-center gap-3 rounded-2xl bg-white border border-border text-foreground font-medium transition-colors hover:bg-muted/50"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Google
                    </button>

                    <p className="mt-8 text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link to="/signup" className="text-primary font-semibold hover:underline">
                            Create one
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
