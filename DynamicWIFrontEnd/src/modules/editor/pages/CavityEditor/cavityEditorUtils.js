import {
  DEFAULT_CAVITY_COLORS,
  DEFAULT_COLUMN_SPACING,
  DEFAULT_ROW_SPACING,
  EMPTY_CHECK_COLOR_A,
  EMPTY_CHECK_COLOR_B,
  MAX_STAGE_HEIGHT,
  MAX_STAGE_WIDTH,
} from './cavityEditorConstants'

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

export const getEmptyCheckBackground = (size) => ({
  background: `conic-gradient(${EMPTY_CHECK_COLOR_A} 90deg, ${EMPTY_CHECK_COLOR_B} 90deg 180deg, ${EMPTY_CHECK_COLOR_A} 180deg 270deg, ${EMPTY_CHECK_COLOR_B} 270deg)`,
  backgroundSize: `${size}px ${size}px`,
})

export const getCavityFillStyle = (cavity) => {
  const colors = cavity.colors || DEFAULT_CAVITY_COLORS
  const segmentCount = Math.max(1, (colors || DEFAULT_CAVITY_COLORS).filter(Boolean).length)

  if (cavity.shape !== 'round') {
    return {}
  }

  if (segmentCount === 1) {
    if (colors[0]) {
      return { background: colors[0] }
    }

    const cellSize = Math.max(6, Math.round(cavity.size / 6))
    return getEmptyCheckBackground(cellSize)
  }

  if (segmentCount === 2) {
    return {
      background: `conic-gradient(from -30deg, ${colors[1] || EMPTY_CHECK_COLOR_A} 0deg 120deg, ${colors[0] || EMPTY_CHECK_COLOR_A} 120deg 360deg)`,
    }
  }

  return {
    background: `conic-gradient(from -30deg, ${colors[0] || EMPTY_CHECK_COLOR_A} 0deg 120deg, ${colors[1] || EMPTY_CHECK_COLOR_A} 120deg 240deg, ${colors[2] || EMPTY_CHECK_COLOR_A} 240deg 360deg)`,
  }
}

export const fitImageToStage = (width, height) => {
  if (!width || !height) {
    return { width: 1000, height: 700 }
  }

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : MAX_STAGE_WIDTH
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : MAX_STAGE_HEIGHT
  const availableWidth = Math.min(MAX_STAGE_WIDTH, Math.max(viewportWidth - 80, 240))
  const availableHeight = Math.min(MAX_STAGE_HEIGHT, Math.max(viewportHeight - 320, 240))
  const ratio = Math.min(availableWidth / width, availableHeight / height, 1)

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}

export const getPanBounds = (zoom, stageSize, containerSize = { width: 0, height: 0 }) => {
  const scaledWidth = stageSize.width * zoom
  const scaledHeight = stageSize.height * zoom

  let minX, maxX, minY, maxY

  if (scaledWidth < containerSize.width) {
    minX = maxX = (containerSize.width - scaledWidth) / 2
  } else {
    // Allow panning with some padding like Paint
    const padding = 100
    minX = containerSize.width - scaledWidth - padding
    maxX = padding
  }

  if (scaledHeight < containerSize.height) {
    minY = maxY = (containerSize.height - scaledHeight) / 2
  } else {
    const padding = 100
    minY = containerSize.height - scaledHeight - padding
    maxY = padding
  }

  return { minX, maxX, minY, maxY }
}

export const clampPanOffset = (offset, zoom, stageSize, containerSize) => {
  const bounds = getPanBounds(zoom, stageSize, containerSize)

  return {
    x: clamp(offset.x, bounds.minX, bounds.maxX),
    y: clamp(offset.y, bounds.minY, bounds.maxY),
  }
}

export const sortIndicesForEpnLayout = (indices, cavities) =>
  [...indices].sort((a, b) => {
    const cavityA = cavities[a]
    const cavityB = cavities[b]

    if (!cavityA || !cavityB) return 0
    if (Math.abs(cavityA.x - cavityB.x) > 2) return cavityA.x - cavityB.x
    return cavityA.y - cavityB.y
  })

export const computeNumberedCavities = (allCavities, order) => {
  const indexed = allCavities.map((cavity, index) => ({ cavity, index }))

  indexed.sort((a, b) => {
    const { cavity: ca } = a
    const { cavity: cb } = b

    if (order === 'ltr-down') {
      const rowA = Math.round(ca.y / 10)
      const rowB = Math.round(cb.y / 10)
      if (rowA !== rowB) return rowA - rowB
      return ca.x - cb.x
    }
    if (order === 'ltr-up') {
      const rowA = Math.round(ca.y / 10)
      const rowB = Math.round(cb.y / 10)
      if (rowA !== rowB) return rowB - rowA
      return ca.x - cb.x
    }
    if (order === 'rtl-down') {
      const rowA = Math.round(ca.y / 10)
      const rowB = Math.round(cb.y / 10)
      if (rowA !== rowB) return rowA - rowB
      return cb.x - ca.x
    }
    if (order === 'rtl-up') {
      const rowA = Math.round(ca.y / 10)
      const rowB = Math.round(cb.y / 10)
      if (rowA !== rowB) return rowB - rowA
      return cb.x - ca.x
    }
    return 0
  })

  const map = new Map()
  indexed.forEach(({ index }, position) => {
    map.set(index, position + 1)
  })
  return map
}

export const inferSpacingFromSelection = (indices, cavities) => {
  const sorted = sortIndicesForEpnLayout(indices, cavities)

  if (sorted.length < 2) {
    return { column: DEFAULT_COLUMN_SPACING, row: DEFAULT_ROW_SPACING }
  }

  let inferredRow = DEFAULT_ROW_SPACING
  let inferredColumn = DEFAULT_COLUMN_SPACING
  const topColumns = []

  for (let i = 0; i < sorted.length; i += 2) {
    const top = cavities[sorted[i]]
    const bottom = cavities[sorted[i + 1]]

    if (top) topColumns.push(top.x)
    if (top && bottom) {
      inferredRow = Math.max(24, Math.round(Math.abs(bottom.y - top.y)))
    }
  }

  if (topColumns.length > 1) {
    inferredColumn = Math.max(24, Math.round(topColumns[1] - topColumns[0]))
  }

  return { column: inferredColumn, row: inferredRow }
}

export const inferLayoutFromSelection = (indices, cavities) => {
  const selected = indices.map((index) => cavities[index]).filter(Boolean)

  if (selected.length < 2) return 'paired'

  const sameRow = selected.every((cavity) => Math.abs(cavity.y - selected[0].y) < 6)
  if (sameRow) return 'horizontal'

  const sameColumn = selected.every((cavity) => Math.abs(cavity.x - selected[0].x) < 6)
  if (sameColumn) return 'vertical'

  return 'paired'
}

export const getSelectionBounds = (indices, cavities) => {
  const selected = indices.map((index) => cavities[index]).filter(Boolean)
  if (selected.length === 0) return null

  return {
    minX: Math.min(...selected.map((cavity) => cavity.x - cavity.size / 2)),
    maxX: Math.max(...selected.map((cavity) => cavity.x + cavity.size / 2)),
    minY: Math.min(...selected.map((cavity) => cavity.y - cavity.size / 2)),
    maxY: Math.max(...selected.map((cavity) => cavity.y + cavity.size / 2)),
  }
}

/**
 * Hydrate editor cavities from persisted coordinate map (image space).
 * Scales from saved image dimensions to current natural size when they differ.
 */
export const coordinateMapToCavities = (coordinateMap, naturalWidth, naturalHeight) => {
  if (!coordinateMap || typeof coordinateMap !== 'object') return []

  const refW = coordinateMap.imageWidth || naturalWidth
  const refH = coordinateMap.imageHeight || naturalHeight
  const sx = refW ? naturalWidth / refW : 1
  const sy = refH ? naturalHeight / refH : 1

  const entries = Object.entries(coordinateMap.cavities)
    .filter(([key]) => /^\d+$/.test(String(key)))
    .map(([key, value]) => ({ ordinal: Number(key), value }))
    .sort((a, b) => a.ordinal - b.ordinal)

  return entries.map(({ value: v }) => {
    const colors = v.colors ? [...v.colors] : [...DEFAULT_CAVITY_COLORS]

    return {
      x: Math.round(v.x * sx),
      y: Math.round(v.y * sy),
      size: Math.round(v.size * sx),
      shape: v.shape || 'round',
      colors,
    }
  })
}
