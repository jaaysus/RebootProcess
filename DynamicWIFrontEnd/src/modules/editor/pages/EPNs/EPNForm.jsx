import { useState } from 'react'

export default function EPNForm({ onSubmit, loading, error }) {
  const [form, setForm] = useState({ epn: '', cavityCount: '' })
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')

    if (!form.epn.trim()) {
      setLocalError('EPN is required')
      return
    }

    const success = await onSubmit(form)
    if (success) {
      setForm({ epn: '', cavityCount: '' })
    }
  }

  return (
    <form className="epns-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={form.epn}
        onChange={e => setForm(f => ({ ...f, epn: e.target.value }))}
        placeholder="Enter EPN"
        className="epns-input"
      />
      <input
        type="number"
        value={form.cavityCount}
        onChange={e => setForm(f => ({ ...f, cavityCount: e.target.value }))}
        placeholder="Number of Cavities"
        className="epns-input"
      />
      <button type="submit" className="epns-add-btn" disabled={loading}>
        {loading ? 'Adding...' : 'Add EPN'}
      </button>
      {(error || localError) && (
        <div className="epns-error">{error || localError}</div>
      )}
    </form>
  )
}