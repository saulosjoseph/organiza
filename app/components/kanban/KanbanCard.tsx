'use client'

import { useState } from 'react'
import type { KanbanCard, KanbanColumn } from '@/app/lib/definitions'
import { deleteCard } from '@/app/actions/boards'
import { EditCardModal } from './EditCardModal'

type Props = {
  card: KanbanCard
  columns: KanbanColumn[]
  columnLabels: Record<string, string>
  assignableUsers: { id: string; username: string }[]
  onMove: (cardId: string, column: KanbanColumn) => Promise<void>
}

export function KanbanCardItem({ card, columns, columnLabels, assignableUsers, onMove }: Props) {
  const [editing, setEditing] = useState(false)

  const otherColumns = columns.filter((c) => c !== card.column)

  return (
    <>
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{card.title}</p>

        {card.description && (
          <p className="text-xs text-zinc-500 line-clamp-2">{card.description}</p>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
          {card.assignee_username && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
              👤 @{card.assignee_username}
            </span>
          )}
          {card.due_date && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
              📅 {new Date(card.due_date).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {otherColumns.map((col) => (
            <button
              key={col}
              onClick={() => onMove(card.id, col)}
              className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-600 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            >
              → {columnLabels[col]}
            </button>
          ))}

          <button
            onClick={() => setEditing(true)}
            className="ml-auto text-xs text-zinc-400 hover:text-zinc-600 transition"
          >
            Editar
          </button>

          <form action={deleteCard.bind(null, card.id)}>
            <button type="submit" className="text-xs text-red-400 hover:text-red-600 transition">
              Excluir
            </button>
          </form>
        </div>
      </div>

      {editing && (
        <EditCardModal
          card={card}
          columns={columns}
          columnLabels={columnLabels}
          assignableUsers={assignableUsers}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  )
}
