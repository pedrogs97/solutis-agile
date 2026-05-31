import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  // always send "/" to "/login"
  beforeLoad: () => {
    throw redirect({ to: '/login', replace: true })
  },
  // If beforeLoad redirects, component won't render.
  component: () => null,
})
