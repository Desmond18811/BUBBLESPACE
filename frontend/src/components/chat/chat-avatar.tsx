import { useState } from 'react'
import { cn } from '@/lib/utils'
import { getSecureMediaUrl } from '@/lib/utils'

interface AvatarProps {
    src?: string | null
    name: string
    className?: string
}

export function ChatAvatar({ src, name, className }: AvatarProps) {
    const [imageError, setImageError] = useState(false)
    const initials = (name || '?')
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2)

    const resolvedSrc = getSecureMediaUrl(src)
    const hasImage = resolvedSrc && !imageError

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

    return (
        <div className={cn(
            "flex items-center justify-center rounded-full bg-purple/10 text-purple font-semibold shrink-0 uppercase",
            className
        )}>
            {initials}
        </div>
    )
}

