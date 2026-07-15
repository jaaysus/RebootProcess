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

export function EpnPanel({
  epnInfo,
  setEpnInfo,
  cavities,
  numberedCavities,
  numberingMode,
  updateCavityNumericField,
  updateCavityShape,
  onShapeChangeAtIndex,
  onShapeChange,
  updateCavityColors,
  scheduleCavityColorUpdate,
  canEditGeometry = true,
  canEditColors = true,
}) {
  const menuRef = useRef(null)
  const [openColorPicker, setOpenColorPicker] = useState(null)

  useEffect(() => {
    if (!openColorPicker) return undefined

    const handlePointerDown = (event) => {
      if (menuRef.current?.contains(event.target)) return
      if (event.target.closest('.table-color-chip--trigger')) return
      setOpenColorPicker(null)
    }

    const handleViewportChange = () => setOpenColorPicker(null)

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [openColorPicker])

  const activeCavity = openColorPicker ? cavities[openColorPicker.index] : null
  const activeSelectedValue =
    activeCavity && openColorPicker
      ? (activeCavity.colors || DEFAULT_CAVITY_COLORS)[openColorPicker.colorIndex] ?? null
      : null
  return (
    <section className="epn-panel">
      <div className="epn-form">
        <label className="epn-form__field">
          <span>Epn</span>
          <input
            type="text"
            value={epnInfo.epn}
            disabled={!canEditGeometry}
            onChange={(e) => setEpnInfo((current) => ({ ...current, epn: e.target.value }))}
            placeholder="Epn"
          />
        </label>
        <label className="epn-form__field">
          <span>Cavity Count</span>
          <input
            type="number"
            value={epnInfo.cavityCount || ''}
            disabled={!canEditGeometry}
            onChange={(e) => setEpnInfo((current) => ({ ...current, cavityCount: e.target.value }))}
            placeholder="Cavity Count"
          />
        </label>
      </div>

      <div className="cavity-table-wrap">
        <table className="cavity-table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Position</th>
              <th>Type</th>
              <th>Size</th>
              {canEditColors && (
                <>
                  <th>Color 1</th>
                  <th>Color 2</th>
                  <th>Color 3</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {cavities.length === 0 ? (
              <tr>
                <td colSpan={canEditColors ? 7 : 4} className="cavity-table__empty">
                  No cavities added yet.
                </td>
              </tr>
            ) : (
              cavities.map((cavity, index) => (
                <tr key={index}>
                  <td>
                    {numberingMode === 'manual' ? (
                      <input
                        type="number"
                        min="1"
                        value={cavity.manualNumber ?? numberedCavities.get(index) ?? index + 1}
                        disabled={!canEditGeometry}
                        onChange={(e) => updateCavityNumericField(index, 'number', e.target.value)}
                      />
                    ) : (
                      numberedCavities.get(index)
                    )}
                  </td>
                  <td>
                    <div className="table-number-group">
                      <input
                        type="number"
                        value={Math.round(cavity.x)}
                        disabled={!canEditGeometry}
                        onChange={(e) => updateCavityNumericField(index, 'x', e.target.value)}
                      />
                      <input
                        type="number"
                        value={Math.round(cavity.y)}
                        disabled={!canEditGeometry}
                        onChange={(e) => updateCavityNumericField(index, 'y', e.target.value)}
                      />
                    </div>
                  </td>
                  <td>
                    <div className="table-shape-toggle">
                      <button
                        className={`group-toolbar__icon${cavity.shape === 'round' ? ' is-active' : ''}`}
                        disabled={!canEditGeometry}
                        onClick={() => onShapeChangeAtIndex(index, 'round')}
                        title="Round cavity"
                        type="button"
                      >
                        O
                      </button>
                      <button
                        className={`group-toolbar__icon${cavity.shape === 'square' ? ' is-active' : ''}`}
                        disabled={!canEditGeometry}
                        onClick={() => onShapeChangeAtIndex(index, 'square')}
                        title="Square cavity"
                        type="button"
                      >
                        []
                      </button>
                    </div>
                  </td>
                  <td>
                    <input
                      className="table-size-input"
                      type="number"
                      value={Math.round(cavity.size)}
                      disabled={!canEditGeometry}
                      onChange={(e) => updateCavityNumericField(index, 'size', e.target.value)}
                    />
                  </td>
                  {canEditColors && [0, 1, 2].map((colorIndex) => (
                    <td key={colorIndex}>
                      <div className="table-color-picker">
                        {(() => {
                          const selectedValue =
                            (cavity.colors || DEFAULT_CAVITY_COLORS)[colorIndex] ?? null
                          const selectedOption =
                            CAVITY_COLOR_OPTIONS.find((option) => option.value === selectedValue) ||
                            CAVITY_COLOR_OPTIONS[0]
                          const pickerKey = `${index}-${colorIndex}`
                          const isOpen = openColorPicker?.key === pickerKey

                          return (
                            <>
                              <button
                                className={`table-color-chip table-color-chip--trigger${isOpen ? ' is-selected' : ''}`}
                                style={getColorChipStyle(selectedOption)}
                                onClick={(event) => {
                                  const rect = event.currentTarget.getBoundingClientRect()

                                  setOpenColorPicker((current) =>
                                    current?.key === pickerKey
                                      ? null
                                      : {
                                          key: pickerKey,
                                          index,
                                          colorIndex,
                                          top: rect.bottom + 6,
                                          left: Math.min(
                                            rect.left,
                                            Math.max(12, window.innerWidth - 174)
                                          ),
                                        }
                                  )
                                }}
                                title={selectedOption.code}
                                type="button"
                              >
                                {selectedOption.code}
                              </button>
                            </>
                          )
                        })()}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {canEditColors &&
        openColorPicker &&
        activeCavity &&
        createPortal(
          <div
            ref={menuRef}
            className="table-color-grid table-color-grid--portal"
            style={{ top: openColorPicker.top, left: openColorPicker.left }}
          >
            {CAVITY_COLOR_OPTIONS.map((option) => {
              const isSelected = activeSelectedValue === option.value

              return (
                <button
                  key={`${openColorPicker.key}-${option.code}`}
                  className={`table-color-chip${isSelected ? ' is-selected' : ''}`}
                  style={getColorChipStyle(option)}
                  onClick={() => {
                    scheduleCavityColorUpdate(
                      `table-${openColorPicker.index}-${openColorPicker.colorIndex}`,
                      () =>
                        updateCavityColors(
                          openColorPicker.index,
                          (nextColors) => {
                            nextColors[openColorPicker.colorIndex] = option.value

                            if (
                              openColorPicker.colorIndex === 0 &&
                              nextColors.filter(Boolean).length <= 1
                            ) {
                              nextColors[1] = option.value
                              nextColors[2] = option.value
                            }

                            return nextColors
                          }
                        )
                    )
                    setOpenColorPicker(null)
                  }}
                  title={option.code}
                  type="button"
                >
                  {option.code}
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </section>
  )
}
