import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useHousehold } from '@/features/auth/useHousehold'
import { supabase } from '@/lib/supabase'
import { suppressAllTips } from './tips'

/**
 * Se c'è almeno una spesa in una qualunque delle liste dell'utente (la RLS
 * mostra solo le sue), i suggerimenti al primo uso non servono.
 */
export function useSuppressTipsForExperienced() {
  const { userId } = useHousehold()
  const anyTrip = useQuery({
    queryKey: ['any-trip', userId],
    queryFn: async (): Promise<boolean> => {
      const { count, error } = await supabase
        .from('shopping_trips')
        .select('id', { count: 'exact', head: true })
      if (error) throw error
      return (count ?? 0) > 0
    },
    staleTime: Infinity,
  })

  useEffect(() => {
    if (anyTrip.data) suppressAllTips()
  }, [anyTrip.data])
}
