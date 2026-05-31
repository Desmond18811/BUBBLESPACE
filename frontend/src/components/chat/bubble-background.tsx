const bubbles = [
  { size: 220, left: '4%', top: '12%', delay: '0s', duration: '14s', opacity: 0.35 },
  { size: 140, left: '18%', top: '70%', delay: '2s', duration: '18s', opacity: 0.3 },
  { size: 300, left: '70%', top: '8%', delay: '1s', duration: '20s', opacity: 0.28 },
  { size: 180, left: '86%', top: '60%', delay: '3s', duration: '16s', opacity: 0.33 },
  { size: 110, left: '46%', top: '82%', delay: '1.5s', duration: '13s', opacity: 0.3 },
  { size: 90, left: '60%', top: '30%', delay: '4s', duration: '17s', opacity: 0.25 },
  { size: 160, left: '32%', top: '20%', delay: '2.5s', duration: '19s', opacity: 0.28 },
]

export function BubbleBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="bubble absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            top: b.top,
            opacity: b.opacity,
            animationDelay: b.delay,
            animationDuration: b.duration,
            background:
              'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(124,92,231,0.45))',
          }}
        />
      ))}
    </div>
  )
}
