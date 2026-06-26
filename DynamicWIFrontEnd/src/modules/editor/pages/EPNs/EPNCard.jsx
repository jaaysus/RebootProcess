import { useState } from 'react'
import { photoUrl } from '../../../../redux/slices/epnsSlice'
import CavityRenderer from './CavityRenderer'
import './EPNs.css'

export default function EPNCard({ epn, onCoordinate, onDelete }) {
  const [imageError, setImageError] = useState(false)

  return (
    <div className="epns-card">
      <div className="card-header">
        <span className="node-name">{epn.nodeName || '------'}</span>
      </div>
      <div className="epn-bar">{epn.epn}</div>

      <div className="epns-card-image">
        {!imageError && epn.photo ? (
          <img
            src={photoUrl(epn.photo)}
            alt={epn.epn}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="epn-image-placeholder">
            <span className="placeholder-text">No image</span>
          </div>
        )}
        <CavityRenderer epn={epn} />
      </div>

      <div className="epns-card-body">
        <div className="epns-card-actions">
          <button
            className="btn primary"
            onClick={() => onCoordinate?.(epn, 'epn')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            Coordinate
            {epn.needsCoordination && (
              <svg width="14" height="14" viewBox="0 0 14 14" style={{ marginLeft: 2 }}>
                <polygon points="7,2 13,12 1,12" fill="#e67e22" />
              </svg>
            )}
          </button>
          <button className="btn danger" onClick={() => onDelete(epn)}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}