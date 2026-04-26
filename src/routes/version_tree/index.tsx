import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/version_tree/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/version_tree/"!</div>
}
