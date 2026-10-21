// Bottom edge of the landing hero: a broad, low onion-dome arch rising into
// the photo, with palm trees on either side. Filled with the page's dark green
// so the content below seems to open up into the picture.
// Drawn on a 375×175 grid — the hero keeps this exact proportion to the photo
// (see .lp-hero / .lp-arch in index.css), so the arch tip always lands at the
// subject's chest, never the face, on any screen.

// The arch outline: wide shoulders sweeping in to a pointed tip at the top centre.
const ARCH_EDGE =
  'M0 104 C34 102 46 95 60 82 C80 61 118 44 150 31.5 C170 23 182 12 187.5 2 C193 12 205 23 225 31.5 C257 44 295 61 315 82 C329 95 341 102 375 104'

// One date palm standing on (0, 0), about 140 units tall.
function Palm() {
  return (
    <g>
      <path d="M-5 0 C-4 -40 -10 -82 -3 -122 L3 -122 C-2 -82 5 -40 6 0 Z" />
      <path d="M0 -122 Q-30 -138 -58 -114 Q-30 -126 0 -118 Z" />
      <path d="M0 -122 Q-42 -122 -64 -90 Q-40 -112 0 -116 Z" />
      <path d="M0 -122 Q-24 -154 -50 -154 Q-22 -142 0 -120 Z" />
      <path d="M0 -122 Q30 -138 58 -114 Q30 -126 0 -118 Z" />
      <path d="M0 -122 Q42 -122 64 -90 Q40 -112 0 -116 Z" />
      <path d="M0 -122 Q24 -154 50 -154 Q22 -142 0 -120 Z" />
      <path d="M0 -122 Q4 -152 14 -164 Q7 -145 2 -120 Z" />
      <circle cx="-6" cy="-115" r="4" />
      <circle cx="6" cy="-114" r="4" />
    </g>
  )
}

export default function HeroArch({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 375 175" preserveAspectRatio="none" aria-hidden="true">
      <g fill="currentColor">
        <path d={`${ARCH_EDGE} V175 H0 Z`} />
        <g transform="translate(26 175) scale(1.08)">
          <Palm />
        </g>
        <g transform="translate(349 175) scale(-1.08 1.08)">
          <Palm />
        </g>
      </g>
      {/* gold rim along the arch edge */}
      <path d={ARCH_EDGE} fill="none" stroke="#d4a646" strokeWidth="2" strokeOpacity="0.9" />
    </svg>
  )
}
