import { createPortal } from 'react-dom'

export function GroupToolbar({ position, batchSpacing, onToggleShape, onUpdateSpacing }) {
  if (!position) return null

  return createPortal(
    <div
      className="group-toolbar"
      onClick={(e) => e.stopPropagation()}
      style={{ position: 'fixed', left: position.left, top: position.top }}
    >
      <button
        className="group-toolbar__icon"
        onClick={(e) => {
          e.stopPropagation()
          onToggleShape('round')
        }}
        type="button"
        title="Round cavities"
      >
        ○
      </button>
      <button
        className="group-toolbar__icon"
        onClick={(e) => {
          e.stopPropagation()
          onToggleShape('square')
        }}
        type="button"
        title="Square cavities"
      >
        □
      </button>
      <label className="group-toolbar__control" title="Column spacing">
        <span>↔</span>
        <input
          type="range"
          min="24"
          max="180"
          value={batchSpacing.column}
          onChange={(e) => onUpdateSpacing('column', e.target.value)}
        />
      </label>
      <label className="group-toolbar__control" title="Row spacing">
        <span>↕</span>
        <input
          type="range"
          min="24"
          max="180"
          value={batchSpacing.row}
          onChange={(e) => onUpdateSpacing('row', e.target.value)}
        />
      </label>
    </div>,
    document.body
  )
}