import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_CAVITY_COLORS,
  EMPTY_CHECK_COLOR_A,
  EMPTY_CHECK_COLOR_B,
} from './cavityEditorConstants'
import { getCavityFillStyle, getEmptyCheckBackground } from './cavityEditorUtils'

export function CavityMarker({
  cavity,
  index,
  isRemoveMode,
  isSelected,
  isActiveSingle,
  cavityNumber,
  numberPlacement,
  numberingMode,
  onMouseDown,
  onRemove,
  canResize = true,
  onResizeMouseDown,
  updateCavityNumericField,
}) {
  const [isEditingNumber, setIsEditingNumber] = useState(false)
  const [editValue, setEditValue] = useState(cavityNumber?.toString() ?? '')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditingNumber) {
      setEditValue(cavityNumber?.toString() ?? '')
    }
  }, [isEditingNumber, cavityNumber])

  useEffect(() => {
    if (isEditingNumber && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingNumber])

  const handleNumberClick = (event) => {
    if (numberingMode !== 'manual') return
    event.stopPropagation()
    setIsEditingNumber(true)
  }

  const commitNumber = () => {
    setIsEditingNumber(false)
    updateCavityNumericField(index, 'number', editValue)
  }

  const handleNumberChange = (event) => {
    const nextValue = event.target.value.replace(/\D/g, '')
    setEditValue(nextValue)
  }

  const handleNumberKeyDown = (event) => {
    if (event.key === 'Enter') {
      commitNumber()
      return
    }
    if (event.key === 'Escape') {
      setIsEditingNumber(false)
    }
  }
  const colors = cavity.colors || DEFAULT_CAVITY_COLORS
  const effectiveSegmentCount = Math.max(1, colors.filter(Boolean).length)

  return (
    <div
      className={[
        'cavity',
        `cavity--${cavity.shape}`,
        isRemoveMode ? 'remove-mode' : '',
        isSelected ? 'is-selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseDown={onMouseDown}
      style={{
        width: cavity.size,
        height: cavity.size,
        left: cavity.x - cavity.size / 2,
        top: cavity.y - cavity.size / 2,
        borderColor:
          effectiveSegmentCount === 1
            ? colors[0] || '#b0b0b0'
            : colors[0],
      }}
    >
      <div
        className={`cavity-fill cavity-fill--${effectiveSegmentCount}`}
        style={
          cavity.shape === 'round'
            ? getCavityFillStyle(cavity)
            : effectiveSegmentCount === 1
            ? colors[0]
              ? {
                  background: colors[0],
                  position: 'absolute',
                  inset: 0,
                }
              : {
                  ...getEmptyCheckBackground(Math.max(6, Math.round(cavity.size / 6))),
                  position: 'absolute',
                  inset: 0,
                }
            : undefined
        }
      >
        {cavity.shape === 'square' &&
          effectiveSegmentCount > 1 &&
          colors
            .slice(0, effectiveSegmentCount)
            .map((color, segmentIndex) => (
              <div
                key={segmentIndex}
                className={`cavity-fill__segment cavity-fill__segment--${segmentIndex + 1} cavity-fill__segment-count--${effectiveSegmentCount}`}
                style={
                  color
                    ? { background: color }
                    : getEmptyCheckBackground(Math.max(6, Math.round(cavity.size / 6)))
                }
              />
            ))}
      </div>

      {isRemoveMode && (
        <button
          className="remove-cavity"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(index)
          }}
          type="button"
        >
          x
        </button>
      )}

      {!isRemoveMode && isActiveSingle && canResize && (
        <div
          className="resize-handle"
          onMouseDown={onResizeMouseDown}
        />
      )}

      <span
        className={`cavity-number cavity-number--${numberPlacement}`}
        style={{ pointerEvents: numberingMode === 'manual' ? 'auto' : 'none' }}
        onClick={handleNumberClick}
      >
        {isEditingNumber ? (
          <input
            ref={inputRef}
            className="cavity-number-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={editValue}
            onChange={handleNumberChange}
            onBlur={commitNumber}
            onKeyDown={handleNumberKeyDown}
          />
        ) : (
          cavityNumber
        )}
      </span>
    </div>
  )
}
