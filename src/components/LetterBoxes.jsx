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

// revealed: letter indexes filled in by "Reveal a letter" — locked, and
// skipped over when typing, deleting or moving between boxes.
export default function LetterBoxes({
  format,
  values,
  onChange,
  goldBoxes = {},
  status,
  celebrate = false,
  revealed = [],
  justRevealed = null,
}) {
  const refs = useRef([])
  const words = parseFormat(format)
  const count = values.length
  // Width of the longest word in boxes; punctuation marks are about half a box.
  const longestWord = Math.max(
    ...words.map((w) => w.reduce((n, cell) => n + (cell.type === 'fixed' ? 0.5 : 1), 0))
  )
  const locked = status === 'correct' || status === 'skipped'
  const isRevealed = (i) => revealed.includes(i)

  // Nearest box the player can type in, starting at i and moving in dir (+1 / -1).
  function editableFrom(i, dir) {
    for (let k = i; k >= 0 && k < count; k += dir) if (!isRevealed(k)) return k
    return -1
  }

  function focusBox(i, dir = 1) {
    const target = editableFrom(Math.max(0, Math.min(count - 1, i)), dir)
    const el = refs.current[target]
    if (el) {
      el.focus()
      el.select()
    }
  }

  // Write letters into the editable boxes starting at i, then move focus past them.
  function fillFrom(i, letters) {
    const next = [...values]
    let pos = i
    for (const ch of letters) {
      pos = editableFrom(pos, 1)
      if (pos === -1) break
      next[pos] = ch
      pos += 1
    }
    onChange(next)
    // Move on to the next box you can type in; at the end, stay on the last one.
    if (pos !== -1 && pos < count && editableFrom(pos, 1) !== -1) focusBox(pos, 1)
    else focusBox(count - 1, -1)
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
        const next = [...values]
        next[i] = ''
        onChange(next)
      } else {
        const prev = editableFrom(i - 1, -1)
        if (prev !== -1) {
          const next = [...values]
          next[prev] = ''
          onChange(next)
          focusBox(prev, -1)
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusBox(i - 1, -1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusBox(i + 1, 1)
    }
  }

  function handlePaste(i, e) {
    e.preventDefault()
    const letters = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z]/g, '')
    if (letters) fillFrom(i, letters)
  }

  return (
    <div
      className={`letter-boxes is-${status} ${celebrate ? 'is-celebrating' : ''}`}
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
                className={[
                  'lb-cell',
                  goldBoxes[cell.index + 1] ? 'is-gold' : '',
                  isRevealed(cell.index) ? 'is-revealed' : '',
                  justRevealed === cell.index ? 'is-just-revealed' : '',
                ].join(' ')}
                key={c}
                style={{ '--i': cell.index }}
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
                  disabled={locked || isRevealed(cell.index)}
                  aria-label={`Letter ${cell.index + 1}${isRevealed(cell.index) ? ' (revealed)' : ''}`}
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
