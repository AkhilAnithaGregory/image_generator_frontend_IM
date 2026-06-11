import { createFileRoute } from '@tanstack/react-router'
import RouteComponent from './RouteComponent'

export const Route = createFileRoute('/settings/')({
  component: RouteComponent,
})
