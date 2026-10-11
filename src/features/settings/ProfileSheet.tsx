import { BottomSheet } from '@/components/BottomSheet'
import { useHousehold } from '@/features/auth/useHousehold'
import { useInvalidateLists } from '@/features/lists/useLists'
import { ProfileForm } from '@/features/profile/ProfileForm'
import { it as t } from '@/i18n/it'
import { toast } from '@/lib/toast'

interface ProfileSheetProps {
  open: boolean
  onClose: () => void
}

/** Il tuo profilo: nome, foto e colore, uguali in tutte le liste */
export function ProfileSheet({ open, onClose }: ProfileSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={t.profile.sheetTitle}>
      {open && <ProfileSheetForm onClose={onClose} />}
    </BottomSheet>
  )
}

function ProfileSheetForm({ onClose }: { onClose: () => void }) {
  const { profile, userId } = useHousehold()
  const invalidate = useInvalidateLists()
  return (
    <div className="pb-2">
      <ProfileForm
        userId={userId}
        initialName={profile.display_name}
        initialColor={profile.color}
        initialAvatarPath={profile.avatar_path}
        submitLabel={t.profile.save}
        onSaved={async () => {
          await invalidate(userId)
          toast(t.profile.saved, 'success')
          onClose()
        }}
      />
    </div>
  )
}
