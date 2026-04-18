'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { LoginSchema, type LoginState } from '@/app/lib/definitions'
import { getUserByUsername } from '@/app/lib/dal'
import { createSession, deleteSession } from '@/app/lib/session'

export async function login(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const validated = LoginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { username, password } = validated.data

  const user = await getUserByUsername(username)
  if (!user) {
    return { message: 'E-mail ou senha inválidos.' }
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash)
  if (!passwordMatch) {
    return { message: 'E-mail ou senha inválidos.' }
  }

  await createSession(user.id, user.roles)
  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
