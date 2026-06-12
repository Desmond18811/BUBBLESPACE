import { useState } from 'react'
import { cn } from '@/lib/utils'
import { getSecureMediaUrl } from '@/lib/utils'
import { Bot } from 'lucide-react'

interface AvatarProps {
    src?: string | null
    name: string
    className?: string
    isGroup?: boolean
}

export function ChatAvatar({ src, name, className, isGroup }: AvatarProps) {
    const [imageError, setImageError] = useState(false)
    const initials = (name || '?')
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2)

    const isBlackIcon = src === 'black' || src === '#000000' || isGroup
    const resolvedSrc = isBlackIcon ? null : getSecureMediaUrl(src)
    const hasImage = resolvedSrc && !imageError

    const isAida = (name || '').toLowerCase().includes('aida')

    if (hasImage) {
        return (
            <img
                src={resolvedSrc}
                alt={name}
                onError={() => setImageError(true)}
                className={cn("rounded-full object-cover shrink-0", className)}
            />
        )
    }

    if (isAida) {
        return (
            <div className={cn(
                "flex items-center justify-center rounded-full bg-gradient-to-br from-purple to-purple-dark text-white font-semibold shrink-0",
                className
            )}>
                <Bot className="size-[55%]" />
            </div>
        )
    }

    return (
        <div className={cn(
            isBlackIcon
                ? "flex items-center justify-center rounded-full bg-black text-white font-semibold shrink-0 uppercase"
                : "flex items-center justify-center rounded-full bg-purple/10 text-purple font-semibold shrink-0 uppercase",
            className
        )}>
            {initials}
        </div>
    )
}

