import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CAVITY_COLOR_OPTIONS,
  DEFAULT_CAVITY_COLORS,
  EMPTY_CHECK_COLOR_A,
  EMPTY_CHECK_COLOR_B,
} from './cavityEditorConstants'

const DARK_TEXT_CODES = new Set(['BU', 'GN', 'BN', 'BK', 'RD', 'VT'])

const getColorChipStyle = (option) =>
  option.value
    ? {
        background: option.value,
        color: DARK_TEXT_CODES.has(option.code) ? '#ffffff' : '#111111',
      }
    : {
        background: `conic-gradient(${EMPTY_CHECK_COLOR_A} 90deg, ${EMPTY_CHECK_COLOR_B} 90deg 180deg, ${EMPTY_CHECK_COLOR_A} 180deg 270deg, ${EMPTY_CHECK_COLOR_B} 270deg)`,
        backgroundSize: '10px 10px',
        color: '#111111',
      }

export function SingleToolbar({
  position,
  cavity,
  selectionIndex,
  canEditShape = true,
  canEditColors = true,
  onShapeChange,
  onSegmentCountChange,
  onColorChange,
  scheduleColorUpdate,
}) {
  const toolbarRef = useRef(null)
  const [openColorPicker, setOpenColorPicker] = useState(null)

  useEffect(() => {
    if (position && cavity) return undefined
    setOpenColorPicker(null)
    return undefined
  }, [position, cavity])

  useEffect(() => {
    if (openColorPicker === null) return undefined

    const handlePointerDown = (event) => {
      if (toolbarRef.current?.contains(event.target)) return
      setOpenColorPicker(null)
    }

    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [openColorPicker])

  if (!position || !cavity) return null

  const colors = cavity.colors || DEFAULT_CAVITY_COLORS

  return createPortal(
      <div
        ref={toolbarRef}
        className="single-toolbar"
        onClick={(e) => e.stopPropagation()}
        style={{ left: position.left, top: position.top }}
      >
      {canEditShape && (
        <>
          <button
            className={`group-toolbar__icon${cavity.shape === 'round' ? ' is-active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onShapeChange('round')
            }}
            type="button"
            title="Round cavity"
          >
            O
          </button>
          <button
            className={`group-toolbar__icon${cavity.shape === 'square' ? ' is-active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onShapeChange('square')
            }}
            type="button"
            title="Square cavity"
          >
            []
          </button>
        </>
      )}
      {canEditColors && <div className="single-toolbar__colors">
        {[0, 1, 2].map((colorIndex) => {
          const selectedValue = colors[colorIndex] ?? null
          const selectedOption =
            CAVITY_COLOR_OPTIONS.find((option) => option.value === selectedValue) ||
            CAVITY_COLOR_OPTIONS[0]
          const isOpen = openColorPicker === colorIndex

          return (
            <div key={colorIndex} className="single-toolbar__color-picker">
              <button
                className={`table-color-chip table-color-chip--trigger${isOpen ? ' is-selected' : ''}`}
                style={getColorChipStyle(selectedOption)}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenColorPicker((current) => (current === colorIndex ? null : colorIndex))
                }}
                title={`Color ${colorIndex + 1}: ${selectedOption.code}`}
                type="button"
              >
                {selectedOption.code}
              </button>
              {isOpen && (
                <div className="table-color-grid single-toolbar__color-grid">
                  {CAVITY_COLOR_OPTIONS.map((option) => {
                    const optionSelected = selectedValue === option.value

                    return (
                      <button
                        key={`${selectionIndex}-${colorIndex}-${option.code}`}
                        className={`table-color-chip${optionSelected ? ' is-selected' : ''}`}
                        style={getColorChipStyle(option)}
                        onClick={(e) => {
                          e.stopPropagation()
                          scheduleColorUpdate(`single-${selectionIndex}-${colorIndex}`, () => {
                            if (colorIndex > 0) onSegmentCountChange(colorIndex + 1)
                            onColorChange(colorIndex, option.value)
                          })
                          setOpenColorPicker(null)
                        }}
                        title={option.code}
                        type="button"
                      >
                        {option.code}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>}
    </div>,
    document.body
  )
}
