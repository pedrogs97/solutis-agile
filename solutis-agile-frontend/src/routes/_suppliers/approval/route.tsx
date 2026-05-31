'use client'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Suspense } from 'react'

import LoadingScreen from '@/components/common/loading-screen'

export const Route = createFileRoute('/_suppliers/approval')({
  component: SupplierApprovalLayout,
})

function SupplierApprovalLayout() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  )
}
