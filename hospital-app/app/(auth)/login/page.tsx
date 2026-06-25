'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { dashboardFor } from '@/lib/auth/roles'
import { loginSchema, type LoginValues } from '@/lib/validations/auth'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginValues) => {
    setSubmitting(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      const unverified = /email not confirmed/i.test(error.message)
      if (unverified) {
        toast({
          variant: 'destructive',
          title: 'Email not verified',
          description: 'Check your inbox for the confirmation link, then sign in.',
        })
      } else {
        setError('password', { message: 'Invalid email or password.' })
        toast({
          variant: 'destructive',
          title: 'Sign in failed',
          description: 'The email or password you entered is incorrect.',
        })
      }
      setSubmitting(false)
      return
    }

    // Resolve role to land on the correct dashboard.
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, phone')
      .eq('user_id', user!.id)
      .maybeSingle()

    if (!profile) {
      router.replace('/onboarding')
      return
    }

    toast({ variant: 'success', title: 'Welcome back' })
    router.replace(profile.phone ? dashboardFor(profile.role) : '/onboarding')
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--txt)]">Welcome back</h1>
        <p className="mt-1 text-sm text-[var(--txt2)]">
          Sign in to manage your appointments.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-[var(--red)]">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-[var(--red)]">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />}
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--txt2)]">
        Don’t have an account?{' '}
        <Link href="/signup" className="font-medium text-[var(--p)] hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
