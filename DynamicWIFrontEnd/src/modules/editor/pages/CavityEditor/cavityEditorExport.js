import {
  DEFAULT_CAVITY_COLORS,
  EMPTY_CHECK_COLOR_A,
  EMPTY_CHECK_COLOR_B,
} from './cavityEditorConstants'

export function downloadImageWithCavities({ image, imageResolution, cavities }) {
  if (!image || !imageResolution) return

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()

  img.onload = () => {
    canvas.width = img.width
    canvas.height = img.height

    if (!ctx) return

    ctx.drawImage(img, 0, 0)

    cavities.forEach((cavity) => {
      const drawX = cavity.x
      const drawY = cavity.y
      const drawWidth = cavity.size
      const drawHeight = cavity.size
      const left = drawX - drawWidth / 2
      const top = drawY - drawHeight / 2
      const colors = cavity.colors || DEFAULT_CAVITY_COLORS
      const segmentCount = Math.max(1, (colors || DEFAULT_CAVITY_COLORS).filter(Boolean).length)

      ctx.save()
      ctx.beginPath()

      if (cavity.shape === 'square') {
        ctx.rect(left, top, drawWidth, drawHeight)
      } else {
        ctx.arc(drawX, drawY, drawWidth / 2, 0, Math.PI * 2)
      }

      ctx.clip()

      if (segmentCount === 1) {
        if (colors[0]) {
          ctx.fillStyle = `${colors[0]}aa`
          ctx.fill()
        } else {
          const cellSize = Math.max(4, Math.round(drawWidth / 8))
          const cols = Math.ceil(drawWidth / cellSize)
          const rows = Math.ceil(drawHeight / cellSize)

          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              ctx.fillStyle = (row + col) % 2 === 0 ? EMPTY_CHECK_COLOR_A : EMPTY_CHECK_COLOR_B
              ctx.fillRect(left + col * cellSize, top + row * cellSize, cellSize, cellSize)
            }
          }
        }
      } else if (cavity.shape === 'square') {
        const segmentWidth = drawWidth / segmentCount

        for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
          const segmentColor = colors[segmentIndex]
          const segmentLeft = left + segmentWidth * segmentIndex

          if (!segmentColor) {
            const cellSize = Math.max(4, Math.round(segmentWidth / 4))
            const cols = Math.ceil(segmentWidth / cellSize)
            const rows = Math.ceil(drawHeight / cellSize)

            for (let row = 0; row < rows; row++) {
              for (let col = 0; col < cols; col++) {
                ctx.fillStyle = (row + col) % 2 === 0 ? EMPTY_CHECK_COLOR_A : EMPTY_CHECK_COLOR_B
                ctx.fillRect(
                  segmentLeft + col * cellSize,
                  top + row * cellSize,
                  cellSize,
                  cellSize
                )
              }
            }
          } else {
            ctx.fillStyle = `${segmentColor}aa`
            ctx.fillRect(segmentLeft, top, segmentWidth, drawHeight)
          }
        }
      } else {
        const radius = drawWidth / 2
        const effectiveSegments =
          segmentCount === 2
            ? [
                { color: colors[1], start: -Math.PI / 6, end: Math.PI / 2 },
                { color: colors[0], start: Math.PI / 2, end: (Math.PI * 11) / 6 },
              ]
            : Array.from({ length: segmentCount }, (_, segmentIndex) => {
                const angleSize = (Math.PI * 2) / segmentCount
                const startAngle = -Math.PI / 6 + angleSize * segmentIndex
                const endAngle = startAngle + angleSize
                return {
                  color: colors[segmentIndex],
                  start: startAngle,
                  end: endAngle,
                }
              })

        effectiveSegments.forEach((segment) => {
          ctx.beginPath()
          ctx.moveTo(drawX, drawY)
          ctx.arc(drawX, drawY, radius, segment.start, segment.end)
          ctx.closePath()
          if (segment.color) {
            ctx.fillStyle = `${segment.color}aa`
            ctx.fill()
            return
          }

          ctx.save()
          ctx.clip()
          const cellSize = Math.max(4, Math.round(drawWidth / 8))
          const cols = Math.ceil(drawWidth / cellSize)
          const rows = Math.ceil(drawHeight / cellSize)

          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              ctx.fillStyle = (row + col) % 2 === 0 ? EMPTY_CHECK_COLOR_A : EMPTY_CHECK_COLOR_B
              ctx.fillRect(left + col * cellSize, top + row * cellSize, cellSize, cellSize)
            }
          }

          ctx.restore()
        })
      }

      ctx.restore()
      ctx.beginPath()

      if (cavity.shape === 'square') {
        ctx.rect(left, top, drawWidth, drawHeight)
      } else {
        ctx.arc(drawX, drawY, drawWidth / 2, 0, Math.PI * 2)
      }

      ctx.lineWidth = 4
      ctx.strokeStyle =
        segmentCount === 1
          ? colors[0] || '#b0b0b0'
          : colors[0] || DEFAULT_CAVITY_COLORS[0]
      ctx.stroke()
    })

    const link = document.createElement('a')
    link.download = 'final-image.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  img.src = image
}
