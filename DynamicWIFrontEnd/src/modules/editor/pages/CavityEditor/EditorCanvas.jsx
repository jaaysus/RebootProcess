import { MIN_ZOOM, MAX_ZOOM } from './cavityEditorConstants'
import { CavityMarker } from './CavityMarker'
import { GroupToolbar } from './GroupToolbar'
import { SingleToolbar } from './SingleToolbar'

export function EditorCanvas({
  editorRef,
  editorWidth,
  editorHeight,
  isPanning,
  stageSize,
  zoom,
  panOffset,
  image,
  cavities,
  isRemoveMode,
  selectedCavityIndices,
  activeSingleSelection,
  numberedCavities,
  numberPlacement,
  numberingMode,
  onEditorMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onImageLoad,
  onCavityMouseDown,
  onRemoveCavity,
  canEditGeometry,
  canEditColors,
  onResizeMouseDown,
  groupToolbarPosition,
  batchSpacing,
  onToggleShape,
  onUpdateBatchSpacing,
  singleToolbarPosition,
  activeSingleCavity,
  onSingleShapeChange,
  onSingleSegmentCountChange,
  onSingleColorChange,
  scheduleCavityColorUpdate,
  selectedGroupBounds,
  onGroupResizeMouseDown,
  selectionBox,
  imageResolution,
  mousePosition,
  onZoomIn,
  onZoomOut,
  updateCavityNumericField,
}) {
  const toStageCavity = (cavity) => {
    if (!imageResolution?.width || !stageSize.width) return cavity
    const scaleX = imageResolution.width / stageSize.width
    const scaleY = imageResolution.height / stageSize.height
    return {
      ...cavity,
      x: cavity.x / scaleX,
      y: cavity.y / scaleY,
      size: cavity.size / scaleX,
    }
  }

  return (
    <div className="editor-shell">
      <div
        className={`editor${isPanning ? ' is-panning' : ''}`}
        ref={editorRef}
        onMouseDown={onEditorMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        <div
          className="editor-pan"
          style={{
            width: stageSize.width * zoom,
            height: stageSize.height * zoom,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          }}
        >
          <div
            className="editor-stage"
            style={{
              width: stageSize.width,
              height: stageSize.height,
              transform: `scale(${zoom})`,
            }}
          >
            <img
              src={image}
              alt="Uploaded"
              className="main-image"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onLoad={onImageLoad}
              style={{ width: stageSize.width, height: stageSize.height }}
            />

            {cavities.map((cavity, index) => (
              <CavityMarker
                key={index}
                cavity={toStageCavity(cavity)}
                index={index}
                isRemoveMode={isRemoveMode}
                isSelected={selectedCavityIndices.includes(index)}
                isActiveSingle={activeSingleSelection === index}
                cavityNumber={numberedCavities.get(index)}
                numberPlacement={numberPlacement}
                numberingMode={numberingMode}
                onMouseDown={(e) => onCavityMouseDown(e, index)}
                onRemove={onRemoveCavity}
                canResize={canEditGeometry}
                onResizeMouseDown={(e) => {
                  e.stopPropagation()
                  onResizeMouseDown(index)
                }}
                updateCavityNumericField={updateCavityNumericField}
              />
            ))}
          </div>
        </div>

        <GroupToolbar
          position={canEditGeometry ? groupToolbarPosition : null}
          batchSpacing={batchSpacing}
          onToggleShape={onToggleShape}
          onUpdateSpacing={onUpdateBatchSpacing}
        />

        <SingleToolbar
          position={singleToolbarPosition}
          cavity={activeSingleCavity}
          selectionIndex={activeSingleSelection}
          canEditShape={canEditGeometry}
          canEditColors={canEditColors}
          onShapeChange={onSingleShapeChange}
          onSegmentCountChange={onSingleSegmentCountChange}
          onColorChange={onSingleColorChange}
          scheduleColorUpdate={scheduleCavityColorUpdate}
        />

        {canEditGeometry && selectedGroupBounds && (
          <div
            className="group-resize-handle"
            style={{
              left: selectedGroupBounds.maxX * zoom + panOffset.x - 9,
              top: selectedGroupBounds.maxY * zoom + panOffset.y - 9,
            }}
            onMouseDown={onGroupResizeMouseDown}
          />
        )}

        {selectionBox && (
          <div
            className="selection-box"
            style={{
              left: selectionBox.left,
              top: selectionBox.top,
              width: selectionBox.width,
              height: selectionBox.height,
            }}
          />
        )}
      </div>

      <div className="status-chip resoxpos-chip">
        {imageResolution
          ? `Resolution: ${imageResolution.width} x ${imageResolution.height}`
          : 'Resolution: -'}
        {' | '}
        {mousePosition ? `X: ${mousePosition.x}, Y: ${mousePosition.y}` : 'X: -, Y: -'}
      </div>

      <div className="bottom-right-panel">
        <div className="zoom-controls">
          <button onClick={onZoomOut} disabled={zoom <= MIN_ZOOM} type="button">
            -
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={onZoomIn} disabled={zoom >= MAX_ZOOM} type="button">
            +
          </button>
        </div>
      </div>
    </div>
  )
}
