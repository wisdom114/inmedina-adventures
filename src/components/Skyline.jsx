// Silhouette of a domed masjid with two minarets. Filled with currentColor,
// so it can be set to the page cream and "cut out" of a green header.
export default function Skyline({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 360 112"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
    >
      <g fill="currentColor">
        {/* ground and low courtyard wall */}
        <rect x="0" y="104" width="360" height="8" />
        <rect x="30" y="92" width="300" height="13" />

        {/* left minaret */}
        <rect x="49" y="32" width="12" height="62" />
        <rect x="45" y="52" width="20" height="4" />
        <rect x="46" y="74" width="18" height="3" />
        <rect x="51" y="22" width="8" height="11" />
        <path d="M50 23 L55 5 L60 23 Z" />
        <rect x="54.4" y="0" width="1.2" height="6" />

        {/* right minaret */}
        <rect x="299" y="32" width="12" height="62" />
        <rect x="295" y="52" width="20" height="4" />
        <rect x="296" y="74" width="18" height="3" />
        <rect x="301" y="22" width="8" height="11" />
        <path d="M300 23 L305 5 L310 23 Z" />
        <rect x="304.4" y="0" width="1.2" height="6" />

        {/* side domes */}
        <rect x="92" y="80" width="44" height="14" />
        <path d="M94 82 C94 67 104 60 114 58 C124 60 134 67 134 82 Z" />
        <rect x="113.3" y="50" width="1.4" height="9" />
        <rect x="224" y="80" width="44" height="14" />
        <path d="M226 82 C226 67 236 60 246 58 C256 60 266 67 266 82 Z" />
        <rect x="245.3" y="50" width="1.4" height="9" />

        {/* main dome */}
        <rect x="134" y="70" width="92" height="24" />
        <path d="M136 72 C136 42 158 27 180 23 C202 27 224 42 224 72 Z" />
        <rect x="179" y="9" width="2" height="15" />
        <path d="M180 0.5a4.5 4.5 0 1 0 0 9a5.5 5.5 0 0 1 0-9z" />
      </g>
    </svg>
  )
}
