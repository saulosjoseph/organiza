'use client'

import { useOptimistic, useState } from 'react'
import { moveCard } from '@/app/actions/boards'
import type { KanbanCard, KanbanColumn } from '@/app/lib/definitions'
import { AddCardForm } from './AddCardForm'
import { KanbanCardItem } from './KanbanCard'

type Props = {
  board: { id: string; nucleo_id: string; name: string }
  cardsByColumn: Record<string, KanbanCard[]>
  columns: KanbanColumn[]
  columnLabels: Record<string, string>
  assignableUsers: { id: string; username: string }[]
  nucleoId: string
}

export function KanbanBoard({ board, cardsByColumn, columns, columnLabels, assignableUsers, nucleoId }: Props) {
  // Flatten all cards into one list for optimistic updates
  const allCards = columns.flatMap((col) => cardsByColumn[col] ?? [])

  const [optimisticCards, moveOptimistic] = useOptimistic(
    allCards,
    (current: KanbanCard[], { cardId, column }: { cardId: string; column: KanbanColumn }) =>
      current.map((c) => (c.id === cardId ? { ...c, column } : c)),
  )

  const [addingIn, setAddingIn] = useState<KanbanColumn | null>(null)

  async function handleMove(cardId: string, column: KanbanColumn) {
    moveOptimistic({ cardId, column })
    await moveCard(cardId, column)
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {columns.map((col) => {
        const cards = optimisticCards.filter((c) => c.column === col)
        return (
          <div
            key={col}
            className="flex flex-col gap-3 rounded-xl bg-zinc-100 p-4 dark:bg-zinc-800/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {columnLabels[col]}
              </span>
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                {cards.length}
              </span>
            </div>

            <div className="flex flex-col gap-2 min-h-[4rem]">
              {cards.map((card) => (
                <KanbanCardItem
                  key={card.id}
                  card={card}
                  columns={columns}
                  columnLabels={columnLabels}
                  assignableUsers={assignableUsers}
                  onMove={handleMove}
                />
              ))}
            </div>

            {addingIn === col ? (
              <AddCardForm
                boardId={board.id}
                column={col}
                assignableUsers={assignableUsers}
                onCancel={() => setAddingIn(null)}
                onSuccess={() => setAddingIn(null)}
              />
            ) : (
              <button
                onClick={() => setAddingIn(col)}
                className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-700 dark:border-zinc-600 dark:hover:border-zinc-400"
              >
                + Adicionar card
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
