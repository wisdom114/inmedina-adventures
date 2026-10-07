// Thin gold divider: rule — crescent & star — rule.
export default function Ornament({ className = '' }) {
  return (
    <div className={`ornament ${className}`} aria-hidden="true">
      <span className="ornament-line" />
      <svg width="40" height="24" viewBox="0 0 40 24">
        <g fill="currentColor">
          {/* crescent */}
          <path d="M16 3.5a8.5 8.5 0 1 0 0 17a10 10 0 0 1 0-17z" />
          {/* small eight-pointed star */}
          <rect x="22.5" y="9" width="6" height="6" />
          <rect x="22.5" y="9" width="6" height="6" transform="rotate(45 25.5 12)" />
        </g>
      </svg>
      <span className="ornament-line is-right" />
    </div>
  )
}
