import Link from 'next/link'
import {
  ShieldCheck,
  CalendarPlus,
  Stethoscope,
  Search,
  CalendarCheck,
  Building2,
  Clock,
  Bell,
  History,
  BarChart3,
  CalendarClock,
  Lock,
  Smartphone,
  Zap,
} from 'lucide-react'

import { Faq } from '@/components/marketing/Faq'
import { Logo } from '@/components/shared/Logo'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Button } from '@/components/ui/button'

const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'For clinics', href: '#for-clinics' },
  { label: 'Pricing', href: '#pricing' },
]

const TRUST = [
  { icon: Lock, label: 'HIPAA-ready security' },
  { icon: Clock, label: 'Real-time availability' },
  { icon: Zap, label: 'Instant confirmations' },
  { icon: Smartphone, label: 'Works on any device' },
]

const STEPS = [
  {
    icon: Search,
    title: 'Find your doctor',
    desc: 'Browse by specialty or availability. Real-time open slots — no phone tag.',
  },
  {
    icon: CalendarCheck,
    title: 'Pick a time',
    desc: 'Choose a slot that fits. Instant confirmation to phone and email.',
  },
  {
    icon: Building2,
    title: 'Show up & get care',
    desc: 'Walk in at your time. Full history always one tap away.',
  },
]

const FEATURES = [
  {
    icon: Clock,
    title: 'Real-time availability',
    desc: 'Patients see live open slots, so every booking is one a doctor can actually take.',
  },
  {
    icon: Bell,
    title: 'Automated reminders',
    desc: 'Confirmation and reminder messages to phone and email cut no-shows automatically.',
  },
  {
    icon: History,
    title: 'Full appointment history',
    desc: 'Every visit, prescription, and note in one place — one tap away for patient and doctor.',
  },
  {
    icon: BarChart3,
    title: 'Clinic analytics',
    desc: 'Track volume, wait times, and top doctors with dashboards built for clinic directors.',
  },
  {
    icon: CalendarClock,
    title: 'Easy rescheduling',
    desc: 'Move an appointment in one step — the old slot is freed for someone else instantly.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by design',
    desc: 'Role-scoped access and encryption in transit and at rest keep health data protected.',
  },
]

const STATS = [
  { value: '200+', label: 'Clinics onboarded' },
  { value: '50k+', label: 'Appointments booked' },
  { value: '40%', label: 'Reduction in wait time' },
  { value: '98%', label: 'Patient satisfaction' },
]

const TESTIMONIALS = [
  {
    quote:
      'I booked a specialist in under a minute on my phone. No calls, no hold music — the confirmation hit my inbox before I put the phone down.',
    initials: 'NA',
    name: 'Noor Al-Rashidi',
    role: 'Patient, Muscat',
  },
  {
    quote:
      'No-shows used to wreck my schedule. The automated reminders alone cut them by nearly half, and rescheduling is finally painless.',
    initials: 'RM',
    name: 'Dr. Rashid Al-Mani',
    role: 'Cardiologist',
  },
  {
    quote:
      'For the first time I can see the whole clinic at a glance — volume, wait times, which doctors are stretched. The visibility changed how we plan.',
    initials: 'AA',
    name: 'Ahmed Al-Amri',
    role: 'Clinic Director',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--txt)]">
      {/* NAVBAR */}
      <header className="sticky top-0 z-20 h-14 border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <Logo size={36} />
            <span className="flex flex-col leading-none">
              <span className="text-xl font-semibold tracking-tight">
                MediConnect
              </span>
              <span className="hidden text-[11px] text-[var(--txt3)] sm:block">
                Your trusted path to care
              </span>
            </span>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-[var(--txt2)] transition-colors hover:text-[var(--txt)]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="px-8 pb-[60px] pt-[72px] text-center">
          <h1 className="mx-auto max-w-2xl text-[26px] font-medium leading-tight sm:text-[38px]">
            Healthcare scheduling,{' '}
            <span className="text-[var(--p)]">done right.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[460px] text-[15px] leading-relaxed text-[var(--txt2)]">
            Book appointments in seconds, reduce waiting time, and give doctors
            the tools they need to focus on what matters — patients.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                <CalendarPlus size={16} aria-hidden="true" />
                Book an appointment
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/login">
                <Stethoscope size={16} aria-hidden="true" />
                I&apos;m a doctor
              </Link>
            </Button>
          </div>

          {/* Trust bar */}
          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-8">
            {TRUST.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center justify-center gap-2 text-sm text-[var(--txt2)]"
              >
                <Icon size={16} className="text-[var(--p)]" aria-hidden="true" />
                {label}
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="bg-[var(--bg2)] px-8 py-[52px] text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--p)]">
            How it works
          </p>
          <h2 className="mt-2 text-2xl font-medium">
            Three steps to your appointment
          </h2>
          <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-6 text-left"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--p3)] text-sm font-semibold text-[var(--p)]">
                  {i + 1}
                </span>
                <Icon
                  size={24}
                  className="mt-4 text-[var(--p)]"
                  aria-hidden="true"
                />
                <h3 className="mt-3 text-base font-medium">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--txt2)]">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="bg-[var(--bg)] px-8 py-[52px] text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--p)]">
            Features
          </p>
          <h2 className="mt-2 text-2xl font-medium">
            Everything the clinic needs
          </h2>
          <div className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-6 text-left"
              >
                <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[var(--radius-sm)] bg-[var(--p3)] text-[var(--p)]">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-medium">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--txt2)]">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* STATS BAND */}
        <section id="for-clinics" className="px-8 py-[52px]">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 rounded-[var(--radius)] bg-[var(--p)] px-8 py-10 md:grid-cols-4">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-[28px] font-semibold text-white">
                  {value}
                </div>
                <div className="mt-1 text-[11px] text-white/65">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="bg-[var(--bg2)] px-8 py-[52px] text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--p)]">
            Loved by clinics & patients
          </p>
          <h2 className="mt-2 text-2xl font-medium">
            Trusted across the region
          </h2>
          <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-3">
            {TESTIMONIALS.map(({ quote, initials, name, role }) => (
              <figure
                key={name}
                className="flex flex-col rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-6 text-left"
              >
                <blockquote className="flex-1 text-sm italic leading-relaxed text-[var(--txt2)]">
                  “{quote}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--p3)] text-sm font-semibold text-[var(--p)]"
                  >
                    {initials}
                  </span>
                  <span className="leading-tight">
                    <span className="block text-sm font-medium text-[var(--txt)]">
                      {name}
                    </span>
                    <span className="block text-xs text-[var(--txt3)]">
                      {role}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="pricing" className="bg-[var(--bg)] px-8 py-[52px] text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--p)]">
            Questions
          </p>
          <h2 className="mt-2 text-2xl font-medium">Frequently asked</h2>
          <Faq />
        </section>

        {/* CTA BAND */}
        <section className="px-8 py-[52px]">
          <div className="mx-auto max-w-5xl rounded-[var(--radius)] border border-[var(--border)] bg-[var(--p3)] px-8 py-12 text-center">
            <h2 className="text-2xl font-medium text-[var(--txt)]">
              Ready to simplify your clinic?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--txt2)]">
              Join 200+ clinics already saving time with MediConnect.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  <CalendarPlus size={16} aria-hidden="true" />
                  Book an appointment
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/signup">Register your clinic</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border)] bg-[var(--bg2)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-8 py-10 md:flex-row">
          <div className="flex items-center gap-2">
            <Logo size={26} />
            <span className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight">
                MediConnect
              </span>
              <span className="text-[10px] text-[var(--txt3)]">
                Your trusted path to care
              </span>
            </span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {['Privacy', 'Terms', 'Support', 'Contact'].map((label) => (
              <a
                key={label}
                href="#"
                className="text-sm text-[var(--txt2)] transition-colors hover:text-[var(--txt)]"
              >
                {label}
              </a>
            ))}
          </nav>
          <p className="text-xs text-[var(--txt3)]">
            © 2026 MediConnect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
