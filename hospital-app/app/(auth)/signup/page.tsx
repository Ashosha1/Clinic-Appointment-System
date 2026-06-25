'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Stethoscope, User } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { signupSchema, type SignupValues } from '@/lib/validations/auth'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: undefined },
  })

  const onSubmit = async (values: SignupValues) => {
    setSubmitting(true)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName, role: values.role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Could not create account',
        description: error.message,
      })
      setSubmitting(false)
      return
    }

    // Email confirmation off → session exists now: write the profile and go on.
    if (data.session && data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        role: values.role,
        full_name: values.fullName,
      })
      if (profileError) {
        toast({
          variant: 'destructive',
          title: 'Account created, but profile setup failed',
          description: profileError.message,
        })
        setSubmitting(false)
        return
      }
      toast({ variant: 'success', title: 'Account created' })
      router.replace('/onboarding')
      return
    }

    // Email confirmation on → no session yet.
    toast({
      variant: 'success',
      title: 'Check your email',
      description: 'We sent a confirmation link to finish setting up your account.',
    })
    setSubmitting(false)
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--txt)]">Create your account</h1>
        <p className="mt-1 text-sm text-[var(--txt2)]">
          Join MediConnect in less than a minute.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" autoComplete="name" placeholder="Jane Doe" {...register('fullName')} />
          {errors.fullName && (
            <p className="text-xs text-[var(--red)]">{errors.fullName.message}</p>
          )}
        </div>

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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-[var(--red)]">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>I’m signing up as</Label>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-3">
                <RoleCard
                  selected={field.value === 'patient'}
                  onSelect={() => field.onChange('patient')}
                  icon={<User size={20} />}
                  title="I’m a Patient"
                  tint="patient"
                />
                <RoleCard
                  selected={field.value === 'doctor'}
                  onSelect={() => field.onChange('doctor')}
                  icon={<Stethoscope size={20} />}
                  title="I’m a Doctor"
                  tint="doctor"
                />
              </div>
            )}
          />
          {errors.role && (
            <p className="text-xs text-[var(--red)]">{errors.role.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--txt2)]">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[var(--p)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

function RoleCard({
  selected,
  onSelect,
  icon,
  title,
  tint,
}: {
  selected: boolean
  onSelect: () => void
  icon: React.ReactNode
  title: string
  tint: 'patient' | 'doctor'
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex flex-col items-center gap-2 rounded-[var(--radius)] border-2 p-4 text-center transition-colors',
        selected
          ? 'border-[var(--p)] bg-[var(--p3)]'
          : 'border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg2)]',
        !selected && tint === 'patient' && 'hover:border-[var(--p)]',
        !selected && tint === 'doctor' && 'hover:border-[var(--blue)]'
      )}
    >
      <span
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full',
          tint === 'patient'
            ? 'bg-[var(--p3)] text-[var(--p)]'
            : 'bg-[var(--blue-light)] text-[var(--blue)]'
        )}
      >
        {icon}
      </span>
      <span className="text-sm font-medium text-[var(--txt)]">{title}</span>
    </button>
  )
}
