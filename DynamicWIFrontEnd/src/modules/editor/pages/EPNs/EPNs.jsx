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
import './EPNs.css'
import EPNphotos from './EPNphotos'

export default function EPNs({ onCoordinateCavities }) {
  const dispatch = useDispatch()
  const epns = useSelector(selectEpns)
  const loading = useSelector(selectEpnsLoading)
  const sliceError = useSelector(selectEpnsError)

  const [error, setError] = useState('')
  const [tab, setTab] = useState('epns')

  useEffect(() => {
    dispatch(fetchEpns())
  }, [dispatch])

  useEffect(() => {
    if (sliceError) setError(sliceError)
  }, [sliceError])

  const handleAdd = async (formData) => {
    setError('')
    dispatch(clearError())

    const result = await dispatch(createEpn({
      epn: formData.epn.trim(),
      cavityCount: parseInt(formData.cavityCount, 10) || 0,
    }))

    return createEpn.fulfilled.match(result)
  }

  const handleDelete = async (epn) => {
    if (!window.confirm('Delete this EPN?')) return
    dispatch(deleteEpn(epn.id))
  }

  return (
    <div className="epns-page">

      <div className="epns-header">
        {/* <h1 className="epns-title">EPN Management</h1> */}

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