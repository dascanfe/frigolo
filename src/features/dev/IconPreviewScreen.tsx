import { CUSTOM_ICONS } from '@/lib/customIcons'
import { Icon } from '@/components/Icon'

/** Solo in sviluppo: anteprima delle icone custom a 28px e 56px */
export function IconPreviewScreen() {
  const names = Object.keys(CUSTOM_ICONS)
  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="font-display text-2xl font-bold">Icone custom ({names.length})</h1>
      <div className="grid grid-cols-4 gap-3">
        {names.map((name) => (
          <div
            key={name}
            className="flex flex-col items-center gap-2 rounded-2xl bg-surface p-3 ring-1 ring-subtle"
          >
            <Icon name={name} size={56} strokeWidth={1.5} />
            <Icon name={name} size={28} strokeWidth={1.75} />
            <span className="text-[11px] font-bold text-secondary">{name}</span>
          </div>
        ))}
      </div>
    </main>
  )
}
