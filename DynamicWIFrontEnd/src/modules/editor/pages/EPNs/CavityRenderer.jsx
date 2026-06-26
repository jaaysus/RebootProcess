import { DEFAULT_CAVITY_COLORS } from '../CavityEditor/cavityEditorConstants'
import {
  getCavityFillStyle,
  getEmptyCheckBackground,
} from '../CavityEditor/cavityEditorUtils'
import './EPNs.css'

export default function CavityRenderer({ epn }) {
  const coords = epn.coordinates
  const cavities = coords?.cavities ?? epn.cavities

  if (!cavities || Object.keys(cavities).length === 0) return null

  const refW = epn.photoWidth || coords?.imageWidth || 0
  const refH = epn.photoHeight || coords?.imageHeight || 0
  const usePercent = refW > 0 && refH > 0

  return Object.entries(cavities)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([key, cavity]) => {
      const colors = DEFAULT_CAVITY_COLORS
      const segmentCount = Math.max(1, colors.filter(Boolean).length)
      
      const baseStyle = usePercent
        ? {
            left: `${(cavity.x / refW) * 100}%`,
            top: `${(cavity.y / refH) * 100}%`,
            width: `${(cavity.size / refW) * 100}%`,
            height: `${(cavity.size / refH) * 100}%`,
          }
        : { 
            left: cavity.x, 
            top: cavity.y, 
            width: cavity.size, 
            height: cavity.size 
          }

      return (
        <div
          key={key}
          className={`cavity-dot cavity-dot--${cavity.shape || 'round'}`}
          style={{
            ...baseStyle,
            borderColor: getBorderColor(colors, segmentCount),
          }}
        >
          <div className="cavity-dot__clip">
            <div
              className={`cavity-dot__fill cavity-dot__fill--${segmentCount}`}
              style={getFillStyle(cavity, colors, segmentCount)}
            >
              {renderSegments(cavity, colors, segmentCount)}
            </div>
          </div>
          <span className="cavity-dot__label">{key}</span>
        </div>
      )
    })
}

// Helper functions
function getBorderColor(colors, segmentCount) {
  return segmentCount === 1 
    ? colors[0] || '#b0b0b0'
    : colors[0] || '#b0b0b0'
}

function getFillStyle(cavity, colors, segmentCount) {
  if (cavity.shape === 'round') {
    return getCavityFillStyle(cavity)
  }
  
  if (segmentCount === 1) {
    return colors[0] 
      ? { background: colors[0], position: 'absolute', inset: 0 }
      : { 
          ...getEmptyCheckBackground(Math.max(4, Math.round(cavity.size / 6))), 
          position: 'absolute', 
          inset: 0 
        }
  }
  
  return undefined
}

function renderSegments(cavity, colors, segmentCount) {
  if (cavity.shape !== 'square' || segmentCount <= 1) return null

  return colors.slice(0, segmentCount).map((color, segmentIndex) => (
    <div
      key={segmentIndex}
      className={`cavity-dot__segment cavity-dot__segment--${segmentIndex + 1} cavity-dot__segment-count--${segmentCount}`}
      style={
        color 
          ? { background: color }
          : getEmptyCheckBackground(Math.max(4, Math.round(cavity.size / 6)))
      }
    />
  ))
}