interface LogoMarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 24, className = '' }: LogoMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={className}
    >
      {/* S-curve: forms the letter S while suggesting a growth/signal trend */}
      <path
        d="M22 9.5 C22 9.5 19 9.5 16 9.5 C12 9.5 10 11.5 10 13.5 C10 15.5 12 16.5 16 16.5 C20 16.5 22 17.5 22 19.5 C22 21.5 20 23 16 23 C13 23 10 23 10 23"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Spark dot at top right */}
      <circle cx="23.5" cy="8.5" r="1.8" fill="white" opacity="0.9" />
    </svg>
  )
}

interface LogoBadgeProps {
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: { box: 'w-8 h-8 rounded-lg', mark: 16 },
  md: { box: 'w-9 h-9 rounded-xl', mark: 18 },
  lg: { box: 'w-14 h-14 rounded-2xl shadow-lg', mark: 28 },
}

export function LogoBadge({ size = 'md' }: LogoBadgeProps) {
  const cfg = SIZES[size]
  return (
    <div className={`${cfg.box} bg-brand-600 flex items-center justify-center flex-shrink-0`}>
      <LogoMark size={cfg.mark} />
    </div>
  )
}
