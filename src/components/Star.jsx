// Eight-pointed star (Rub el Hizb style) used as the brand mark.
export default function Star({ size = 48, color = 'currentColor', className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <g fill="none" stroke={color} strokeWidth="4">
        <rect x="22" y="22" width="56" height="56" />
        <rect x="22" y="22" width="56" height="56" transform="rotate(45 50 50)" />
        <circle cx="50" cy="50" r="12" />
      </g>
    </svg>
  )
}
