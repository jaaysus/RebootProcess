import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  fetchEpns, 
  createEpn, 
  deleteEpn, 
  selectEpns, 
  selectEpnsLoading, 
  selectEpnsError, 
  clearError 
} from '../../../../redux/slices/epnsSlice'
import EPNForm from './EPNForm'
import EPNCard from './EPNCard'
import EPNphotos from './EPNphotos'
import './EPNs.css'

export default function EPNs({ onCoordinateCavities }) {
  const dispatch = useDispatch()
  const epns = useSelector(selectEpns)
  const loading = useSelector(selectEpnsLoading)
  const sliceError = useSelector(selectEpnsError)

  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [tab, setTab] = useState('epns')

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

  const handleDelete = async (epn) => {
    if (!window.confirm('Delete this EPN?')) return
    dispatch(deleteEpn(epn.id))
  }

  return (
    <div className="epns-page">
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

          <div className="epns-grid">
            {epns.length === 0 && !loading && (
              <div className="epns-empty">No EPNs found</div>
            )}

            {epns.map(epn => (
              <EPNCard
                key={epn.id}
                epn={epn}
                onCoordinate={onCoordinateCavities}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      {tab === 'photos' && (
        <EPNphotos />
      )}
    </div>
  )
}