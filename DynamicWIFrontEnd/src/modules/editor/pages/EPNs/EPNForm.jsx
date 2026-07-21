import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Upload, X } from 'lucide-react'

function extractEpnFields(row) {
  const keys = Object.keys(row)
  const epn = String(row.EPN || row.epn || row[keys[0]] || '').trim()
  const cavityCountRaw = row.CavityCount ?? row['Cavity Count'] ?? row.count ?? row[keys[1]]
  const cavityCount = parseInt(cavityCountRaw, 10)
  return {
    epn,
    cavityCount: Number.isNaN(cavityCount) ? 0 : cavityCount,
  }
}

// ─── Import Preview Modal ───────────────────────────────────────────────────

function EPNImportPreviewModal({
  rows,
  rowStatuses,
  onProceed,
  onCancel,
  uploading,
  progress, // { done, total }
}) {
  const validRows     = rows.filter(r => r.valid)
  const invalidRows   = rows.filter(r => !r.valid)
  const duplicateRows = validRows.filter(r => r.duplicate)
  const newRows       = validRows.filter(r => !r.duplicate)
  const toImport      = newRows
  const isDone        = uploading === false && progress.total > 0 && progress.done === progress.total

  const succeededCount = Object.values(rowStatuses).filter(s => s?.status === 'done').length
  const failedCount    = Object.values(rowStatuses).filter(s => s?.status === 'failed').length

  const statusIcon = (row) => {
    const st = rowStatuses[row.id]
    if (!st) {
      // idle state
      if (!row.valid)    return <AlertTriangle size={14} color="#d9534f" />
      if (row.duplicate) return <AlertTriangle size={14} color="#e6a817" />
      return <CheckCircle size={14} color="#16a34a" />
    }
    
    if (st.status === 'uploading') return <span className="upv-row-spinner" />
    if (st.status === 'done')      return <CheckCircle size={14} color="#16a34a" />
    if (st.status === 'failed')    return <XCircle size={14} color="#d9534f" />
    if (st.status === 'skipped')   return <span className="upv-row-skip-icon">—</span>
    return <AlertTriangle size={14} color="#d9534f" />
  }

  const rowClass = (row) => {
    const st = rowStatuses[row.id]
    if (!st) {
      if (!row.valid)    return 'upv-row upv-row--failed'
      if (row.duplicate) return 'upv-row upv-row--dup'
      return 'upv-row'
    }
    
    if (st.status === 'uploading') return 'upv-row upv-row--uploading'
    if (st.status === 'done')      return 'upv-row upv-row--done'
    if (st.status === 'failed')    return 'upv-row upv-row--failed'
    if (st.status === 'skipped')   return 'upv-row upv-row--skipped'
    return 'upv-row'
  }

  const getStatusText = (row) => {
    const st = rowStatuses[row.id]
    if (!st) {
      if (row.duplicate) return 'exists'
      if (!row.valid) return 'invalid'
      return ''
    }
    
    if (st.status === 'failed') return st.message || 'failed'
    if (st.status === 'skipped') return st.message || 'skipped'
    if (st.status === 'done') return 'imported'
    if (st.status === 'uploading') return 'uploading...'
    return ''
  }

  const getTagClass = (row) => {
    const st = rowStatuses[row.id]
    if (!st) {
      if (row.duplicate) return 'upv-row-tag'
      if (!row.valid) return 'upv-row-tag upv-row-tag--fail'
      return ''
    }
    
    if (st.status === 'failed') return 'upv-row-tag upv-row-tag--fail'
    if (st.status === 'skipped') return 'upv-row-tag upv-row-tag--skip'
    if (st.status === 'done') return 'upv-row-tag upv-row-tag--success'
    return ''
  }

  return (
    <div className="component-modal-overlay">
      <div className="upv-modal">

        {/* ── Header ── */}
        <div className="upv-header">
          <div className="upv-header-left">
            <FileSpreadsheet size={18} />
            <span>Import Preview</span>
          </div>
          <button className="component-modal-close upv-close" onClick={onCancel} disabled={false}>
            <X size={16} />
          </button>
        </div>

        {/* ── Summary row ── */}
        <div className="upv-summary">
          <span className="upv-badge upv-badge--new">
            <CheckCircle size={12} /> {newRows.length} new
          </span>
          {duplicateRows.length > 0 && (
            <span className="upv-badge upv-badge--dup">
              <AlertTriangle size={12} /> {duplicateRows.length} exist (skipped)
            </span>
          )}
          {invalidRows.length > 0 && (
            <span className="upv-badge upv-badge--batch">
              {invalidRows.length} invalid
            </span>
          )}
          <span className="upv-badge upv-badge--total">{rows.length} total</span>
        </div>

        {/* ── Progress bar (shown while uploading / once result is back) ── */}
        {(uploading || (progress.total > 0 && isDone)) && (
          <div className="upv-progress-wrap">
            <div className="upv-progress-track">
              <div
                className="upv-progress-fill"
                style={{ width: `${uploading ? 100 : Math.round((progress.done / progress.total) * 100)}%` }}
              />
            </div>
            <span className="upv-progress-label">
              {isDone
                ? `Done — ${succeededCount} imported${failedCount ? `, ${failedCount} failed` : ''}`
                : `Importing ${toImport.length} EPN${toImport.length !== 1 ? 's' : ''}…`}
            </span>
          </div>
        )}

        {/* ── Row list ── */}
        <ul className="upv-list">
          {rows.map((row) => {
            const statusText = getStatusText(row)
            const tagClass = getTagClass(row)
            
            return (
              <li key={row.id} className={rowClass(row)}>
                <span className="upv-row-icon">{statusIcon(row)}</span>
                <span className="upv-row-name" title={row.epn || 'Missing EPN'}>
                  {row.epn || <em>Missing EPN</em>}
                </span>
                <span className="upv-row-size">
                  {row.valid ? `${row.cavityCount} cavities` : '-'}
                </span>
                {statusText && (
                  <span className={tagClass}>{statusText}</span>
                )}
              </li>
            )
          })}
        </ul>

        {/* ── Actions ── */}
        <div className="upv-actions">
          {isDone ? (
            <button className="upv-btn-proceed" onClick={onCancel}>
              <CheckCircle size={14} /> Close
            </button>
          ) : (
            <>
              <button className="component-modal-cancel" onClick={onCancel} disabled={false}>
                Cancel
              </button>
              <button
                className="upv-btn-proceed"
                onClick={onProceed}
                disabled={uploading || toImport.length === 0}
              >
                {uploading ? (
                  <><span className="upv-spinner" /> Importing…</>
                ) : (
                  <><Upload size={14} /> Import {toImport.length} EPN{toImport.length !== 1 ? 's' : ''}</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── EPNForm ─────────────────────────────────────────────────────────────────

export default function EPNForm({
  onSubmit,
  loading,
  error,
  successMessage,
  onImportFile,     // async (file) => ({ totalRows, created, skipped, errors, rows }) | null on failure
  onImportStart,     // () => void, called once before the import request is sent
  onImportComplete,  // (successCount, failCount) => void
  existingEpns = [], // array of existing EPN strings, for duplicate preview only
}) {
  const [form, setForm] = useState({ epn: '', cavityCount: '' })
  const [localError, setLocalError] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const fileInputRef = useRef(null)

  const [pendingRows, setPendingRows] = useState(null)
  const [pendingFile, setPendingFile] = useState(null) // the raw File, sent to the backend as-is
  const [rowStatuses, setRowStatuses] = useState({})
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')

    if (!form.epn.trim()) {
      setLocalError('EPN is required')
      return
    }

    // Single add still goes through createEpn (via onSubmit -> handleAdd)
    const success = await onSubmit(form)
    if (success) {
      setForm({ epn: '', cavityCount: '' })
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsParsing(true)
    const reader = new FileReader()

    reader.onload = (evt) => {
      try {
        const data = evt.target.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rawRows = XLSX.utils.sheet_to_json(sheet)

        const existingLower = new Set(existingEpns.map(n => n.toLowerCase()))

        // This parse is ONLY for the preview list (counts / duplicate hints).
        // The actual import sends the original file to the backend, which
        // re-parses and creates rows itself.
        const parsedRows = rawRows.map((row, i) => {
          const { epn, cavityCount } = extractEpnFields(row)
          return {
            id: i, // matches (backend Row number - 2), since data starts at Excel row 2
            epn,
            cavityCount,
            valid: !!epn,
            duplicate: !!epn && existingLower.has(epn.toLowerCase()),
          }
        })

        setPendingRows(parsedRows)
        setPendingFile(file)
        setRowStatuses({})
      } catch (err) {
        console.error('Import failed', err)
        setLocalError('Failed to parse Excel file')
      } finally {
        setIsParsing(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }

    reader.readAsBinaryString(file)
  }

  const handleProceed = async () => {
    if (!pendingFile || !pendingRows) return

    onImportStart?.()
    setUploading(true)
    setProgress({ done: 0, total: pendingRows.filter(r => r.valid && !r.duplicate).length })

    // Mark invalid rows as skipped right away for a responsive UI
    const initialStatuses = {}
    pendingRows.forEach(r => {
      if (!r.valid) initialStatuses[r.id] = { status: 'skipped', message: 'Invalid row' }
    })
    setRowStatuses(initialStatuses)

    const result = await onImportFile(pendingFile)

    if (result) {
      // Map backend row results (1-based Excel row, header = row 1) back onto
      // our preview rows (0-based id, since sheet_to_json starts at row 2).
      const statusByRowId = {}
      result.rows.forEach(r => {
        statusByRowId[r.row - 2] = { 
          status: r.status, 
          message: r.message || null 
        }
      })

      const finalStatuses = {}
      pendingRows.forEach(r => {
        if (!r.valid) {
          finalStatuses[r.id] = { status: 'skipped', message: 'Invalid row' }
          return
        }
        const st = statusByRowId[r.id]
        if (st) {
          if (st.status === 'created') finalStatuses[r.id] = { status: 'done', message: null }
          else if (st.status === 'skipped') finalStatuses[r.id] = { status: 'skipped', message: st.message }
          else if (st.status === 'error') finalStatuses[r.id] = { status: 'failed', message: st.message }
          else finalStatuses[r.id] = { status: 'skipped', message: 'Unknown status' }
        } else {
          finalStatuses[r.id] = { status: 'skipped', message: 'Not processed' }
        }
      })

      setRowStatuses(finalStatuses)
      setProgress({ done: result.totalRows, total: result.totalRows })
      onImportComplete?.(result.created, result.errors)
    } else {
      // Request itself failed (network/server error) — mark everything failed
      const finalStatuses = {}
      pendingRows.forEach(r => {
        finalStatuses[r.id] = { 
          status: r.valid ? 'failed' : 'skipped',
          message: r.valid ? 'Import failed' : 'Invalid row'
        }
      })
      setRowStatuses(finalStatuses)
      onImportComplete?.(0, pendingRows.filter(r => r.valid).length)
    }

    setUploading(false)
  }

  const handleCancelModal = () => {
    setPendingRows(null)
    setPendingFile(null)
    setRowStatuses({})
    setUploading(false)
    setProgress({ done: 0, total: 0 })
  }

  return (
    <>
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
              disabled={isParsing}
              title="Import from Excel"
            >
              {isParsing ? 'Reading...' : (
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 384 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
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
      </form>

      {pendingRows && (
        <EPNImportPreviewModal
          rows={pendingRows}
          rowStatuses={rowStatuses}
          onProceed={handleProceed}
          onCancel={handleCancelModal}
          uploading={uploading}
          progress={progress}
        />
      )}
    </>
  )
}