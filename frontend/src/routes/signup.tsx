import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail, Lock, User, Sparkles, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { register, checkUserStatus } from "@/lib/api";
import { generateKeyPair } from "@/lib/crypto-utils";
import { storePrivateKey } from "@/lib/key-storage";
import { setStoredStage } from "@/lib/onboarding";
import { toast } from "sonner";
import { PasswordValidator, getPasswordRequirements } from "@/components/auth/password-validator";

const INDUSTRIES = [
  "Technology & Software",
  "Healthcare & Life Sciences",
  "Finance & Banking",
  "Education & E-Learning",
  "Retail & E-commerce",
  "Real Estate & Construction",
  "Manufacturing & Logistics",
  "Media & Entertainment",
  "Marketing & Advertising",
  "Professional Services & Consulting",
  "Hospitality & Tourism",
  "Energy & Utilities",
  "Non-Profit & Government",
  "Other"
];

export const Route = createFileRoute("/signup")({
    validateSearch: (search: Record<string, unknown>) => {
        return {
            inviteCode: (search.inviteCode as string) || undefined,
        }
    },
    component: Signup,
});

function Signup() {
    const { inviteCode: queryInviteCode } = Route.useSearch()
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [signupMode, setSignupMode] = useState<"individual" | "organization">("individual");
    const [orgName, setOrgName] = useState("");
    const [orgIndustry, setOrgIndustry] = useState("");
    const [orgSize, setOrgSize] = useState("");
    const [inviteCode, setInviteCode] = useState(queryInviteCode || "");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        const requirements = getPasswordRequirements(password);
        const unmet = requirements.filter(r => !r.met);
        if (unmet.length > 0) {
            toast.error('Password does not meet requirements: ' + unmet[0].label);
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const normalizedEmail = email.trim().toLowerCase();

            // Pre-flight: if this email already has an account, route the user
            // instead of POSTing /register and getting a generic 409.
            try {
                const status = await checkUserStatus(normalizedEmail);
                if (status.exists) {
                    if (status.nextAction === "verify_otp") {
                        setStoredStage('awaiting_otp');
                        toast.message("Picking up where you left off — let's finish OTP verification.");
                        navigate({ to: '/verify-otp', search: { email: normalizedEmail } as any });
                        return;
                    }
                    if (status.nextAction === "login_then_setup" || status.nextAction === "login") {
                        toast.message("An account with this email already exists. Please log in.");
                        navigate({ to: '/login', search: { email: normalizedEmail } as any });
                        return;
                    }
                }
            } catch {
                // Probe is best-effort; fall through to the real register call.
            }

            const { publicKey, secretKey } = generateKeyPair();
            await storePrivateKey(secretKey);

            const response = await register({
                email: normalizedEmail,
                password,
                confirm_password: confirmPassword,
                full_name: name,
                publicKey,
                signupKind: signupMode,
                org_name: signupMode === "organization" ? orgName : undefined,
                org_industry: signupMode === "organization" ? orgIndustry : undefined,
                org_size: signupMode === "organization" ? orgSize : undefined,
                inviteCode: inviteCode || undefined,
            });

            setStoredStage('awaiting_otp');
            toast.success(response?.data?.resumed
                ? 'Resuming signup — a fresh OTP has been sent.'
                : 'Account created! Check your email for a verification code.');
            // @ts-ignore - state support
            navigate({ to: '/verify-otp', search: { email: response.data?.email || normalizedEmail }, state: { email: response.data?.email || normalizedEmail } });
        } catch (error: any) {
            if (error?.status === 409 && error?.data?.requiresLogin) {
                toast.message("An account with this email already exists. Please log in.");
                navigate({ to: '/login', search: { email: email.trim().toLowerCase() } as any });
            } else {
                toast.error(error.message || 'Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const BASE_URL = ((import.meta as any).env.VITE_API_URL?.replace(/ i$/, '')?.trim()) || 'https://bubble-backend-production-96a0.up.railway.app/api/v1';
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
                        Join the bubble
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        {signupMode === "organization" ? "Register your business workspace" : "Create your Bubblespace account"}
                    </p>

                    <div className="mt-8 flex p-1 bg-muted rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setSignupMode("individual")}
                            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${signupMode === "individual" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            Individual
                        </button>
                        <button
                            type="button"
                            onClick={() => setSignupMode("organization")}
                            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${signupMode === "organization" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            Organization
                        </button>
                    </div>

                    <form onSubmit={handleSignup} className="mt-8 space-y-4 text-left">
                        {signupMode === "organization" && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="space-y-4"
                            >
                                <div className="relative">
                                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-20" />
                                    <input
                                        type="text"
                                        placeholder="Organization Name"
                                        required
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all relative z-10"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <select
                                        value={orgIndustry}
                                        onChange={(e) => setOrgIndustry(e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all relative z-10 text-sm appearance-none"
                                    >
                                        <option value="">Industry</option>
                                        {INDUSTRIES.map((ind) => (
                                            <option key={ind} value={ind}>
                                                {ind}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={orgSize}
                                        onChange={(e) => setOrgSize(e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all relative z-10 text-sm appearance-none"
                                    >
                                        <option value="">Company Size</option>
                                        <option value="solo">Solo (1 Employee)</option>
                                        <option value="2-10">2-10 Employees</option>
                                        <option value="11-50">11-50 Employees</option>
                                        <option value="51-200">51-200 Employees</option>
                                        <option value="201-500">201-500 Employees</option>
                                        <option value="500+">500+ Employees</option>
                                    </select>
                                </div>
                            </motion.div>
                        )}

                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-20" />
                            <input
                                type="text"
                                placeholder="Full name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all relative z-10"
                            />
                        </div>

                        {signupMode === "individual" && (
                            <div className="relative">
                                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-20" />
                                <input
                                    type="text"
                                    placeholder="Invite Code (optional)"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all relative z-10"
                                />
                            </div>
                        )}
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
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-20" />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-12 pr-12 py-3 rounded-2xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all relative z-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none z-20"
                            >
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>

                        <PasswordValidator password={password} />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-gradient-primary text-primary-foreground font-bold shadow-bubble transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 mt-2"
                        >
                            {loading ? "Creating account..." : "Sign up"}
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
                        Already have an account?{" "}
                        <Link to="/login" className="text-primary font-semibold hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
