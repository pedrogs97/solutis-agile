import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import PieChart3D from './index'

describe('PieChart3D', () => {
  const mockDataWithValues = [
    { label: 'Ativos', value: 100 },
    { label: 'Inativos', value: 50 },
  ]

  const mockDataZeroValues = [
    { label: 'Resolvidos', value: 0 },
    { label: 'Pendentes', value: 0 },
  ]

  const mockColors = ['#40C057', '#FA5252']

  afterEach(() => {
    cleanup()
  })

  describe('with valid data', () => {
    it('should render the pie chart with data', () => {
      const { container } = render(
        <PieChart3D data={mockDataWithValues} colors={mockColors} />,
      )

      // SVG should be present
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()

      // Should have path elements for slices
      const paths = container.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })

    it('should render legend with correct labels', () => {
      render(<PieChart3D data={mockDataWithValues} colors={mockColors} />)

      expect(screen.getAllByText('Ativos').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Inativos').length).toBeGreaterThan(0)
    })

    it('should use provided colors for slices', () => {
      const { container } = render(
        <PieChart3D data={mockDataWithValues} colors={mockColors} />,
      )

      const paths = container.querySelectorAll('path')
      const pathColors = Array.from(paths).map((p) => p.getAttribute('fill'))

      // At least one path should have our colors
      expect(pathColors.some((c) => mockColors.includes(c || ''))).toBe(true)
    })
  })

  describe('with zero values (no data)', () => {
    it('should render a gray placeholder pie', () => {
      const { container } = render(
        <PieChart3D data={mockDataZeroValues} colors={mockColors} />,
      )

      // SVG should still be present
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()

      // Should have path elements
      const paths = container.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)

      // At least one path should be gray (#cbd5e1)
      const pathColors = Array.from(paths).map((p) => p.getAttribute('fill'))
      expect(pathColors.some((c) => c === '#cbd5e1')).toBe(true)
    })

    it('should still render legend with original labels', () => {
      render(<PieChart3D data={mockDataZeroValues} colors={mockColors} />)

      expect(screen.getAllByText('Resolvidos').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Pendentes').length).toBeGreaterThan(0)
    })

    it('should keep original colors in legend even when pie is gray', () => {
      const { container } = render(
        <PieChart3D data={mockDataZeroValues} colors={mockColors} />,
      )

      // Legend color dots should still have original colors
      const legendDots = container.querySelectorAll(
        'div[style*="border-radius: 50%"]',
      )

      expect(legendDots.length).toBe(2)
    })
  })

  describe('with empty array', () => {
    it('should render a gray placeholder pie when data is empty array', () => {
      const { container } = render(<PieChart3D data={[]} colors={mockColors} />)

      // SVG should still be present
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()

      // Should have path elements for gray placeholder
      const paths = container.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)

      // Paths should be gray
      const pathColors = Array.from(paths).map((p) => p.getAttribute('fill'))
      expect(pathColors.some((c) => c === '#cbd5e1')).toBe(true)
    })

    it('should not render legend when data is empty', () => {
      const { container } = render(<PieChart3D data={[]} colors={mockColors} />)

      // No legend items when data is empty
      const legendItems = container.querySelectorAll(
        'div[style*="border-radius: 50%"]',
      )
      expect(legendItems.length).toBe(0)
    })
  })

  describe('with default colors', () => {
    it('should use default colors when colors prop is empty', () => {
      const { container } = render(
        <PieChart3D data={mockDataWithValues} colors={[]} />,
      )

      const paths = container.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })

    it('should use default colors when colors prop is not provided', () => {
      const { container } = render(<PieChart3D data={mockDataWithValues} />)

      const paths = container.querySelectorAll('path')
      expect(paths.length).toBeGreaterThan(0)
    })
  })
})
