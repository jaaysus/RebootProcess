import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  fetchEpns, 
  createEpn, 
  deleteEpn, 
  selectEpns, 
  selectEpnsLoading, 
  selectEpnsError, 
  clearError,
  photoUrl
} from '../../../../redux/slices/epnsSlice'
import { LayoutGrid, List, Search, Target, Trash2, X } from 'lucide-react'
import EPNForm from './EPNForm'
import EPNCard from './EPNCard'
import EPNphotos from './EPNphotos'
import CavityRenderer from './CavityRenderer'
import './EPNs.css'

// ─── DeleteModal ──────────────────────────────────────────────────────────────

function DeleteModal({ epn, onConfirm, onCancel }) {
  return (
    <div className="component-modal-overlay">
      <div className="component-modal-box">
        <button className="component-modal-close" onClick={onCancel}>
          <X size={16} />
        </button>
        <div className="component-modal-icon">
          <Trash2 size={28} color="#d9534f" />
        </div>
        <h3 className="component-modal-title">Delete EPN</h3>
        <p className="component-modal-text">
          Are you sure you want to delete EPN <strong>{epn?.epn}</strong> ? 
          This action cannot be undone.
        </p>
        <div className="component-modal-actions">
          <button className="component-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="component-modal-confirm" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function EPNs({ onCoordinateCavities }) {
  const dispatch = useDispatch()
  const epns = useSelector(selectEpns)
  const loading = useSelector(selectEpnsLoading)
  const sliceError = useSelector(selectEpnsError)

  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [tab, setTab] = useState('epns')
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredEpnId, setHoveredEpnId] = useState(null)
  const [deleteEpnData, setDeleteEpnData] = useState(null)

  useEffect(() => {
    dispatch(fetchEpns())
  }, [dispatch])

  useEffect(() => {
    if (sliceError) setError(sliceError)
  }, [sliceError])

  const handleAdd = async (formData) => {
    setError('')
    setSuccessMessage('')
    dispatch(clearError())

    const result = await dispatch(createEpn({
      epn: formData.epn.trim(),
      cavityCount: parseInt(formData.cavityCount, 10) || 0,
    }))

    return createEpn.fulfilled.match(result)
  }

  const handleImport = async (rows) => {
    setError('')
    setSuccessMessage('')
    dispatch(clearError())

    let successCount = 0
    let failCount = 0

    for (const row of rows) {
      const keys = Object.keys(row)
      const epnName = String(row.EPN || row.epn || row[keys[0]] || '').trim()
      const cavityCount = row.CavityCount || row['Cavity Count'] || row.count || row[keys[1]]
      
      if (!epnName) {
        failCount++
        continue
      }

      const result = await dispatch(createEpn({
        epn: epnName,
        cavityCount: parseInt(cavityCount, 10) || 0,
      }))

      if (createEpn.fulfilled.match(result)) {
        successCount++
      } else {
        failCount++
      }
    }

    // Show success message briefly, then clear
    if (failCount === 0) {
      setSuccessMessage(`Successfully imported ${successCount} EPNs`)
      setTimeout(() => setSuccessMessage(''), 3000)
    } else if (successCount > 0) {
      setSuccessMessage(`Import completed: ${successCount} successful, ${failCount} failed`)
      setTimeout(() => setSuccessMessage(''), 5000)
    } else {
      setError(`Import failed: ${failCount} errors`)
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleDeleteClick = (epn) => {
    setDeleteEpnData(epn)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteEpnData) return
    await dispatch(deleteEpn(deleteEpnData.id))
    setDeleteEpnData(null)
  }

  const handleDeleteCancel = () => {
    setDeleteEpnData(null)
  }

  return (
    <div className="epns-page">
      {/* Delete Modal */}
      {deleteEpnData && (
        <DeleteModal 
          epn={deleteEpnData}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      <div className="epns-header">
        <div className="epns-tabs">
          <button
            className={tab === 'epns' ? 'active' : ''}
            onClick={() => setTab('epns')}
          >
            EPNs
          </button>

          <button
            className={tab === 'photos' ? 'active' : ''}
            onClick={() => setTab('photos')}
          >
            Photo Gallery
          </button>
        </div>
      </div>

      {tab === 'epns' && (
        <>
          <EPNForm 
            onSubmit={handleAdd} 
            loading={loading} 
            error={error} 
            successMessage={successMessage}
            onImport={handleImport}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ display: "flex", background: "#f0f0f0", borderRadius: "8px", padding: "4px" }}>
                <button
                  onClick={() => setViewMode("grid")}
                  style={{
                    background: viewMode === "grid" ? "#fff" : "transparent",
                    color: viewMode === "grid" ? "#111" : "#666",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    boxShadow: viewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.2s"
                  }}
                  title="Grid View"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  style={{
                    background: viewMode === "table" ? "#fff" : "transparent",
                    color: viewMode === "table" ? "#111" : "#666",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.2s"
                  }}
                  title="Table View"
                >
                  <List size={18} />
                </button>
              </div>

              {viewMode === "table" && (
                <div style={{ position: "relative" }}>
                  <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#888" }} />
                  <input
                    type="text"
                    placeholder="Search EPNs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: "8px 10px 8px 32px",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      outline: "none",
                      width: "250px"
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="epns-grid">
              {epns.length === 0 && !loading && (
                <div className="epns-empty">No EPNs found</div>
              )}
              
              {epns.map(epn => (
                <EPNCard
                  key={epn.id}
                  epn={epn}
                  onCoordinate={onCoordinateCavities}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #ddd", overflow: "visible" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f9f9f9", borderBottom: "1px solid #ddd" }}>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#444", borderTopLeftRadius: "10px" }}>Image</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#444" }}>EPN</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#444" }}>Node Name</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#444" }}>Cavity Count</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#444", textAlign: "right", borderTopRightRadius: "10px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {epns
                    .filter(epn => {
                      if (!searchQuery) return true;
                      return epn.epn.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (epn.nodeName && epn.nodeName.toLowerCase().includes(searchQuery.toLowerCase()));
                    })
                    .map((epn) => (
                    <tr key={epn.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td 
                        style={{ padding: "12px 16px", width: "100px", position: "relative" }}
                        onMouseEnter={() => setHoveredEpnId(epn.id)}
                        onMouseLeave={() => setHoveredEpnId(null)}
                      >
                        {epn.photo ? (
                          <img
                            src={photoUrl(epn.photo)}
                            alt={epn.epn}
                            style={{ width: "60px", height: "auto", borderRadius: "4px", background: "#f0f0f0", cursor: "pointer" }}
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        ) : (
                          <div style={{ width: "60px", height: "40px", background: "#eee", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#aaa" }}>No img</div>
                        )}
                        
                        {hoveredEpnId === epn.id && (
                          <div style={{
                            position: "absolute",
                            top: "50%",
                            left: "100%",
                            transform: "translateY(-50%)",
                            marginLeft: "15px",
                            width: "300px",
                            background: "#fff",
                            border: "1px solid #ddd",
                            borderRadius: "10px",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                            zIndex: 1000,
                            overflow: "hidden"
                          }}>
                            <div className="epns-card-image" style={{ width: "100%", margin: 0, position: "relative" }}>
                              {epn.photo ? (
                                <img
                                  src={photoUrl(epn.photo)}
                                  alt={epn.epn}
                                  style={{ width: "100%", height: "auto", display: "block" }}
                                />
                              ) : (
                                <div className="epn-image-placeholder">
                                  <span className="placeholder-text">No image</span>
                                </div>
                              )}
                              <CavityRenderer epn={epn} />
                            </div>
                            <div style={{ padding: "10px 14px", fontSize: "13px", fontWeight: "700", color: "#222", background: "#fafafa", borderTop: "1px solid #eee", textAlign: "center", display: "flex", justifyContent: "space-between" }}>
                              <span>{epn.epn}</span>
                              <span style={{ color: "#777", fontWeight: "500" }}>{epn.cavityCount} cavities</span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "700", color: "#222" }}>
                        {epn.epn}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#666" }}>
                        {epn.nodeName || '-'}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#666" }}>
                        {epn.cavityCount}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => onCoordinateCavities?.(epn, 'epn')}
                          title="Coordinate cavities"
                          style={{ background: "none", border: "none", color: "#444", cursor: "pointer", padding: "6px", position: "relative" }}
                        >
                          <Target size={16} />
                          {epn.needsCoordination && (
                            <span style={{ position: "absolute", top: "2px", right: "2px", width: "6px", height: "6px", background: "#d9534f", borderRadius: "50%" }} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(epn)}
                          title="Delete EPN"
                          style={{ background: "none", border: "none", color: "#d9534f", cursor: "pointer", padding: "6px", marginLeft: "4px" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {epns.filter(epn => !searchQuery || epn.epn.toLowerCase().includes(searchQuery.toLowerCase()) || (epn.nodeName && epn.nodeName.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: "24px", textAlign: "center", color: "#888" }}>
                        No EPNs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'photos' && (
        <EPNphotos />
      )}
    </div>
  )
}