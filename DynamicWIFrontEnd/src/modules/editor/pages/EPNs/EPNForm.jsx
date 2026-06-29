import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'

export default function EPNForm({ onSubmit, loading, error, successMessage, onImport }) {
  const [form, setForm] = useState({ epn: '', cavityCount: '' })
  const [localError, setLocalError] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef(null)

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

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsImporting(true)
    const reader = new FileReader()

    reader.onload = async (evt) => {
      try {
        const data = evt.target.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet)

        await onImport(rows)
      } catch (err) {
        console.error('Import failed', err)
        setLocalError('Failed to parse Excel file')
      } finally {
        setIsImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }

    reader.readAsBinaryString(file)
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
      <div className="d-flex gap-2 flex-wrap">
        <div className="btn-group">
          <button type="submit" className="epns-add-btn" disabled={loading}>
            {loading ? 'Adding...' : 'Add EPN'}
          </button>
          <button 
            type="button" 
            className="epns-add-btn border-start" 
            onClick={handleImportClick}
            disabled={isImporting}
            title="Import from Excel"
          >
            {isImporting ? 'Importing...' : (
              <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 384 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm60.1 106.5L224 336l60.1 93.5c5.1 8-.6 18.5-10.1 18.5h-34.9c-4.4 0-8.5-2.4-10.6-6.3C208.9 405.5 192 373 192 373c-6.4 14.8-10 20-36.6 68.8-2.1 3.9-6.1 6.3-10.5 6.3H110c-9.5 0-15.2-10.5-10.1-18.5l60.3-93.5-60.3-93.5c-5.2-8 .6-18.5 10.1-18.5h34.8c4.4 0 8.5 2.4 10.6 6.3 26.1 48.8 20 33.6 36.6 68.5 0 0 6.1-11.7 36.6-68.5 2.1-3.9 6.2-6.3 10.6-6.3H274c9.5-.1 15.2 10.4 10.1 18.4zM384 121.9v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
              </svg>
            )}
          </button>
        </div>
        <input 
          ref={fileInputRef}
          accept=".xlsx,.xls" 
          className="d-none" 
          type="file"
          onChange={handleFileChange}
        />
      </div>
      {successMessage && (
        <div className="epns-success">{successMessage}</div>
      )}
      {(error || localError) && (
        <div className="epns-error">{error || localError}</div>
      )}
    </form>
  )
}