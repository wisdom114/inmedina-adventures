import { useState } from 'react'
import { POINTS } from '../data/scoring.js'

const THUMB_SIZE = 240

// Shrink the photo to a small JPEG thumbnail so it can be kept with the
// team's progress (the full photo stays on the phone).
async function makeThumbnail(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = url
    })
    const scale = THUMB_SIZE / Math.max(img.width, img.height)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * Math.min(1, scale))
    canvas.height = Math.round(img.height * Math.min(1, scale))
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.7)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function PhotoChallenge({ text, result, onPhoto, onSkip }) {
  const [busy, setBusy] = useState(false)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    let thumb = null
    try {
      thumb = await makeThumbnail(file)
    } catch {
      // Still count the photo even if the thumbnail can't be made.
    }
    setBusy(false)
    onPhoto(thumb)
  }

  return (
    <section className="card photo-card slide-in">
      <p className="section-label section-label-gold">📸 Photo Challenge</p>
      <p className="photo-text">{text}</p>

      {result.photo === 'taken' && (
        <div className="photo-done">
          {result.thumb && <img className="photo-thumb" src={result.thumb} alt="Your team photo" />}
          <div>
            <p className="photo-done-title">✓ Challenge complete</p>
            <p className="photo-done-points">+{POINTS.photoTaken} points</p>
          </div>
        </div>
      )}

      {result.photo === 'skipped' && <p className="photo-skipped">Photo skipped</p>}

      {!result.photo && (
        <div className="photo-actions">
          <label className={`btn btn-gold photo-btn ${busy ? 'is-busy' : ''}`}>
            {busy ? 'Saving photo…' : `Take Photo  (+${POINTS.photoTaken} pts)`}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              disabled={busy}
              hidden
            />
          </label>
          <button type="button" className="link-btn skip-link" onClick={onSkip} disabled={busy}>
            Skip
          </button>
        </div>
      )}
    </section>
  )
}
