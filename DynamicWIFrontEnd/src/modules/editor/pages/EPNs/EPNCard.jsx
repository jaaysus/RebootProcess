import { useState } from 'react'
import { photoUrl } from '../../../../redux/slices/epnsSlice'
import CavityRenderer from './CavityRenderer'
import { Trash2, Target } from 'lucide-react'
import './EPNs.css'

export default function EPNCard({ epn, onCoordinate, onDelete }) {
  const [imageError, setImageError] = useState(false)

  return (
    <div className="epns-card">
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
        <span className="epn-node-name">
          {epn.nodeName || '------'}
        </span>
        <CavityRenderer epn={epn} />
      </div>

      <div className="epn-bottom">
        <button
          className="epn-delete-btn"
          onClick={() => onDelete(epn)}
          title="Delete EPN"
          aria-label="Delete EPN"
        >
          <Trash2 size={16} />
        </button>
        
        <button
          className="epn-coordinate-btn"
          onClick={() => onCoordinate?.(epn, 'epn')}
          title="Coordinate cavities"
          aria-label="Coordinate cavities"
        >
          <Target size={16} />
          {epn.needsCoordination && (
            <span className="needs-coord-indicator" />
          )}
        </button>
        
        <span className="epn-name">{epn.epn}</span>
      </div>
    </div>
  )
}