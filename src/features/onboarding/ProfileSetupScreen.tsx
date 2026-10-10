import { ProfileForm } from '@/features/profile/ProfileForm'
import { nameFromEmail } from '@/features/profile/nameFromEmail'
import { it as t } from '@/i18n/it'
import type { Profile } from '@/types/domain'
import { OnboardingLayout } from './OnboardingLayout'

interface ProfileSetupScreenProps {
  userId: string
  email: string | undefined
  profile: Profile
  onDone: () => void | Promise<void>
}

/** "Come ti chiami?": il profilo vale per tutte le liste */
export function ProfileSetupScreen({ userId, email, profile, onDone }: ProfileSetupScreenProps) {
  // "Utente" è il nome provvisorio del database: meglio proporre quello dell'email
  const initialName =
    profile.display_name && profile.display_name !== 'Utente'
      ? profile.display_name
      : nameFromEmail(email)

  return (
    <OnboardingLayout
      eyebrow={t.profile.hello}
      title={t.profile.title}
      subtitle={t.profile.subtitle}
    >
      <ProfileForm
        userId={userId}
        initialName={initialName}
        initialColor={profile.color}
        initialAvatarPath={profile.avatar_path}
        submitLabel={t.profile.next}
        onSaved={onDone}
      />
    </OnboardingLayout>
  )
}
