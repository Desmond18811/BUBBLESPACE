import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function getPasswordRequirements(pw: string) {
    return [
        { label: '8+ characters', met: pw.length >= 8 },
        { label: 'Uppercase letter', met: /[A-Z]/.test(pw) },
        { label: 'Lowercase letter', met: /[a-z]/.test(pw) },
        { label: 'One number', met: /\d/.test(pw) },
        { label: 'Special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(pw) }
    ]
}

export function PasswordValidator({ password }: { password: string }) {
    if (!password) return null;

    const requirements = getPasswordRequirements(password);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 px-2">
            {requirements.map((req, i) => (
                <div key={i} className={cn(
                    "flex items-center gap-2 text-[11px] transition-colors",
                    req.met ? "text-emerald-500" : "text-ink-soft/60"
                )}>
                    <div className={cn(
                        "size-3.5 rounded-full flex items-center justify-center border transition-all",
                        req.met ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-black/5 border-black/10 text-transparent"
                    )}>
                        {req.met && <Check className="size-2.5" />}
                    </div>
                    <span className="font-medium">{req.label}</span>
                </div>
            ))}
        </div>
    );
}
