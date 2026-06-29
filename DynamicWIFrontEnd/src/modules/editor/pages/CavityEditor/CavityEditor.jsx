import './cavityEditor.css'
import { EditorCanvas } from './EditorCanvas'
import { EditorToolbar } from './EditorToolbar'
import { EpnPanel } from './EpnPanel'
import { useCavityEditor } from './useCavityEditor'

export function CavityEditor(props) {
  const editor = useCavityEditor({
    ...props,
    preloadEpnId: props.preloadEpnId
  })

  return (
    <div className="workspace-grid">
      <div className="workspace-main">
        <EditorToolbar
          fileInputRef={editor.fileInputRef}
          image={editor.image}
          editorMode={editor.editorMode}
          canEditGeometry={editor.canEditGeometry}
          cavityShape={editor.cavityShape}
          setCavityShape={editor.setCavityShape}
          batchLayout={editor.batchLayout}
          updateBatchLayout={editor.updateBatchLayout}
          batchCount={editor.batchCount}
          setBatchCount={editor.setBatchCount}
          addCavities={editor.addCavities}
          isRemoveMode={editor.isRemoveMode}
          setIsRemoveMode={editor.setIsRemoveMode}
          cavities={editor.cavities}
          downloadImage={editor.downloadImage}
          numberingMode={editor.numberingMode}
          setNumberingMode={editor.setNumberingMode}
          numberingOrder={editor.numberingOrder}
          setNumberingOrder={editor.setNumberingOrder}
          numberPlacement={editor.numberPlacement}
          setNumberPlacement={editor.setNumberPlacement}
          saveStatus={editor.saveStatus}
          handleSaveCoordinates={editor.handleSaveCoordinates}
          handleUrlSubmit={editor.handleUrlSubmit}
          epnInfo={editor.epnInfo}
        />

        <EditorCanvas
          editorRef={editor.editorRef}
          editorWidth={editor.stageSize.width}
          editorHeight={editor.stageSize.height}
          isPanning={editor.isPanning}
          stageSize={editor.stageSize}
          zoom={editor.zoom}
          panOffset={editor.panOffset}
          image={editor.image}
          cavities={editor.cavities}
          isRemoveMode={editor.isRemoveMode}
          selectedCavityIndices={editor.selectedCavityIndices}
          activeSingleSelection={editor.activeSingleSelection}
          numberedCavities={editor.numberedCavities}
          numberPlacement={editor.numberPlacement}
          numberingMode={editor.numberingMode}
          onEditorMouseDown={editor.handleEditorMouseDown}
          onMouseMove={editor.handleMouseMove}
          onMouseUp={editor.stopActions}
          onMouseLeave={editor.handleMouseLeave}
          onImageLoad={editor.handleImageLoad}
          onCavityMouseDown={editor.handleCavityMouseDown}
          onRemoveCavity={editor.removeCavity}
          canEditGeometry={editor.canEditGeometry}
          canEditColors={editor.canEditColors}
          onResizeMouseDown={(index) => {
            editor.startResizing(index)
          }}
          groupToolbarPosition={editor.groupToolbarPosition}
          batchSpacing={editor.batchSpacing}
          onToggleShape={editor.toggleSelectedShape}
          onUpdateBatchSpacing={editor.updateBatchSpacing}
          singleToolbarPosition={editor.singleToolbarPosition}
          activeSingleCavity={editor.activeSingleCavity}
          onSingleShapeChange={editor.updateSingleShape}
          onSingleSegmentCountChange={editor.updateSingleSegmentCount}
          onSingleColorChange={editor.updateSingleColor}
          scheduleCavityColorUpdate={editor.scheduleCavityColorUpdate}
          selectedGroupBounds={editor.selectedGroupBounds}
          onGroupResizeMouseDown={editor.handleGroupResizeMouseDown}
          selectionBox={editor.selectionBox}
          imageResolution={editor.imageResolution}
          mousePosition={editor.mousePosition}
          onZoomIn={editor.zoomIn}
          onZoomOut={editor.zoomOut}
          updateCavityNumericField={editor.updateCavityNumericField}
        />
      </div>

      <EpnPanel
        epnInfo={editor.epnInfo}
        setEpnInfo={editor.setEpnInfo}
        cavities={editor.cavities}
        numberedCavities={editor.numberedCavities}
        numberingMode={editor.numberingMode}
        updateCavityNumericField={editor.updateCavityNumericField}
        onShapeChangeAtIndex={editor.updateCavityShapeAtIndex}
        updateCavityColors={editor.updateCavityColors}
        scheduleCavityColorUpdate={editor.scheduleCavityColorUpdate}
        canEditGeometry={editor.canEditGeometry}
        canEditColors={editor.canEditColors}
      />
    </div>
  )
}

export default CavityEditor
