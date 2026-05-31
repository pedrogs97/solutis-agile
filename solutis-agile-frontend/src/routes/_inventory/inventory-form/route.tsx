'use client'

import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Suspense } from 'react'

import LoadingScreen from '@/components/common/loading-screen'

export const Route = createFileRoute('/_inventory/inventory-form')({
  component: InventoryFormLayout,
})

function InventoryFormLayout() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  )
}
