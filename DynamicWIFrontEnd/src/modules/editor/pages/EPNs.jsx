import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { getEPNs, addEPN, deleteEPN, findEPN, bulkAddEPNs } from './epnsStore'
import { DEFAULT_CAVITY_COLORS } from './CavityEditor/cavityEditorConstants'
import Modal from '../components/Modal'
import {
  getCavityFillStyle,
  getEmptyCheckBackground,
} from './CavityEditor/cavityEditorUtils'
import './EPNs.css'

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function getMockImageName(name) {
  return `${name}.jpg`
}

function prepareEpnForExport(epn) {
  return {
    ...epn,
    photo: getMockImageName(epn.epn),
  }
}

function createEpnObject(epnName, cavityCount, photoUrl, nodeName = '', position = '', badge = '', composite = '') {
    const count = parseInt(cavityCount, 10) || 0
    return {
      epn: epnName.trim(),
      nodeName: nodeName.trim() || epnName.trim(),
      position: position.trim(),
      badge: badge.trim(),
      composite: composite.trim(),
      photo: photoUrl || `/${epnName.trim()}.jpg`,
      cavityCount: count,
      coordinates: {
        imageWidth: 1000,
        imageHeight: 1000,
        cavities: {} // Start empty as per user request
      },
      needsCoordination: true 
    }
}

async function checkImageExists(url) {
  if (!url) return false
  if (url.startsWith('data:')) return true
  try {
    const res = await fetch(url, { method: 'HEAD' })
    // In some dev environments, HEAD might not be allowed or return 404 for missing assets properly
    // but usually it works for public assets in Vite/CRA
    return res.ok && res.headers.get('content-type')?.includes('image')
  } catch {
    return false
  }
}

export default function EPNs({ onCoordinateCavities }) {
  const [epns, setEpns] = useState(getEPNs())
  const [form, setForm] = useState({ epn: '', cavityCount: '' })
  const [error, setError] = useState('')
  const [imageErrors, setImageErrors] = useState({})
  
  // Import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [pendingEpns, setPendingEpns] = useState([])
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef(null)
  const cardImageInputRef = useRef(null)
  const [activeEpnForImage, setActiveEpnForImage] = useState(null)

  function refresh() {
    setEpns(getEPNs())
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')

    if (!form.epn.trim()) return setError('EPN is required')
    if (findEPN(form.epn.trim())) return setError('EPN already exists')

    const newEpn = createEpnObject(form.epn, form.cavityCount)
    addEPN(newEpn)

    setForm({ epn: '', cavityCount: '' })

    refresh()
  }

  async function handleImportExcel(e) {
    const file = e.target.files[0]
    if (!file) return

    setIsImporting(true)
    const isJson = file.name.toLowerCase().endsWith('.json')
    const reader = new FileReader()

    reader.onload = async (evt) => {
      try {
        let results = []
        const data = evt.target.result

        if (isJson) {
          const parsed = JSON.parse(data)
          const items = Array.isArray(parsed) ? parsed : [parsed]
          
          results = await Promise.all(items.map(async (item) => {
            if (!item.epn) return null
            const alreadyExists = findEPN(item.epn)
            const photoUrl = item.photo || `/${item.epn}.jpg`
            const imageExists = await checkImageExists(photoUrl)

            return {
              epn: item.epn,
              cavityCount: item.cavityCount || (item.coordinates?.cavities ? Object.keys(item.coordinates.cavities).length : 0),
              photo: photoUrl,
              imageExists,
              alreadyExists: !!alreadyExists,
              customImage: null,
              mappedData: item // Preserve original data
            }
          }))
        } else {
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const rows = XLSX.utils.sheet_to_json(sheet)

          results = await Promise.all(rows.map(async (row) => {
            const keys = Object.keys(row)
            const epnName = String(row.EPN || row.epn || row[keys[0]] || '').trim()
            const nodeName = String(row.NodeName || row['Node Name'] || row.PartNumber || row['Part Number'] || '').trim()
            const position = String(row.Position || row.position || row.Variant || row.variant || '').trim()
            const badge = String(row.Badge || row.badge || '').trim()
            const composite = String(row.Composite || row.composite || '').trim()
            const count = row.CavityCount || row['Cavity Count'] || row.count || row[keys[1]]
            
            if (!epnName) return null

            const alreadyExists = findEPN(epnName)
            const photoUrl = `/${epnName}.jpg`
            const imageExists = await checkImageExists(photoUrl)

            return {
              epn: epnName,
              nodeName: nodeName || epnName,
              position,
              badge,
              composite,
              cavityCount: parseInt(count, 10) || 0,
              photo: photoUrl,
              imageExists,
              alreadyExists: !!alreadyExists,
              customImage: null
            }
          }))
        }

        setPendingEpns(results.filter(r => r !== null))
        setIsImportModalOpen(true)
      } catch (err) {
        console.error('Import failed', err)
        alert('Failed to parse file')
      } finally {
        setIsImporting(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }

    if (isJson) {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }
  }

  function handlePendingImageUpload(epnName, file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setPendingEpns(prev => prev.map(p => 
        p.epn === epnName ? { ...p, customImage: e.target.result, imageExists: true } : p
      ))
    }
    reader.readAsDataURL(file)
  }

  function confirmImport() {
    const toAdd = pendingEpns
      .filter(p => !p.alreadyExists)
      .map(p => {
        if (p.mappedData) {
          return {
            ...p.mappedData,
            nodeName: p.mappedData.nodeName || p.mappedData.epn,
            photo: p.customImage || p.photo || p.mappedData.photo,
            needsCoordination: p.mappedData.needsCoordination ?? !p.mappedData.coordinates?.cavities
          }
        }
        return createEpnObject(p.epn, p.cavityCount, p.customImage || p.photo, p.nodeName, p.position, p.badge, p.composite)
      })
    
    bulkAddEPNs(toAdd)
    setIsImportModalOpen(false)
    setPendingEpns([])
    refresh()
  }

  function handleCardImageUpload(epn, file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      const list = getEPNs().map(item => 
        item.epn === epn ? { ...item, photo: dataUrl } : item
      )
      localStorage.setItem('epns-list-v1', JSON.stringify(list))
      setImageErrors(prev => ({ ...prev, [epn]: false }))
      refresh()
    }
    reader.readAsDataURL(file)
  }

  function handleDelete(epn) {
    if (window.confirm('Delete this EPN?')) {
      deleteEPN(epn)
      refresh()
    }
  }

  function handleDownloadJson() {
    downloadJson('epns.json', epns.map(prepareEpnForExport))
  }

function renderCavities(coords) {
  if (!coords) return null

  const refW = coords.imageWidth || 0
  const refH = coords.imageHeight || 0
  const usePercent = refW > 0 && refH > 0

  return Object.entries(coords.cavities)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([key, c]) => {
      const colors = DEFAULT_CAVITY_COLORS
      const segmentCount = Math.max(1, (colors || DEFAULT_CAVITY_COLORS).filter(Boolean).length)
      const baseStyle = usePercent
        ? {
            left: `${(c.x / refW) * 100}%`,
            top: `${(c.y / refH) * 100}%`,
            width: `${(c.size / refW) * 100}%`,
            height: `${(c.size / refH) * 100}%`,
          }
        : {
            left: c.x,
            top: c.y,
            width: c.size,
            height: c.size,
          }

      return (
        <div
          key={key}
          className={`cavity-dot cavity-dot--${c.shape || 'round'}`}
          style={{
            ...baseStyle,
            borderColor:
              segmentCount === 1
                ? colors[0] || '#b0b0b0'
                : colors[0] || DEFAULT_CAVITY_COLORS[0] || '#b0b0b0',
          }}
        >
          <div className="cavity-dot__clip"><div
            className={`cavity-dot__fill cavity-dot__fill--${segmentCount}`}
            style={
              c.shape === 'round'
                ? getCavityFillStyle(c)
                : segmentCount === 1
                ? colors[0]
                  ? { background: colors[0], position: 'absolute', inset: 0 }
                  : { ...getEmptyCheckBackground(Math.max(4, Math.round(c.size / 6))), position: 'absolute', inset: 0 }
                : undefined
            }
          >
            {(c.shape === 'square' ? segmentCount > 1 : false) &&
              colors.slice(0, segmentCount).map((color, segmentIndex) => (
                <div
                  key={segmentIndex}
                  className={`cavity-dot__segment cavity-dot__segment--${segmentIndex + 1} cavity-dot__segment-count--${segmentCount}`}
                  style={
                    color
                      ? { background: color }
                      : getEmptyCheckBackground(Math.max(4, Math.round(c.size / 6)))
                  }
                />
              ))}
          </div></div>
          <span className="cavity-dot__label">{key}</span>
        </div>
      )
    })
}

  return (
    <div className="epns-page">
      <div className="epns-header">
        <h1 className="epns-title">EPNs</h1>
        <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="epns-import-btn" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
              {isImporting ? 'Processing...' : 'Import Excel file'}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".xlsx, .xls, .json"
              onChange={handleImportExcel}
            />
            <button type="button" className="epns-download-btn" onClick={handleDownloadJson}>
              Download JSON
            </button>
        </div>
      </div>

      {/* FORM */}
      <form className="epns-form" onSubmit={handleAdd}>
        <input
          type="text"
          value={form.epn}
          onChange={e =>
            setForm(f => ({ ...f, epn: e.target.value }))
          }
          placeholder="Enter EPN"
          className="epns-input"
        />

        <input
          type="number"
          value={form.cavityCount}
          onChange={e =>
            setForm(f => ({ ...f, cavityCount: e.target.value }))
          }
          placeholder="Number of Cavities"
          className="epns-input"
        />

        <button type="submit" className="epns-add-btn">
          Add EPN
        </button>

        {error && <div className="epns-error">{error}</div>}
      </form>

      {/* CARDS */}
      <div className="epns-grid">
        {epns.length === 0 && (
          <div className="epns-empty">No EPNs found</div>
        )}

        {epns.map(e => (
          <div className="epns-card" key={e.epn}>
            <div className="card-header">
              <span className="node-name">{e.nodeName || "------"}</span>
            </div>
            <div className="epn-bar">{e.epn}</div>
            {e.badge && (
              <span className="badge green">
                {typeof e.badge === 'object' ? e.badge?.value || e.badge?.type : e.badge}
              </span>
            )}
            {e.composite && (
              <span className="badge yellow" style={{ top: '75px' }}>
                {e.composite}
              </span>
            )}
            
            <div className="epns-card-image">
              {!imageErrors[e.epn] && e.photo ? (
                <img 
                  src={e.photo} 
                  alt={e.epn} 
                  onError={() => setImageErrors(prev => ({ ...prev, [e.epn]: true }))}
                />
              ) : (
                <div className="epn-image-placeholder">
                  <span className="placeholder-icon">🖼️</span>
                  <span className="placeholder-text">Image not found</span>
                  <button 
                    className="btn-small" 
                    type="button"
                    onClick={() => {
                        setActiveEpnForImage(e.epn)
                        cardImageInputRef.current?.click()
                    }}
                  >
                    Set Image
                  </button>
                </div>
              )}

              {renderCavities(e.coordinates)}
            </div>

            <div className="epns-card-body">
              <div className="epns-card-actions">
                <button
                  className="btn primary"
                  onClick={() => onCoordinateCavities?.(e, 'epn')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  Coordinate
                  {e.needsCoordination && (
                    <svg width="14" height="14" viewBox="0 0 14 14" style={{ marginLeft: 2 }}>
                      <polygon points="7,2 13,12 1,12" fill="#e67e22" />
                    </svg>
                  )}
                </button>

                <button
                  className="btn danger"
                  onClick={() => handleDelete(e.epn)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Hidden input for card image upload */}
      <input 
        type="file" 
        ref={cardImageInputRef} 
        style={{ display: 'none' }} 
        accept="image/*"
        onChange={e => handleCardImageUpload(activeEpnForImage, e.target.files[0])}
      />

      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)}>
        <div className="import-modal">
          <h2 className="import-modal-title">Import EPNs</h2>
          <div className="import-list">
            {pendingEpns.map(p => (
              <div key={p.epn} className="import-row">
                <div className="import-info">
                  <strong>{p.epn}</strong>
                  <span className="import-cavity-count"> ({p.cavityCount} cavities)</span>
                </div>
                <div className="import-status">
                  {p.alreadyExists ? (
                    <span className="import-status-error">Already exists</span>
                  ) : !p.imageExists ? (
                    <div className="import-warning-box">
                      <span className="import-status-warning">⚠️ Image not found</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => handlePendingImageUpload(p.epn, e.target.files[0])}
                        id={`upload-${p.epn}`}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor={`upload-${p.epn}`} className="import-upload-label">
                        Add Image
                      </label>
                    </div>
                  ) : (
                    <span className="import-status-ok">Ready</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="import-actions">
            <button className="btn" onClick={() => setIsImportModalOpen(false)}>Cancel</button>
            <button 
              className="btn primary" 
              onClick={confirmImport}
              disabled={pendingEpns.length === 0 || !pendingEpns.some(p => !p.alreadyExists)}
            >
              Import {pendingEpns.filter(p => !p.alreadyExists).length} EPNs
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
