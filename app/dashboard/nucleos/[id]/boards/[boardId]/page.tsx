import { getCurrentUser, getBoardById, getNucleoUsersForAssignment } from '@/app/lib/dal'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { KanbanBoard } from '@/app/components/kanban/KanbanBoard'
import { KANBAN_COLUMN_LABELS, KANBAN_COLUMNS } from '@/app/lib/definitions'

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string; boardId: string }>
}) {
  const { id, boardId } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const board = await getBoardById(boardId, user.id, user.roles)
  if (!board) notFound()

  const assignableUsers = await getNucleoUsersForAssignment(board.nucleo_id)

  const cardsByColumn = Object.fromEntries(
    KANBAN_COLUMNS.map((col) => [col, board.cards.filter((c) => c.column === col)])
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/dashboard/nucleos/${id}`}
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Núcleo
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {board.name}
        </h1>
      </div>

      <KanbanBoard
        board={board}
        cardsByColumn={cardsByColumn as Record<string, typeof board.cards>}
        columnLabels={KANBAN_COLUMN_LABELS}
        columns={[...KANBAN_COLUMNS]}
        assignableUsers={assignableUsers}
        nucleoId={id}
      />
    </div>
  )
}
