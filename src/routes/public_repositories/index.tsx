import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/public_repositories/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/public_repositories/"!</div>
}
