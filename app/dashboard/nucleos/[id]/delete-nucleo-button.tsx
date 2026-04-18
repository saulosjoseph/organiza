'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteNucleo } from '@/app/actions/nucleos'

export function DeleteNucleoButton({ nucleoId }: { nucleoId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (!confirm('Tem certeza que deseja excluir este núcleo? Esta ação não pode ser desfeita.')) return
    startTransition(async () => {
      await deleteNucleo(nucleoId)
      router.push('/dashboard/nucleos')
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
    >
      {pending ? 'Excluindo…' : 'Excluir núcleo'}
    </button>
  )
}
