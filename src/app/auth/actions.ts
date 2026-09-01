'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!isSupabaseConfigured()) {
    // Demo mode: Set a demo cookie so we can mock/simulate an active user session in middleware or local state
    const cookieStore = await cookies()
    cookieStore.set('demo-user', email, { maxAge: 60 * 60 * 24 })
    revalidatePath('/dashboard', 'layout')
    redirect('/dashboard')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!isSupabaseConfigured()) {
    const cookieStore = await cookies()
    cookieStore.set('demo-user', email, { maxAge: 60 * 60 * 24 })
    revalidatePath('/dashboard', 'layout')
    redirect('/dashboard')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}

export async function signout() {
  if (!isSupabaseConfigured()) {
    const cookieStore = await cookies()
    cookieStore.delete('demo-user')
    revalidatePath('/')
    redirect('/')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  redirect('/')
}
