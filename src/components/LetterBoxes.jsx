import { useRef } from 'react'

const isLetter = (ch) => /[A-Za-z]/.test(ch)

// Turn "MEN'S TOILETS" into words of cells: letter cells (with their
// 1-based letter index) and fixed cells for punctuation like - and '.
export function parseFormat(format) {
  let letterIndex = 0
  return format
    .trim()
    .split(/\s+/)
    .map((word) =>
      [...word].map((ch) =>
        isLetter(ch) ? { type: 'letter', index: letterIndex++ } : { type: 'fixed', char: ch }
      )
    )
}

export default function LetterBoxes({ format, values, onChange, goldBoxes = {}, status }) {
  const refs = useRef([])
  const words = parseFormat(format)
  const count = values.length
  // Width of the longest word in boxes; punctuation marks are about half a box.
  const longestWord = Math.max(
    ...words.map((w) => w.reduce((n, cell) => n + (cell.type === 'fixed' ? 0.5 : 1), 0))
  )
  const locked = status === 'correct' || status === 'skipped'

  function focusBox(i) {
    const el = refs.current[Math.max(0, Math.min(count - 1, i))]
    if (el) {
      el.focus()
      el.select()
    }
  }

  function setLetter(i, ch) {
    const next = [...values]
    next[i] = ch
    onChange(next)
  }

  // Write letters into the boxes starting at i, then move focus past them.
  function fillFrom(i, letters) {
    const next = [...values]
    for (let k = 0; k < letters.length && i + k < count; k++) next[i + k] = letters[k]
    onChange(next)
    focusBox(Math.min(i + letters.length, count - 1))
  }

  function handleInput(i, e) {
    let letters = e.target.value.toUpperCase().replace(/[^A-Z]/g, '')
    // If the box already held a letter, drop it so typing overwrites it.
    const old = values[i]
    if (old && letters.length > 1) {
      letters = letters.startsWith(old) ? letters.slice(1) : letters.slice(0, -1)
    }
    if (!letters) return
    // Usually one letter; autocomplete or fast input can deliver several.
    fillFrom(i, letters)
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (values[i]) {
        setLetter(i, '')
      } else if (i > 0) {
        const next = [...values]
        next[i - 1] = ''
        onChange(next)
        focusBox(i - 1)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusBox(i - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusBox(i + 1)
    }
  }

  function handlePaste(i, e) {
    e.preventDefault()
    const letters = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z]/g, '')
    if (letters) fillFrom(i, letters)
  }

  return (
    <div
      className={`letter-boxes is-${status}`}
      style={{ '--cells': longestWord }}
      role="group"
      aria-label="Answer letters"
    >
      {words.map((word, w) => (
        <div className="lb-word" key={w}>
          {word.map((cell, c) =>
            cell.type === 'fixed' ? (
              <span className="lb-fixed" key={c} aria-hidden="true">
                {cell.char}
              </span>
            ) : (
              <span
                className={`lb-cell ${goldBoxes[cell.index + 1] ? 'is-gold' : ''}`}
                key={c}
              >
                {goldBoxes[cell.index + 1] && (
                  <small className="lb-num">{goldBoxes[cell.index + 1]}</small>
                )}
                <input
                  ref={(el) => (refs.current[cell.index] = el)}
                  className="lb-input"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  value={values[cell.index]}
                  disabled={locked}
                  aria-label={`Letter ${cell.index + 1}`}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleInput(cell.index, e)}
                  onKeyDown={(e) => handleKeyDown(cell.index, e)}
                  onPaste={(e) => handlePaste(cell.index, e)}
                />
              </span>
            )
          )}
        </div>
      ))}
    </div>
  )
}
