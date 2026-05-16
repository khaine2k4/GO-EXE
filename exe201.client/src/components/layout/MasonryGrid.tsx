import React from 'react'

type MasonryGridProps<T> = {
  items: T[]
  gap?: number
  maxColumns?: number
  minColumnWidth?: number
  renderItem: (item: T, style: React.CSSProperties) => React.ReactNode
  getItemAspectRatio: (item: T) => number
  getItemSpan?: (item: T) => 1 | 2
  getItemKey?: (item: T) => string | number
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function useResizeObserver<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null)
  const [width, setWidth] = React.useState(0)
  React.useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (!cr) return
      setWidth(cr.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref, width }
}

export default function MasonryGrid<T>({
  items,
  gap = 24,
  maxColumns = 5,
  minColumnWidth = 240,
  renderItem,
  getItemAspectRatio,
  getItemSpan,
  getItemKey,
}: MasonryGridProps<T>) {
  const { ref, width: containerWidth } = useResizeObserver<HTMLDivElement>()

  const layout = React.useMemo(() => {
    if (!containerWidth || items.length === 0) {
      return { entries: [] as { item: T; style: React.CSSProperties }[], height: 0 }
    }
    const rawCols = Math.floor((containerWidth + gap) / (minColumnWidth + gap))
    const colCount = clamp(rawCols || 1, 1, maxColumns)
    const totalGaps = gap * (colCount - 1)
    const colW = (containerWidth - totalGaps) / colCount
    const colHeights = new Array(colCount).fill(0)
    const lastWideAtCol = new Array(colCount).fill(-1)

    const entries = items.map((item, itemIdx) => {
      const requestedSpan = (getItemSpan?.(item) ?? 1) as 1 | 2
      const span = requestedSpan === 2 && colCount >= 2 ? 2 : 1
      const ratio = getItemAspectRatio(item) || 1
      const itemW = span === 2 ? colW * 2 + gap : colW
      const itemH = itemW / ratio

      let bestCol = -1
      let bestY = Infinity
      let bestScore = Infinity
      const WIDE_COOLDOWN = 3

      const evaluatePos = (c: number, checkCooldown: boolean) => {
        if (span === 2) {
          if (c > colCount - 2) return
          if (checkCooldown) {
            const hasConflict =
              (lastWideAtCol[c] !== -1 && itemIdx - lastWideAtCol[c] < WIDE_COOLDOWN) ||
              (lastWideAtCol[c + 1] !== -1 && itemIdx - lastWideAtCol[c + 1] < WIDE_COOLDOWN)
            if (hasConflict) return
          }
          const y = Math.max(colHeights[c], colHeights[c + 1])
          const gapDiff = Math.abs(colHeights[c] - colHeights[c + 1])
          const score = y + gapDiff * 3
          if (score < bestScore) {
            bestScore = score
            bestCol = c
            bestY = y
          }
        } else {
          const y = colHeights[c]
          if (y < bestScore) {
            bestScore = y
            bestCol = c
            bestY = y
          }
        }
      }

      if (span === 2) {
        for (let c = 0; c < colCount; c++) evaluatePos(c, true)
        if (bestCol === -1) {
          for (let c = 0; c < colCount; c++) evaluatePos(c, false)
        }
      } else {
        for (let c = 0; c < colCount; c++) evaluatePos(c, false)
      }

      if (bestCol === -1) {
        bestCol = 0
        bestY = span === 2 ? Math.max(colHeights[0], colHeights[1] || 0) : colHeights[0]
      }

      const x = bestCol * (colW + gap)
      const y = bestY
      const newBottom = y + itemH + gap
      if (span === 2) {
        colHeights[bestCol] = newBottom
        colHeights[bestCol + 1] = newBottom
        lastWideAtCol[bestCol] = itemIdx
        lastWideAtCol[bestCol + 1] = itemIdx
      } else {
        colHeights[bestCol] = newBottom
      }

      return {
        item,
        style: {
          position: 'absolute',
          width: itemW,
          height: itemH,
          transform: `translate3d(${x}px, ${y}px, 0)`,
          willChange: 'transform',
        } as React.CSSProperties,
      }
    })

    const height = Math.max(...colHeights, 0)
    return { entries, height }
  }, [items, containerWidth, gap, minColumnWidth, maxColumns, getItemAspectRatio, getItemSpan])

  return (
    <div ref={ref} className="w-full">
      <div style={{ position: 'relative', height: layout.height }}>
        {layout.entries.map((e, idx) => (
          <React.Fragment key={getItemKey ? getItemKey(e.item) : idx}>
            {renderItem(e.item, e.style)}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
