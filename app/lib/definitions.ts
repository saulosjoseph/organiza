import { z } from 'zod'

export const ROLES = [
  'adm',
  'comite_central',
  'uniao_comite_local',
  'comite_local',
  'base',
] as const

export type Role = (typeof ROLES)[number]

// Roles that each role is allowed to assign when creating users.
// adm is transversal: can assign any role.
export const ASSIGNABLE_ROLES: Record<Role, Role[]> = {
  adm: [...ROLES],
  comite_central: ['comite_central', 'uniao_comite_local', 'comite_local', 'base'],
  uniao_comite_local: ['comite_local', 'base'],
  comite_local: ['base'],
  base: [],
}

export type User = {
  id: string
  username: string
  roles: Role[]
  created_at: Date
}

export type SessionPayload = {
  userId: string
  roles: Role[]
  expiresAt: Date
}

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  username: z.string().min(1, { message: 'Usuário obrigatório.' }).trim(),
  password: z.string().min(1, { message: 'Senha obrigatória.' }),
})

export type LoginState =
  | { errors?: { username?: string[]; password?: string[] }; message?: string }
  | undefined

export const CreateUserSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'Usuário deve ter ao menos 3 caracteres.' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Usuário deve conter apenas letras, números e _.' })
    .trim(),
  password: z
    .string()
    .min(8, { message: 'Senha deve ter ao menos 8 caracteres.' })
    .regex(/[a-zA-Z]/, { message: 'Senha deve conter ao menos uma letra.' })
    .regex(/[0-9]/, { message: 'Senha deve conter ao menos um número.' }),
  roles: z
    .array(z.enum(ROLES))
    .min(1, { message: 'Selecione ao menos um perfil.' }),
})

export type CreateUserState =
  | {
      errors?: {
        username?: string[]
        password?: string[]
        roles?: string[]
      }
      message?: string
      success?: boolean
    }
  | undefined

// ─── Núcleos ─────────────────────────────────────────────────────────────────

export type Nucleo = {
  id: string
  name: string
  owner_id: string
  owner_username: string
  member_count: number
  created_at: Date
}

export type NucleoDetail = Nucleo & {
  members: { id: string; username: string }[]
  boards: { id: string; name: string; created_at: Date }[]
}

export const CreateNucleoSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter ao menos 2 caracteres.' }).trim(),
})

export type CreateNucleoState =
  | { errors?: { name?: string[] }; message?: string; success?: boolean }
  | undefined

export const AddMemberSchema = z.object({
  nucleo_id: z.string().uuid(),
  user_id: z.string().uuid({ message: 'Selecione um usuário.' }),
})

export type AddMemberState =
  | { errors?: { user_id?: string[] }; message?: string; success?: boolean }
  | undefined

export const LinkComiteLocalSchema = z.object({
  uniao_id: z.string().uuid(),
  comite_local_id: z.string().uuid({ message: 'Selecione um comitê local.' }),
})

export type LinkComiteLocalState =
  | { errors?: { comite_local_id?: string[] }; message?: string; success?: boolean }
  | undefined

// ─── Kanban ───────────────────────────────────────────────────────────────────

export const KANBAN_COLUMNS = ['a_fazer', 'em_andamento', 'concluido'] as const
export type KanbanColumn = (typeof KANBAN_COLUMNS)[number]

export const KANBAN_COLUMN_LABELS: Record<KanbanColumn, string> = {
  a_fazer: 'A fazer',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
}

export type KanbanCard = {
  id: string
  board_id: string
  column: KanbanColumn
  title: string
  description: string | null
  assignee_id: string | null
  assignee_username: string | null
  due_date: string | null
  position: number
  created_at: Date
  updated_at: Date
}

export type KanbanBoard = {
  id: string
  nucleo_id: string
  name: string
  created_by: string
  created_at: Date
  cards: KanbanCard[]
}

export const CreateBoardSchema = z.object({
  nucleo_id: z.string().uuid(),
  name: z.string().min(2, { message: 'Nome deve ter ao menos 2 caracteres.' }).trim(),
})

export type CreateBoardState =
  | { errors?: { name?: string[] }; message?: string; success?: boolean; boardId?: string }
  | undefined

export const CreateCardSchema = z.object({
  board_id: z.string().uuid(),
  title: z.string().min(1, { message: 'Título obrigatório.' }).trim(),
  description: z.string().optional(),
  assignee_id: z.string().uuid().optional().or(z.literal('')),
  due_date: z.string().optional().or(z.literal('')),
})

export type CreateCardState =
  | { errors?: { title?: string[]; description?: string[] }; message?: string; success?: boolean }
  | undefined

export const UpdateCardSchema = z.object({
  card_id: z.string().uuid(),
  title: z.string().min(1, { message: 'Título obrigatório.' }).trim(),
  description: z.string().optional(),
  assignee_id: z.string().uuid().optional().or(z.literal('')),
  due_date: z.string().optional().or(z.literal('')),
  column: z.enum(KANBAN_COLUMNS),
})

export type UpdateCardState =
  | { errors?: { title?: string[] }; message?: string; success?: boolean }
  | undefined

// ─── Atividades Recorrentes ──────────────────────────────────────────────────────────

export const RECURRENCE_TYPES = ['diaria', 'semanal', 'quinzenal', 'mensal', 'anual'] as const
export type RecurrenceType = (typeof RECURRENCE_TYPES)[number]

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  diaria: 'Diária',
  semanal: 'Semanal',
  quinzenal: 'Quinzenal',
  mensal: 'Mensal',
  anual: 'Anual',
}

export type RecurringActivity = {
  id: string
  nucleo_id: string
  title: string
  description: string | null
  recurrence: RecurrenceType
  start_date: string
  next_date: string
  created_by: string
  created_at: Date
}

export const CreateRecurringActivitySchema = z.object({
  nucleo_id: z.string().uuid(),
  title: z.string().min(2, { message: 'Título deve ter ao menos 2 caracteres.' }).trim(),
  description: z.string().optional(),
  recurrence: z.enum(RECURRENCE_TYPES, { message: 'Selecione a recorrência.' }),
  start_date: z.string().min(1, { message: 'Data inicial obrigatória.' }),
})

export type CreateRecurringActivityState =
  | {
      errors?: {
        title?: string[]
        recurrence?: string[]
        start_date?: string[]
      }
      message?: string
      success?: boolean
    }
  | undefined
