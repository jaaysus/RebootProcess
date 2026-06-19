import { clamp } from './cavityEditorUtils'

export function EditorToolbar({
  fileInputRef,
  image,
  editorMode,
  canEditGeometry,
  cavityShape,
  setCavityShape,
  batchLayout,
  updateBatchLayout,
  batchCount,
  setBatchCount,
  addCavities,
  isRemoveMode,
  setIsRemoveMode,
  cavities,
  downloadImage,
  numberingMode,
  setNumberingMode,
  numberingOrder,
  setNumberingOrder,
  numberPlacement,
  setNumberPlacement,
  saveStatus,
  handleSaveCoordinates,
  handleUrlSubmit,
  epnInfo,
}) {
  const saveLabel =
    editorMode === 'connector'
      ? saveStatus === 'saved'
        ? 'Saved Colors'
        : saveStatus === 'error'
        ? 'Check connector & cavities'
        : 'Save Colors'
      : saveStatus === 'saved'
      ? 'Saved'
      : saveStatus === 'error'
      ? 'Check EPN & cavities'
      : 'Save Coordinates'

  return (
    <div className="toolbar">
      {canEditGeometry && (
        <button
          onClick={() => {
            const url = prompt('Enter new Image URL:', image)
            if (url) handleUrlSubmit(url)
          }}
          type="button"
        >
          Change Image URL
        </button>
      )}

      {canEditGeometry && (
        <div className="toolbar-cluster">
          <span className="toolbar-label">Shape</span>
          <button
            className={cavityShape === 'round' ? 'toolbar-toggle active' : 'toolbar-toggle'}
            onClick={() => setCavityShape('round')}
            type="button"
          >
            Round
          </button>
          <button
            className={cavityShape === 'square' ? 'toolbar-toggle active' : 'toolbar-toggle'}
            onClick={() => setCavityShape('square')}
            type="button"
          >
            Square
          </button>
        </div>
      )}

      {canEditGeometry && (
        <div className="toolbar-cluster">
          <span className="toolbar-label">Layout</span>
          <button
            className={batchLayout === 'paired' ? 'toolbar-toggle active' : 'toolbar-toggle'}
            onClick={() => updateBatchLayout('paired')}
            type="button"
          >
            Pair
          </button>
          <button
            className={batchLayout === 'horizontal' ? 'toolbar-toggle active' : 'toolbar-toggle'}
            onClick={() => updateBatchLayout('horizontal')}
            type="button"
          >
            Horizontal
          </button>
          <button
            className={batchLayout === 'vertical' ? 'toolbar-toggle active' : 'toolbar-toggle'}
            onClick={() => updateBatchLayout('vertical')}
            type="button"
          >
            Vertical
          </button>
        </div>
      )}

      {canEditGeometry && (
        <div className="toolbar-cluster">
          <span className="toolbar-label">Count</span>
          <input
            type="number"
            min="1"
            max="200"
            value={batchCount}
            onChange={(e) => setBatchCount(clamp(Number(e.target.value) || 1, 1, 200))}
          />
          <button onClick={addCavities} disabled={!image} type="button">
            Add
          </button>
        </div>
      )}

      {canEditGeometry && (
        <div className="toolbar-cluster">
          <span className="toolbar-label">Numbering</span>
          <button
            className={numberingMode === 'automatic' ? 'toolbar-toggle active' : 'toolbar-toggle'}
            onClick={() => setNumberingMode('automatic')}
            type="button"
            title="Automatic numbering"
          >
            Auto
          </button>
          <button
            className={numberingMode === 'manual' ? 'toolbar-toggle active' : 'toolbar-toggle'}
            onClick={() => setNumberingMode('manual')}
            type="button"
            title="Manual numbering"
          >
            Manual
          </button>
          <button
            className={numberingOrder === 'ltr-down' ? 'toolbar-toggle active' : 'toolbar-toggle'}
            onClick={() => setNumberingOrder('ltr-down')}
            type="button"
            title="Left to Right, Top to Bottom"
            disabled={numberingMode === 'manual'}
          >
            RD
          </button>
          <button
            className={numberingOrder === 'ltr-up' ? 'toolbar-toggle active' : 'toolbar-toggle'}
            onClick={() => setNumberingOrder('ltr-up')}
            type="button"
            title="Left to Right, Bottom to Top"
            disabled={numberingMode === 'manual'}
          >
            RU
          </button>
          <button
            className={numberingOrder === 'rtl-down' ? 'toolbar-toggle active' : 'toolbar-toggle'}
            onClick={() => setNumberingOrder('rtl-down')}
            type="button"
            title="Right to Left, Top to Bottom"
            disabled={numberingMode === 'manual'}
          >
            LD
          </button>
          <button
            className={numberingOrder === 'rtl-up' ? 'toolbar-toggle active' : 'toolbar-toggle'}
            onClick={() => setNumberingOrder('rtl-up')}
            type="button"
            title="Right to Left, Bottom to Top"
            disabled={numberingMode === 'manual'}
          >
            LU
          </button>
        </div>
      )}

      {canEditGeometry && (
        <button
          className={isRemoveMode ? 'danger-button active' : 'danger-button'}
          onClick={() => setIsRemoveMode((current) => !current)}
          disabled={!image || (!isRemoveMode && cavities.length === 0)}
          type="button"
        >
          {isRemoveMode ? 'Done Removing' : 'Remove'}
        </button>
      )}

      <button onClick={downloadImage} disabled={!image} type="button">
        Download
      </button>

      {canEditGeometry && (
        <div className="toolbar-cluster">
          <span className="toolbar-label">Label</span>
          <button
            className={numberPlacement === 'outward' ? 'toolbar-toggle active' : 'toolbar-toggle'}
            onClick={() => setNumberPlacement('outward')}
            type="button"
            title="Number outside cavity"
          >
            Out
          </button>
          <button
            className={numberPlacement === 'inward' ? 'toolbar-toggle active' : 'toolbar-toggle'}
            onClick={() => setNumberPlacement('inward')}
            type="button"
            title="Number inside cavity"
          >
            In
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleSaveCoordinates}
        disabled={cavities.length === 0 || !epnInfo.epn.trim()}
        style={{
          background: saveStatus === 'saved' ? '#d1fae5' : saveStatus === 'error' ? '#fee2e2' : undefined,
          color: saveStatus === 'saved' ? '#065f46' : saveStatus === 'error' ? '#991b1b' : undefined,
          fontWeight: 700,
          transition: 'background 0.3s, color 0.3s',
        }}
      >
        {saveLabel}
      </button>
    </div>
  )
}
