'use client'

import { removeNucleoMember } from '@/app/actions/nucleos'

export function RemoveMemberButton({ nucleoId, userId }: { nucleoId: string; userId: string }) {
  const action = removeNucleoMember.bind(null, nucleoId, userId)
  return (
    <form action={action}>
      <button
        type="submit"
        className="text-xs text-red-500 hover:text-red-700 transition"
      >
        Remover
      </button>
    </form>
  )
}
