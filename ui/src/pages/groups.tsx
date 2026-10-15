import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, Link, Plus } from 'lucide-react'
import { listMyGroups, type MyGroup } from '@/api/group'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CreateGroupForm } from '@/features/group/create-group-form'
import { GroupDetailView } from '@/features/group/group-detail-view'
import { GroupDirectory } from '@/features/group/group-list'
import { InfoFromLinkForm } from '@/features/group/info-from-link-form'
import { JoinWithLinkForm } from '@/features/group/join-with-link-form'
import { DeviceGuard, useSelectedDevice } from '@/hooks/use-device-guard'

function HeaderDialog({
  trigger,
  title,
  description,
  children,
}: {
  trigger: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export default function GroupsPage() {
  const deviceId = useSelectedDevice()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selected, setSelected] = useState<MyGroup | null>(null)

  const activeJid = searchParams.get('jid') || selected?.JID || ''

  const { data: groups = [] } = useQuery({
    queryKey: ['groups', deviceId],
    queryFn: () => listMyGroups(deviceId || undefined),
    enabled: !!deviceId,
  })

  const activeGroup = useMemo(() => {
    if (selected && selected.JID === activeJid) return selected
    if (activeJid && groups.length > 0) {
      return groups.find((g) => g.JID === activeJid) || null
    }
    return selected
  }, [selected, activeJid, groups])

  const handleSelectGroup = (group: MyGroup) => {
    setSelected(group)
    setSearchParams({ jid: group.JID })
  }

  const handleBackToList = () => {
    setSelected(null)
    setSearchParams({})
  }

  if (!deviceId) {
    return (
      <>
        <PageHeader
          title="Grup"
          description="Daftar keanggotaan grup perangkat."
        />
        <DeviceGuard />
      </>
    )
  }

  if (activeGroup) {
    return (
      <GroupDetailView
        group={activeGroup}
        onBack={handleBackToList}
      />
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 sm:gap-5">
      <PageHeader
        title="Grup"
        description="Daftar keanggotaan grup perangkat dan manajemen automasi bot."
        actions={
          <>
            <HeaderDialog
              trigger={
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <Eye className="size-3.5" />
                  Pratinjau link
                </Button>
              }
              title="Pratinjau grup"
              description="Lihat info grup sebelum bergabung."
            >
              <InfoFromLinkForm />
            </HeaderDialog>
            <HeaderDialog
              trigger={
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <Link className="size-3.5" />
                  Gabung link
                </Button>
              }
              title="Gabung grup"
              description="Gabung ke grup melalui tautan undangan."
            >
              <JoinWithLinkForm />
            </HeaderDialog>
            <HeaderDialog
              trigger={
                <Button size="sm" className="h-8 gap-1.5 text-xs font-semibold">
                  <Plus className="size-3.5" />
                  Buat grup
                </Button>
              }
              title="Buat grup"
              description="Buat grup baru bersama anggota dan pasang proteksi bot."
            >
              <CreateGroupForm />
            </HeaderDialog>
          </>
        }
      />

      <div className="w-full min-w-0">
        <GroupDirectory onSelect={handleSelectGroup} />
      </div>
    </div>
  )
}
