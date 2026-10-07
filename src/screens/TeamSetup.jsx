import { useState } from 'react'

const MAX_MEMBERS = 8

export default function TeamSetup({ onBack, onReady }) {
  const [teamName, setTeamName] = useState('')
  const [members, setMembers] = useState(['', ''])
  const [submitting, setSubmitting] = useState(false)

  const filledMembers = members.map((m) => m.trim()).filter(Boolean)
  const canStart = teamName.trim() && filledMembers.length > 0 && !submitting

  function updateMember(i, value) {
    setMembers((list) => list.map((m, idx) => (idx === i ? value : m)))
  }

  function removeMember(i) {
    setMembers((list) => list.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canStart) return
    setSubmitting(true)
    await onReady(teamName.trim(), filledMembers)
  }

  return (
    <main className="screen">
      <header className="screen-header">
        <button className="link-btn" onClick={onBack}>
          ← Back
        </button>
        <p className="eyebrow eyebrow-dark">Step 1 of 2</p>
        <h2>Assemble your team</h2>
        <p className="muted">Give your team a name and add everyone who is playing.</p>
      </header>

      <form className="card form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="label">Team name</span>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. The Ansar"
            maxLength={40}
            autoComplete="off"
          />
        </label>

        <div className="field">
          <span className="label">Team members</span>
          {members.map((name, i) => (
            <div className="member-row" key={i}>
              <input
                type="text"
                value={name}
                onChange={(e) => updateMember(i, e.target.value)}
                placeholder={`Member ${i + 1}`}
                maxLength={40}
                autoComplete="off"
              />
              {members.length > 1 && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => removeMember(i)}
                  aria-label={`Remove member ${i + 1}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {members.length < MAX_MEMBERS && (
            <button
              type="button"
              className="link-btn add-member"
              onClick={() => setMembers((list) => [...list, ''])}
            >
              + Add member
            </button>
          )}
        </div>

        <button type="submit" className="btn btn-green" disabled={!canStart}>
          {submitting ? 'Starting…' : 'Start the Hunt'}
        </button>
      </form>
    </main>
  )
}
