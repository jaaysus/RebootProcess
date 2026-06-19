import { useEffect, useMemo, useRef, useState } from 'react'
import { updateEPN } from '../epnsStore'
import { updateConnector } from '../connectorsStore'
import {
  DEFAULT_CAVITY_COLORS,
  DEFAULT_CAVITY_SIZE,
  DEFAULT_COLUMN_SPACING,
  DEFAULT_ROW_SPACING,
  MAX_UPLOAD_WIDTH,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_STEP,
} from './cavityEditorConstants'
import { downloadImageWithCavities } from './cavityEditorExport'
import {
  clamp,
  clampPanOffset,
  computeNumberedCavities,
  coordinateMapToCavities,
  fitImageToStage,
  getSelectionBounds,
  inferLayoutFromSelection,
  inferSpacingFromSelection,
  sortIndicesForEpnLayout,
} from './cavityEditorUtils'

export function useCavityEditor({
  fileInputRef,
  preloadImage,
  preloadEpn,
  preloadConnector,
  preloadCoordinates,
  editorMode = 'full',
  onSaved,
}) {
  const hasAppliedInitialPreloadRef = useRef(false)
  const canEditGeometry = editorMode !== 'connector'
  const canEditColors = editorMode !== 'epn'

  const getScale = () => {
    if (!imageResolution || !stageSize.width || !stageSize.height) {
      return { scaleX: 1, scaleY: 1 }
    }

    return {
      scaleX: imageResolution.width / stageSize.width,
      scaleY: imageResolution.height / stageSize.height,
    }
  }

  const toStage = (x, y) => {
    const { scaleX, scaleY } = getScale()
    return {
      x: x / scaleX,
      y: y / scaleY,
    }
  }

  const toImage = (x, y) => {
    const { scaleX, scaleY } = getScale()
    return {
      x: x * scaleX,
      y: y * scaleY,
    }
  }



  const [image, setImage] = useState(preloadImage || null)
  const [cavities, setCavities] = useState([])
  const [zoom, setZoom] = useState(1)
  const [stageSize, setStageSize] = useState({ width: 1000, height: 700 })
  const [imageNaturalSize, setImageNaturalSize] = useState(null)
  const [imageResolution, setImageResolution] = useState(null)
  const [mousePosition, setMousePosition] = useState(null)
  const [isRemoveMode, setIsRemoveMode] = useState(false)
  const [selectedCavityIndices, setSelectedCavityIndices] = useState([])
  const [draggingSelection, setDraggingSelection] = useState(null)
  const [resizingCavityIndex, setResizingIndex] = useState(null)
  const [groupResizeState, setGroupResizeState] = useState(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [panStart, setPanStart] = useState(null)
  const [selectionBox, setSelectionBox] = useState(null)
  const [selectionStart, setSelectionStart] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [cavityShape, setCavityShape] = useState('round')
  const [batchCount, setBatchCount] = useState(2)
  const [batchLayout, setBatchLayout] = useState('paired')
  const [batchSpacing, setBatchSpacing] = useState({
    column: DEFAULT_COLUMN_SPACING,
    row: DEFAULT_ROW_SPACING,
  })
  const [epnInfo, setEpnInfo] = useState({
    name: '',
    epn: preloadEpn || '',
    connector: preloadConnector || '',
  })
  const [numberingMode, setNumberingMode] = useState('automatic')
  const [numberingOrder, setNumberingOrder] = useState('ltr-down')
  const [numberPlacement, setNumberPlacement] = useState('outward')
  const [saveStatus, setSaveStatus] = useState(null)

  const historyRef = useRef([])
  const clipboardRef = useRef([])

  const pushHistory = () => {
    historyRef.current.push(JSON.stringify(cavities))
    if (historyRef.current.length > 50) historyRef.current.shift()
  }

  const undo = () => {
    if (historyRef.current.length === 0) return
    const last = JSON.parse(historyRef.current.pop())
    setCavities(last)
    setSelectedCavityIndices([])
  }

  const copySelectedCavities = () => {
    const selected = selectedCavityIndices.map((idx) => cavities[idx]).filter(Boolean)
    if (selected.length > 0) {
      clipboardRef.current = JSON.parse(JSON.stringify(selected))
    }
  }

  const pasteCavities = () => {
    if (!canEditGeometry || clipboardRef.current.length === 0) return
    pushHistory()

    const OFFSET = 30
    const pasted = clipboardRef.current.map((c) => ({
      ...c,
      x: c.x + OFFSET,
      y: c.y + OFFSET,
    }))

    const startIndex = cavities.length
    setCavities([...cavities, ...pasted])
    setSelectedCavityIndices(pasted.map((_, i) => startIndex + i))
  }

  const deleteSelectedCavities = () => {
    if (!canEditGeometry || selectedCavityIndices.length === 0) return
    pushHistory()
    const nextCavities = cavities.filter((_, idx) => !selectedCavityIndices.includes(idx))
    setCavities(nextCavities)
    setSelectedCavityIndices([])
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      const isCtrl = e.ctrlKey || e.metaKey

      if (isCtrl && e.key.toLowerCase() === 'c') {
        copySelectedCavities()
      } else if (isCtrl && e.key.toLowerCase() === 'v') {
        pasteCavities()
      } else if (isCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
      } else if (isCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSaveCoordinates()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedCavities()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cavities, selectedCavityIndices, canEditGeometry])

  useEffect(() => {
    if (!hasAppliedInitialPreloadRef.current) {
      hasAppliedInitialPreloadRef.current = true
      return
    }

    resetEditorState()
    setImage(preloadImage || null)
    setEpnInfo((info) => ({
      ...info,
      epn: preloadEpn || '',
      connector: preloadConnector || '',
    }))
  }, [preloadImage, preloadEpn, preloadConnector, editorMode])

  useEffect(() => {
    if (!preloadCoordinates || typeof preloadCoordinates !== 'object') return
    if (!Object.keys(preloadCoordinates).length) return
    const w = imageNaturalSize?.width
    const h = imageNaturalSize?.height
    if (!w || !h) return
    const nextCavities = coordinateMapToCavities(preloadCoordinates, w, h)

    setCavities(
      canEditColors
        ? nextCavities
        : nextCavities.map((cavity) => ({
            ...cavity,
            colors: [...DEFAULT_CAVITY_COLORS],
          }))
    )
  }, [preloadCoordinates, imageNaturalSize, canEditColors])

  useEffect(() => {
    if (!image || imageResolution?.width) return

    let cancelled = false
    const img = new Image()

    img.onload = () => {
      if (cancelled) return

      const nextNaturalSize = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      }

      setImageNaturalSize(nextNaturalSize)
      setImageResolution(nextNaturalSize)
      setStageSize(fitImageToStage(img.naturalWidth, img.naturalHeight))
      setPanOffset({ x: 0, y: 0 })
    }

    img.src = image

    return () => {
      cancelled = true
    }
  }, [image, imageResolution?.width])

  const editorRef = useRef(null)
  const colorCommitTimeoutsRef = useRef(new Map())

  const activeSingleSelection =
    selectedCavityIndices.length === 1 ? selectedCavityIndices[0] : null
  const hasGroupSelection = selectedCavityIndices.length > 1
  const activeSingleCavity = activeSingleSelection !== null ? cavities[activeSingleSelection] : null

  const autoNumberedCavities = useMemo(
    () => computeNumberedCavities(cavities, numberingOrder),
    [cavities, numberingOrder]
  )

  const numberedCavities = useMemo(() => {
    if (numberingMode === 'manual') {
      return new Map(
        cavities.map((cavity, index) => {
          const manual = Number(cavity.manualNumber)
          return [
            index,
            !Number.isNaN(manual) && manual > 0
              ? manual
              : autoNumberedCavities.get(index) ?? index + 1,
          ]
        })
      )
    }

    return autoNumberedCavities
  }, [cavities, numberingMode, autoNumberedCavities])

  useEffect(() => {
    if (numberingMode !== 'manual') return
    if (!cavities.length) return

    setCavities((current) =>
      current.map((cavity, index) => {
        const hasManual =
          cavity.manualNumber !== undefined && cavity.manualNumber !== ''
        if (hasManual) return cavity
        return {
          ...cavity,
          manualNumber: autoNumberedCavities.get(index) ?? index + 1,
        }
      })
    )
  }, [numberingMode, cavities.length, autoNumberedCavities])

  const selectedGroupBounds = useMemo(() => {
    if (!hasGroupSelection || !imageResolution?.width || !stageSize.width) return null
    const b = getSelectionBounds(selectedCavityIndices, cavities)
    if (!b) return null
    const { scaleX, scaleY } = getScale()
    return {
      minX: b.minX / scaleX,
      maxX: b.maxX / scaleX,
      minY: b.minY / scaleY,
      maxY: b.maxY / scaleY,
    }
  }, [cavities, hasGroupSelection, selectedCavityIndices, imageResolution, stageSize])

  const singleToolbarPosition = useMemo(() => {
    if (activeSingleSelection === null || !activeSingleCavity || !imageResolution?.width || !stageSize.width) {
      return null
    }

    const editorRect = editorRef.current?.getBoundingClientRect()
    const { scaleX, scaleY } = getScale()
    const sx = activeSingleCavity.x / scaleX
    const sy = activeSingleCavity.y / scaleY
    const half = activeSingleCavity.size / (2 * scaleX)
    const left = sx - half
    const top = sy - half

    return {
      left: clamp(
        (editorRect?.left ?? 0) + left * zoom + panOffset.x - 120,
        16,
        window.innerWidth - 240
      ),
      top: clamp(
        (editorRect?.top ?? 0) + top * zoom + panOffset.y - 70,
        16,
        window.innerHeight - 100
      ),
    }
  }, [
    activeSingleCavity,
    activeSingleSelection,
    imageResolution,
    panOffset.x,
    panOffset.y,
    stageSize,
    zoom,
  ])

  const groupToolbarPosition = useMemo(() => {
    if (!hasGroupSelection || !imageResolution?.width || !stageSize.width) return null

    const editorRect = editorRef.current?.getBoundingClientRect()
    const { scaleX, scaleY } = getScale()
    const selected = selectedCavityIndices.map((index) => cavities[index]).filter(Boolean)

    if (selected.length < 2) return null

    const left = Math.min(
      ...selected.map((cavity) => cavity.x / scaleX - cavity.size / (2 * scaleX))
    )
    const top = Math.min(
      ...selected.map((cavity) => cavity.y / scaleY - cavity.size / (2 * scaleX))
    )

    return {
      left: clamp(
        (editorRect?.left ?? 0) + left * zoom + panOffset.x,
        16,
        window.innerWidth - 220
      ),
      top: clamp(
        (editorRect?.top ?? 0) + top * zoom + panOffset.y - 62,
        16,
        window.innerHeight - 100
      ),
    }
  }, [cavities, hasGroupSelection, imageResolution, panOffset.x, panOffset.y, selectedCavityIndices, stageSize, zoom])

  useEffect(() => {
    if (!imageNaturalSize) return

    const updateStageSize = () => {
      setStageSize(fitImageToStage(imageNaturalSize.width, imageNaturalSize.height))
    }

    updateStageSize()
    window.addEventListener('resize', updateStageSize)

    return () => {
      window.removeEventListener('resize', updateStageSize)
    }
  }, [imageNaturalSize])

  useEffect(() => {
    if (!editorRef.current) return
    const rect = editorRef.current.getBoundingClientRect()
    setPanOffset((current) => clampPanOffset(current, zoom, stageSize, rect))
  }, [zoom, stageSize])

  useEffect(() => {
    if (selectedCavityIndices.length > 1 && imageResolution?.width && stageSize.width) {
      const scaleX = imageResolution.width / stageSize.width
      const scaleY = imageResolution.height / stageSize.height
      const inferred = inferSpacingFromSelection(selectedCavityIndices, cavities)
      setBatchSpacing({
        column: Math.max(24, Math.round(inferred.column / scaleX)),
        row: Math.max(24, Math.round(inferred.row / scaleY)),
      })
      setBatchLayout(inferLayoutFromSelection(selectedCavityIndices, cavities))
    }
  }, [selectedCavityIndices, cavities, imageResolution, stageSize])

  useEffect(() => {
    return () => {
      colorCommitTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      colorCommitTimeoutsRef.current.clear()
    }
  }, [])

  const getPointerPosition = (e) => {
    const rect = editorRef.current.getBoundingClientRect()
    const viewportX = e.clientX - rect.left
    const viewportY = e.clientY - rect.top
    const mouseX = clamp((viewportX - panOffset.x) / zoom, 0, stageSize.width)
    const mouseY = clamp((viewportY - panOffset.y) / zoom, 0, stageSize.height)

    return { mouseX, mouseY, viewportX, viewportY }
  }

  const resetEditorState = () => {
    setCavities([])
    setZoom(1)
    setMousePosition(null)
    setIsRemoveMode(false)
    setSelectedCavityIndices([])
    setPanOffset({ x: 0, y: 0 })
    setPanStart(null)
    setIsPanning(false)
    setDraggingSelection(null)
    setSelectionBox(null)
    setSelectionStart(null)
    setResizingIndex(null)
    setGroupResizeState(null)
    setImageNaturalSize(null)
    setImageResolution(null)
    setSaveStatus(null)
  }

  const prepareImageForUpload = (source) =>
    new Promise((resolve, reject) => {
      const img = new Image()

      img.onload = () => {
        if (img.naturalWidth <= MAX_UPLOAD_WIDTH) {
          resolve(source)
          return
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const scale = MAX_UPLOAD_WIDTH / img.naturalWidth
        const targetWidth = Math.round(img.naturalWidth * scale)
        const targetHeight = Math.round(img.naturalHeight * scale)

        if (!ctx) {
          resolve(source)
          return
        }

        canvas.width = targetWidth
        canvas.height = targetHeight
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

        resolve(canvas.toDataURL('image/png'))
      }

      img.onerror = () => reject(new Error('Failed to process uploaded image.'))
      img.src = source
    })

  const loadFile = async (file) => {
    if (!file) return

    const reader = new FileReader()

    reader.onload = async () => {
      try {
        resetEditorState()
        const preparedImage = await prepareImageForUpload(reader.result)
        setImage(preparedImage)
      } catch (error) {
        console.error(error)
        setImage(reader.result)
      }
    }

    reader.readAsDataURL(file)
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    await loadFile(file)
    e.target.value = ''
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    await loadFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target
    setImageNaturalSize({ width: naturalWidth, height: naturalHeight })
    setImageResolution({ width: naturalWidth, height: naturalHeight })
    const nextStage = fitImageToStage(naturalWidth, naturalHeight)
    setStageSize(nextStage)

    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect()
      setPanOffset({
        x: (rect.width - nextStage.width) / 2,
        y: (rect.height - nextStage.height) / 2,
      })
    } else {
      setPanOffset({ x: 0, y: 0 })
    }
  }

  useEffect(() => {
    if (!fileInputRef?.current) return
    const el = fileInputRef.current
    el.addEventListener('change', handleUpload)
    return () => el.removeEventListener('change', handleUpload)
  }, [fileInputRef])

  const createCavity = (x, y, shape = cavityShape, customSize = null) => {
    const { scaleX, scaleY } = getScale()
    const size = customSize || DEFAULT_CAVITY_SIZE * scaleX
    const radius = size / 2

    // Ensure the cavity is fully within the image resolution bounds
    const safeX = clamp(x * scaleX, radius, (imageResolution?.width || 0) - radius)
    const safeY = clamp(y * scaleY, radius, (imageResolution?.height || 0) - radius)

    return {
      x: safeX,
      y: safeY,
      shape,
      colors: [...DEFAULT_CAVITY_COLORS],
      size,
    }
  }

  const layoutBatchSequence = (count, shape = cavityShape, layout = batchLayout) => {
    const safeCount = clamp(Number(count) || 1, 1, 200)
    const { scaleX } = getScale()
    
    // Dynamic size and spacing adjustment
    let currentCavitySize = DEFAULT_CAVITY_SIZE * scaleX
    let currentSpacing = { ...batchSpacing }
    
    const PADDING = 72 // Minimum total padding (36 on each side)
    const availableW = stageSize.width - PADDING
    const availableH = stageSize.height - PADDING

    if (layout === 'horizontal') {
      const requiredSpan = (safeCount - 1) * currentSpacing.column + (currentCavitySize / scaleX)
      if (requiredSpan > availableW) {
        const factor = availableW / requiredSpan
        currentCavitySize *= factor
        currentSpacing.column *= factor
      }
      
      const horizontalSpan = (safeCount - 1) * currentSpacing.column
      const startX = stageSize.width / 2 - horizontalSpan / 2
      const y = stageSize.height / 2

      return Array.from({ length: safeCount }, (_, index) =>
        createCavity(startX + index * currentSpacing.column, y, shape, currentCavitySize)
      )
    }

    if (layout === 'vertical') {
      const requiredSpan = (safeCount - 1) * currentSpacing.row + (currentCavitySize / scaleX)
      if (requiredSpan > availableH) {
        const factor = availableH / requiredSpan
        currentCavitySize *= factor
        currentSpacing.row *= factor
      }
      
      const x = stageSize.width / 2
      const verticalSpan = (safeCount - 1) * currentSpacing.row
      const startY = stageSize.height / 2 - verticalSpan / 2

      return Array.from({ length: safeCount }, (_, index) =>
        createCavity(x, startY + index * currentSpacing.row, shape, currentCavitySize)
      )
    }

    // Paired layout
    const columns = Math.ceil(safeCount / 2)
    const requiredW = (columns - 1) * currentSpacing.column + (currentCavitySize / scaleX)
    const requiredH = currentSpacing.row + (currentCavitySize / scaleX)
    
    if (requiredW > availableW || requiredH > availableH) {
      const factorW = availableW / requiredW
      const factorH = availableH / requiredH
      const factor = Math.min(factorW, factorH)
      currentCavitySize *= factor
      currentSpacing.column *= factor
      currentSpacing.row *= factor
    }

    const horizontalSpan = (columns - 1) * currentSpacing.column
    const startX = stageSize.width / 2 - horizontalSpan / 2
    const startY = stageSize.height / 2 - currentSpacing.row / 2

    return Array.from({ length: safeCount }, (_, index) => {
      const columnIndex = Math.floor(index / 2)
      const rowIndex = index % 2

      return createCavity(
        startX + columnIndex * currentSpacing.column,
        startY + rowIndex * currentSpacing.row,
        shape,
        currentCavitySize
      )
    })
  }

  const addCavities = () => {
    if (!canEditGeometry) return
    pushHistory()
    const nextCavities = layoutBatchSequence(batchCount, cavityShape, batchLayout)
    const startIndex = cavities.length

    setCavities([...cavities, ...nextCavities])
    setSelectedCavityIndices(nextCavities.map((_, index) => startIndex + index))
  }

  const removeCavity = (indexToRemove) => {
    if (!canEditGeometry) return
    pushHistory()
    setCavities(cavities.filter((_, index) => index !== indexToRemove))
    setSelectedCavityIndices((current) =>
      current
        .filter((index) => index !== indexToRemove)
        .map((index) => (index > indexToRemove ? index - 1 : index))
    )
  }

  const repositionSelection = (indices, nextSpacing = batchSpacing, layout = batchLayout) => {
    const bounds = getSelectionBounds(indices, cavities)
    if (!bounds || !imageResolution?.width || !stageSize.width) return

    const scaleX = imageResolution.width / stageSize.width
    const scaleY = imageResolution.height / stageSize.height
    const colDeltaImage = nextSpacing.column * scaleX
    const rowDeltaImage = nextSpacing.row * scaleY

    const sorted = sortIndicesForEpnLayout(indices, cavities)
    const imgW = imageResolution.width
    const imgH = imageResolution.height

    setCavities((current) => {
      const updated = [...current]

      sorted.forEach((index, itemIndex) => {
        const cavity = updated[index]
        if (!cavity) return

        const radius = cavity.size / 2
        let nextX = bounds.minX + radius
        let nextY = bounds.minY + radius

        if (layout === 'horizontal') {
          nextX = bounds.minX + radius + itemIndex * colDeltaImage
        } else if (layout === 'vertical') {
          nextY = bounds.minY + radius + itemIndex * rowDeltaImage
        } else {
          const columnIndex = Math.floor(itemIndex / 2)
          const rowIndex = itemIndex % 2
          nextX = bounds.minX + radius + columnIndex * colDeltaImage
          nextY = bounds.minY + radius + rowIndex * rowDeltaImage
        }

        updated[index] = {
          ...cavity,
          x: clamp(nextX, radius, imgW - radius),
          y: clamp(nextY, radius, imgH - radius),
        }
      })

      return updated
    })
  }

  const updateBatchSpacing = (key, value) => {
    if (!canEditGeometry) return
    pushHistory()
    const nextSpacing = { ...batchSpacing, [key]: Number(value) }
    setBatchSpacing(nextSpacing)
    if (selectedCavityIndices.length > 1) {
      repositionSelection(selectedCavityIndices, nextSpacing, batchLayout)
    }
  }

  const updateBatchLayout = (layout) => {
    if (!canEditGeometry) return
    pushHistory()
    setBatchLayout(layout)
    if (selectedCavityIndices.length > 1) {
      repositionSelection(selectedCavityIndices, batchSpacing, layout)
    }
  }

  const toggleSelectedShape = (shape) => {
    if (!canEditGeometry) return
    pushHistory()
    if (selectedCavityIndices.length === 0) {
      setCavityShape(shape)
      return
    }

    setCavities((current) =>
      current.map((cavity, index) =>
        selectedCavityIndices.includes(index) ? { ...cavity, shape } : cavity
      )
    )
  }

  const updateCavityColors = (index, updater) => {
    if (!canEditColors) return
    pushHistory()
    setCavities((current) =>
      current.map((cavity, cavityIndex) => {
        if (cavityIndex !== index) return cavity
        const nextColors = updater([...(cavity.colors || DEFAULT_CAVITY_COLORS)])
        return { ...cavity, colors: nextColors }
      })
    )
  }

  const scheduleCavityColorUpdate = (key, callback) => {
    if (!canEditColors) return
    const existingTimeout = colorCommitTimeoutsRef.current.get(key)
    if (existingTimeout) window.clearTimeout(existingTimeout)

    const timeoutId = window.setTimeout(() => {
      pushHistory()
      callback()
      colorCommitTimeoutsRef.current.delete(key)
    }, 120)

    colorCommitTimeoutsRef.current.set(key, timeoutId)
  }

  const updateCavityNumericField = (index, field, value) => {
    if (!canEditGeometry) return
    if (!imageResolution?.width || !stageSize.width) return
    pushHistory()

    if (field === 'number') {
      const nextValue = value === '' ? '' : Number(value)
      if (value !== '' && Number.isNaN(nextValue)) return

      setCavities((current) =>
        current.map((cavity, cavityIndex) => {
          if (cavityIndex !== index) return cavity
          return {
            ...cavity,
            manualNumber: nextValue === '' ? '' : Math.max(1, nextValue),
          }
        })
      )
      return
    }

    const nextValue = Number(value)
    if (Number.isNaN(nextValue)) return

    const scaleX = imageResolution.width / stageSize.width
    const minSizeImage = 20 * scaleX

    setCavities((current) =>
      current.map((cavity, cavityIndex) => {
        if (cavityIndex !== index) return cavity

        if (field === 'size') {
          const maxRadius = Math.min(
            cavity.x,
            cavity.y,
            imageResolution.width - cavity.x,
            imageResolution.height - cavity.y
          )
          return { ...cavity, size: clamp(nextValue, minSizeImage, maxRadius * 2) }
        }

        const radius = cavity.size / 2
        return {
          ...cavity,
          [field]: clamp(
            nextValue,
            radius,
            field === 'x' ? imageResolution.width - radius : imageResolution.height - radius
          ),
        }
      })
    )
  }

  const updateSingleCavity = (updater) => {
    if (activeSingleSelection === null) return
    setCavities((current) =>
      current.map((cavity, index) =>
        index === activeSingleSelection ? updater(cavity) : cavity
      )
    )
  }

  const updateSingleShape = (shape) => {
    if (!canEditGeometry) return
    pushHistory()
    updateSingleCavity((cavity) => ({ ...cavity, shape }))
  }

  const updateCavityShapeAtIndex = (index, shape) => {
    if (!canEditGeometry) return
    pushHistory()

    setCavities((current) =>
      current.map((cavity, i) =>
        i === index ? { ...cavity, shape } : cavity
      )
    )
  }

  const updateSingleColor = (colorIndex, value) => {
    if (!canEditColors) return
    pushHistory()
    updateSingleCavity((cavity) => {
      const nextColors = [...(cavity.colors || DEFAULT_CAVITY_COLORS)]
      nextColors[colorIndex] = value

      if (colorIndex === 0 && nextColors.filter(Boolean).length <= 1) {
        nextColors[1] = value
        nextColors[2] = value
      }

      return { ...cavity, colors: nextColors }
    })
  }

const handleSaveCoordinates = () => {
  const epnKey = epnInfo.epn.trim()
  if (!epnKey) { setSaveStatus('error'); return }
  if (cavities.length === 0) { setSaveStatus('error'); return }
  if (!imageResolution?.width) { setSaveStatus('error'); return }
  if (editorMode === 'connector' && !epnInfo.connector.trim()) { setSaveStatus('error'); return }

  const cavityEntries = {}
  numberedCavities.forEach((number, index) => {
    const cavity = cavities[index]
    if (cavity) {
      const entry = {
        x: Math.round(cavity.x),
        y: Math.round(cavity.y),
        size: Math.round(cavity.size),
        shape: cavity.shape,
      }

      if (canEditColors) {
        entry.colors = cavity.colors || DEFAULT_CAVITY_COLORS
      }

      cavityEntries[number] = entry
    }
  })

  const coordinates = {
    imageWidth: imageResolution.width,
    imageHeight: imageResolution.height,
    cavities: cavityEntries,
  }

  const updatePayload = { coordinates, photo: image }

  if (editorMode === 'connector') {
    updateConnector(epnInfo.connector.trim(), updatePayload)
  } else {
    updateEPN(epnKey, { ...updatePayload, needsCoordination: false })
  }

  setSaveStatus('saved')
  setTimeout(() => setSaveStatus(null), 2500)
  onSaved?.()
}

  const handleMouseMove = (e) => {
    if (!image) return

    const { mouseX, mouseY, viewportX, viewportY } = getPointerPosition(e)
    setMousePosition({ x: Math.round(mouseX), y: Math.round(mouseY) })

    if (draggingSelection) {
      const { scaleX, scaleY } = getScale()
      const dx = mouseX - draggingSelection.pointerX
      const dy = mouseY - draggingSelection.pointerY

      let minDx = -Infinity
      let maxDx = Infinity
      let minDy = -Infinity
      let maxDy = Infinity

      draggingSelection.items.forEach(({ cavity }) => {
        const radius = cavity.size / 2
        const sx = cavity.x / scaleX
        const sy = cavity.y / scaleY
        const rStage = radius / scaleX
        minDx = Math.max(minDx, rStage - sx)
        maxDx = Math.min(maxDx, stageSize.width - rStage - sx)
        minDy = Math.max(minDy, rStage - sy)
        maxDy = Math.min(maxDy, stageSize.height - rStage - sy)
      })

      const safeDx = clamp(dx, minDx, maxDx)
      const safeDy = clamp(dy, minDy, maxDy)

      setCavities((current) => {
        const updated = [...current]
        draggingSelection.items.forEach(({ index, cavity }) => {
          updated[index] = {
            ...cavity,
            x: cavity.x + safeDx * scaleX,
            y: cavity.y + safeDy * scaleY,
          }
        })
        return updated
      })
      return
    }

    if (resizingCavityIndex !== null) {
      setCavities((current) => {
        const updated = [...current]
        const cavity = updated[resizingCavityIndex]
        if (!cavity || !imageResolution?.width) return current

        const { scaleX, scaleY } = getScale()
        const sx = cavity.x / scaleX
        const sy = cavity.y / scaleY
        const dx = mouseX - sx
        const dy = mouseY - sy
        const distance = Math.sqrt(dx * dx + dy * dy)
        const maxRadius = Math.min(
          cavity.x,
          cavity.y,
          imageResolution.width - cavity.x,
          imageResolution.height - cavity.y
        )
        const minSizeImage = 20 * scaleX

        updated[resizingCavityIndex] = {
          ...cavity,
          size: clamp(distance * 2 * scaleX, minSizeImage, maxRadius * 2),
        }
        return updated
      })
      return
    }

    if (groupResizeState) {
      if (!imageResolution?.width) return

      const scaleX = imageResolution.width / stageSize.width
      const dx = mouseX - groupResizeState.pointerX
      const dy = mouseY - groupResizeState.pointerY
      const delta = Math.max(dx, dy) * 0.5

      setCavities((current) => {
        const updated = [...current]
        const minSizeImage = 20 * scaleX
        groupResizeState.items.forEach(({ index, cavity }) => {
          const maxRadius = Math.min(
            cavity.x,
            cavity.y,
            imageResolution.width - cavity.x,
            imageResolution.height - cavity.y
          )

          updated[index] = {
            ...cavity,
            size: clamp(cavity.size + delta * 2 * scaleX, minSizeImage, maxRadius * 2),
          }
        })
        return updated
      })
      return
    }

    if (isPanning && panStart) {
      const nextOffset = {
        x: panStart.originX + (e.clientX - panStart.pointerX),
        y: panStart.originY + (e.clientY - panStart.pointerY),
      }
      const rect = editorRef.current?.getBoundingClientRect()
      setPanOffset(clampPanOffset(nextOffset, zoom, stageSize, rect))
      return
    }

    if (selectionStart) {
      const left = Math.min(selectionStart.viewportX, viewportX)
      const top = Math.min(selectionStart.viewportY, viewportY)
      const width = Math.abs(viewportX - selectionStart.viewportX)
      const height = Math.abs(viewportY - selectionStart.viewportY)

      setSelectionBox({ left, top, width, height })

      if (!imageResolution?.width || !stageSize.width) {
        return
      }

      const scaleX = imageResolution.width / stageSize.width
      const scaleY = imageResolution.height / stageSize.height

      const selected = cavities.reduce((indices, cavity, index) => {
        const stageX = cavity.x / scaleX
        const stageY = cavity.y / scaleY
        const stageSizePx = cavity.size / scaleX
        const cavityLeft = stageX * zoom + panOffset.x - (stageSizePx * zoom) / 2
        const cavityTop = stageY * zoom + panOffset.y - (stageSizePx * zoom) / 2
        const cavitySize = stageSizePx * zoom
        const intersects =
          cavityLeft < left + width &&
          cavityLeft + cavitySize > left &&
          cavityTop < top + height &&
          cavityTop + cavitySize > top

        if (intersects) indices.push(index)
        return indices
      }, [])

      setSelectedCavityIndices(selected)
    }
  }

  const stopActions = () => {
    setDraggingSelection(null)
    setResizingIndex(null)
    setGroupResizeState(null)
    setIsPanning(false)
    setPanStart(null)
    setSelectionStart(null)
    setSelectionBox(null)
  }

  const handleMouseLeave = () => {
    setMousePosition(null)
    stopActions()
  }

  const handleEditorMouseDown = (e) => {
    const isImageSurface = e.currentTarget.contains(e.target)
    if (!isImageSurface) return
    if (e.target.closest('.group-toolbar') || e.target.closest('.single-toolbar')) return

    // Always allow deselecting
    setSelectedCavityIndices([])

    if (e.shiftKey) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({
        pointerX: e.clientX,
        pointerY: e.clientY,
        originX: panOffset.x,
        originY: panOffset.y,
      })
      return
    }

    if (!canEditGeometry) return

    const { viewportX, viewportY } = getPointerPosition(e)
    setSelectionStart({ viewportX, viewportY })
    setSelectionBox({ left: viewportX, top: viewportY, width: 0, height: 0 })
  }

  const handleCavityMouseDown = (e, index) => {
    e.stopPropagation()

    if (isRemoveMode) {
      setSelectedCavityIndices([index])
      return
    }

    const nextSelection = selectedCavityIndices.includes(index)
      ? selectedCavityIndices
      : [index]

    setSelectedCavityIndices(nextSelection)
    if (!canEditGeometry) return
    pushHistory()

    const { mouseX, mouseY } = getPointerPosition(e)

    setDraggingSelection({
      pointerX: mouseX,
      pointerY: mouseY,
      items: nextSelection.map((selectedIndex) => ({
        index: selectedIndex,
        cavity: cavities[selectedIndex],
      })),
    })
  }

  const handleGroupResizeMouseDown = (e) => {
    if (!canEditGeometry) return
    pushHistory()
    e.stopPropagation()
    const { mouseX, mouseY } = getPointerPosition(e)
    setGroupResizeState({
      pointerX: mouseX,
      pointerY: mouseY,
      items: selectedCavityIndices.map((index) => ({
        index,
        cavity: cavities[index],
      })),
    })
  }

  const startResizing = (index) => {
    if (!canEditGeometry) return
    pushHistory()
    setSelectedCavityIndices([index])
    setResizingIndex(index)
  }

  const zoomIn = () => setZoom((current) => clamp(current + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))
  const zoomOut = () => setZoom((current) => clamp(current - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))

  const downloadImage = () => {
    downloadImageWithCavities({ image, imageResolution, cavities })
  }

  const handleUrlSubmit = (url) => {
    if (cavities.length > 0) pushHistory()
    resetEditorState()
    setImage(url)
  }

  return {
    image,
    cavities,
    zoom,
    stageSize,
    imageResolution,
    mousePosition,
    isRemoveMode,
    setIsRemoveMode,
    selectedCavityIndices,
    setSelectedCavityIndices,
    setResizingIndex,
    startResizing,
    isPanning,
    panOffset,
    selectionBox,
    isDragOver,
    cavityShape,
    setCavityShape,
    batchCount,
    setBatchCount,
    batchLayout,
    batchSpacing,
    epnInfo,
    setEpnInfo,
    numberingMode,
    setNumberingMode,
    numberingOrder,
    setNumberingOrder,
    numberPlacement,
    setNumberPlacement,
    saveStatus,
    editorMode,
    canEditGeometry,
    canEditColors,
    editorRef,
    activeSingleSelection,
    activeSingleCavity,
    selectedGroupBounds,
    numberedCavities,
    singleToolbarPosition,
    groupToolbarPosition,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleImageLoad,
    handleUrlSubmit,
    addCavities,
    removeCavity,
    updateBatchSpacing,
    updateBatchLayout,
    toggleSelectedShape,
    updateCavityColors,
    scheduleCavityColorUpdate,
    updateCavityNumericField,
    updateSingleShape,
    updateCavityShape: updateSingleShape,
    updateSingleColor,
    handleSaveCoordinates,
    handleMouseMove,
    stopActions,
    handleMouseLeave,
    handleEditorMouseDown,
    handleCavityMouseDown,
    handleGroupResizeMouseDown,
    zoomIn,
    zoomOut,
    downloadImage,
    fileInputRef,
    updateCavityShapeAtIndex,
    undo,
    deleteSelectedCavities
  }
}

