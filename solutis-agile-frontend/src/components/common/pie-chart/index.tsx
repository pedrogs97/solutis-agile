import { useMemo, useState } from 'react'

interface PieChart3DProps {
  data: { label: string; value: number }[]
  colors?: string[]
  legendTextColor?: string
  width?: number
  depth?: number
}

const DEFAULT_COLORS = [
  'var(--mantine-color-indigo-6)',
  'var(--mantine-color-blue-6)',
  'var(--mantine-color-teal-6)',
  'var(--mantine-color-green-6)',
  'var(--mantine-color-yellow-6)',
  'var(--mantine-color-orange-6)',
  'var(--mantine-color-red-6)',
  'var(--mantine-color-pink-6)',
  'var(--mantine-color-violet-6)',
]

const PieChart3D = ({
  data,
  colors = DEFAULT_COLORS,
  legendTextColor = 'var(--mantine-color-text)',
  width = 300,
  depth = 20,
}: PieChart3DProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Guarantee we always have a usable palette (caller may pass empty array)
  const baseColors = colors && colors.length > 0 ? colors : DEFAULT_COLORS

  // Normalize data values to numbers to avoid string concatenation bugs
  const normalizedData = (data || []).map((item) => ({
    ...item,
    value: Number(item.value) || 0,
  }))

  // Calculate total value to detect "zero-data" state even if array is not empty
  const totalValue = normalizedData.reduce((sum, item) => sum + item.value, 0)
  const hasData = normalizedData.length > 0 && totalValue > 0

  // For the chart rendering: use a single gray placeholder slice when no data
  // But keep the original data for the legend
  const chartData = hasData ? normalizedData : [{ label: '', value: 1 }]
  const chartColors = hasData ? baseColors : ['var(--mantine-color-gray-4)']

  const { sortedSlices } = useMemo(() => {
    const total = chartData.reduce((sum, item) => sum + item.value, 0)

    let currentAngle = -Math.PI / 2 // Start at top (12 o'clock)

    const TWO_PI = Math.PI * 2

    // 1. Generate geometry for all slices
    const generatedSlices = chartData.map((item, index) => {
      // Avoid division by zero if total is 0 (though chartData logic above aims to prevent this)
      const safeTotal = total === 0 ? 1 : total
      const percentage = item.value / safeTotal

      // Prevent a 360° arc from collapsing into a line (start=end).
      // Clamp a full slice to just under 360° to keep the path drawable.
      const rawAngleSpan = percentage * TWO_PI
      const angleSpan =
        rawAngleSpan >= TWO_PI - 1e-4 ? TWO_PI - 1e-4 : rawAngleSpan

      const startAngle = currentAngle
      const endAngle = currentAngle + angleSpan
      const midAngle = startAngle + angleSpan / 2

      currentAngle = endAngle

      const color = chartColors[index % chartColors.length]

      return {
        ...item,
        index: hasData ? index : -1, // Use -1 for empty state to prevent hover
        startAngle,
        endAngle,
        midAngle,
        percentage,
        color,
      }
    })

    // 2. Sort for Painter's Algorithm (Back to Front)
    const sorted = [...generatedSlices].sort((a, b) => {
      return Math.sin(a.midAngle) - Math.sin(b.midAngle)
    })

    return { sortedSlices: sorted }
  }, [chartData, chartColors, hasData])

  // Visualization params
  const CX = 150
  const CY = 120
  const RX = 120
  const RY = 70 // Tilt ratio ~ 0.6

  // Helper to generate SVG path commands
  const getCoordinates = (angle: number, radiusX: number, radiusY: number) => ({
    x: CX + radiusX * Math.cos(angle),
    y: CY + radiusY * Math.sin(angle),
  })

  return (
    <div
      style={{
        width: '100%',
        maxWidth: width,
        margin: '0 auto',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <svg
        viewBox="0 0 300 240"
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        <defs>
          <filter id="pie-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
            <feOffset dx="0" dy="4" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {sortedSlices.map((slice) => {
          const isHovered = hoveredIndex === slice.index && slice.index !== -1

          // Hover Offset Calculation
          const hoverDist = isHovered ? 12 : 0
          const ox = Math.cos(slice.midAngle) * hoverDist
          const oy = Math.sin(slice.midAngle) * hoverDist

          // Vertices
          const startTop = getCoordinates(slice.startAngle, RX, RY)
          const endTop = getCoordinates(slice.endAngle, RX, RY)
          const centerBottom = { x: CX, y: CY + depth }

          const startBottom = { x: startTop.x, y: startTop.y + depth }
          const endBottom = { x: endTop.x, y: endTop.y + depth }

          const largeArcFlag = slice.percentage > 0.5 ? 1 : 0

          // Paths
          const topPath = [
            `M ${CX} ${CY}`,
            `L ${startTop.x} ${startTop.y}`,
            `A ${RX} ${RY} 0 ${largeArcFlag} 1 ${endTop.x} ${endTop.y}`,
            `Z`,
          ].join(' ')

          const sidePath = [
            `M ${startTop.x} ${startTop.y}`,
            `L ${startBottom.x} ${startBottom.y}`,
            `A ${RX} ${RY} 0 ${largeArcFlag} 1 ${endBottom.x} ${endBottom.y}`,
            `L ${endTop.x} ${endTop.y}`, // Line up to top
            `A ${RX} ${RY} 0 ${largeArcFlag} 0 ${startTop.x} ${startTop.y}`, // Arc back along top edge (reverse)
          ].join(' ')

          // Internal Radial Faces (The "Cuts")
          // We draw these to make the slice look solid when separated
          const startFacePath = [
            `M ${CX} ${CY}`,
            `L ${startTop.x} ${startTop.y}`,
            `L ${startBottom.x} ${startBottom.y}`,
            `L ${CX} ${centerBottom.y}`,
            `Z`,
          ].join(' ')

          const endFacePath = [
            `M ${CX} ${CY}`,
            `L ${endTop.x} ${endTop.y}`,
            `L ${endBottom.x} ${endBottom.y}`,
            `L ${CX} ${centerBottom.y}`,
            `Z`,
          ].join(' ')

          return (
            <g
              key={slice.index !== -1 ? slice.index : 'empty'}
              transform={`translate(${ox}, ${oy})`}
              onMouseEnter={() =>
                slice.index !== -1 && setHoveredIndex(slice.index)
              }
              onMouseLeave={() => slice.index !== -1 && setHoveredIndex(null)}
              style={{
                display: 'block',
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                cursor: slice.index !== -1 ? 'pointer' : 'default',
                filter: isHovered ? 'url(#pie-shadow)' : undefined,
              }}
            >
              {/* Internal Faces (Darker) - visible when popped */}
              <path
                d={startFacePath}
                fill={slice.color}
                filter="brightness(0.6)"
                stroke="none"
              />
              <path
                d={endFacePath}
                fill={slice.color}
                filter="brightness(0.6)"
                stroke="none"
              />

              {/* Side Wall (Rim) */}
              <path
                d={sidePath}
                fill={slice.color}
                filter="brightness(0.8)"
                stroke="rgba(0,0,0,0.05)"
                strokeWidth="0.5"
              />

              {/* Top Surface */}
              <path
                d={topPath}
                fill={slice.color}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
              />

              {slice.index !== -1 && (
                <title>{`${slice.label}: ${slice.value} (${(slice.percentage * 100).toFixed(1)}%)`}</title>
              )}
            </g>
          )
        })}
      </svg>

      {/* Custom Legend - Always show if data array has items (even if values are 0) */}
      {data && data.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '10px',
          }}
        >
          {data.map((item, i) => {
            const percentage = hasData
              ? ((Number(item.value) || 0) / totalValue) * 100
              : 0
            return (
              <div
                key={i}
                onMouseEnter={() => hasData && setHoveredIndex(i)}
                onMouseLeave={() => hasData && setHoveredIndex(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: hasData ? 'pointer' : 'default',
                  opacity:
                    hoveredIndex !== null && hoveredIndex !== i ? 0.4 : 1,
                  transition: 'opacity 0.2s',
                  transform:
                    hasData && hoveredIndex === i ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    // Keep colors from props even when no data
                    backgroundColor: baseColors[i % baseColors.length],
                    borderRadius: '50%',
                    marginRight: 6,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                />
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: legendTextColor,
                    fontWeight: 500,
                  }}
                >
                  {item.label} ({percentage.toFixed(1)}%)
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PieChart3D
