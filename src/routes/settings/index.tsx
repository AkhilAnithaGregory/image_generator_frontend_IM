import DefaultLayout from '@/lib/layouts/defaultLayout'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings/')({
  component: RouteComponent,
})


function RouteComponent() {
  return <DefaultLayout>Hello "/auth/signup"!</DefaultLayout>
}
