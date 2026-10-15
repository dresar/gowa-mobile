import { Outlet } from 'react-router-dom'
import { DeviceGuard, useSelectedDevice } from '@/hooks/use-device-guard'

export default function MiscLayout() {
  const device = useSelectedDevice()

  if (!device) {
    return (
      <div className="flex w-full flex-col gap-4">
        <DeviceGuard />
      </div>
    )
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <Outlet />
    </div>
  )
}
