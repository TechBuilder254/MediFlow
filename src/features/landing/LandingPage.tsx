import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, Shield, Zap, Cloud, Smartphone, Clock,
  Users, FlaskConical, Pill, Receipt,
  BarChart3, Package, Calendar, UserCog, ChevronDown,
  Heart, Mail, Phone, MapPin, Menu, X, ArrowRight,
  CheckCircle2, Star, Stethoscope, Building2, Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

function AnimatedCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = end / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [end])
  return <span>{count.toLocaleString()}{suffix}</span>
}

const NAV_LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#features', label: 'Features' },
  { href: '#about', label: 'About' },
  { href: '#testimonials', label: 'Reviews' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'Contact' },
]

const features = [
  { icon: Users, title: 'Patient Management', desc: 'Complete records, medical history, and QR identification at check-in.', color: 'from-teal-500 to-emerald-600' },
  { icon: FlaskConical, title: 'Laboratory', desc: 'Order tests, track results, and notify doctors in real time.', color: 'from-sky-500 to-blue-600' },
  { icon: Pill, title: 'Pharmacy', desc: 'Dispensing workflows, stock alerts, and expiry tracking.', color: 'from-violet-500 to-purple-600' },
  { icon: Receipt, title: 'Billing', desc: 'Invoices, M-Pesa, insurance claims, and digital receipts.', color: 'from-amber-500 to-orange-600' },
  { icon: BarChart3, title: 'Reports', desc: 'Revenue, admissions, and department analytics dashboards.', color: 'from-rose-500 to-pink-600' },
  { icon: Package, title: 'Inventory', desc: 'Equipment, consumables, and purchase order management.', color: 'from-cyan-500 to-teal-600' },
  { icon: Calendar, title: 'Appointments', desc: 'Online booking, doctor schedules, and queue management.', color: 'from-primary-500 to-primary-700' },
  { icon: UserCog, title: 'Doctors Portal', desc: 'Consultations, prescriptions, lab orders, and admissions.', color: 'from-indigo-500 to-blue-700' },
]

const steps = [
  { step: '01', title: 'Register & onboard', desc: 'Patients sign up instantly. Staff accounts are created by your hospital admin.', icon: Users },
  { step: '02', title: 'Book & consult', desc: 'Appointments flow from patient portal to reception, nurse, and doctor.', icon: Stethoscope },
  { step: '03', title: 'Treat & bill', desc: 'Lab, pharmacy, and billing modules complete the care journey in one system.', icon: Building2 },
]

const whyUs = [
  { icon: Shield, title: 'Secure by design', desc: 'Row-level security, encrypted storage, and full audit trails.' },
  { icon: Zap, title: 'Lightning fast', desc: 'Real-time dashboards and instant updates across every department.' },
  { icon: Cloud, title: 'Cloud native', desc: 'Access from anywhere — clinic, ward, or remote — with 99.9% uptime.' },
  { icon: Smartphone, title: 'Mobile ready', desc: 'Beautiful on phones and tablets for staff and patients on the go.' },
  { icon: Clock, title: 'Live operations', desc: 'Queue boards, bed status, and alerts that keep teams in sync.' },
]

const testimonials = [
  { name: 'Dr. Sarah Kimani', role: 'Chief Medical Officer', text: 'MediFlow transformed how we manage patient flow. Appointments and lab results are seamless.', rating: 5 },
  { name: 'James Ochieng', role: 'Hospital Administrator', text: 'The billing module with M-Pesa integration saved us hours every day. Highly recommended.', rating: 5 },
  { name: 'Grace Wanjiku', role: 'Head Nurse', text: 'Bed management and queue system keep our wards organized. Staff love the intuitive interface.', rating: 5 },
]

const faqs = [
  { q: 'Is MediFlow suitable for small clinics?', a: 'Yes! MediFlow scales from small clinics to large hospitals with multiple departments and wards.' },
  { q: 'How secure is patient data?', a: 'We use Supabase with row-level security, encrypted storage, and comprehensive audit logging for enterprise-grade protection.' },
  { q: 'Can patients book appointments online?', a: 'Absolutely. The patient portal lets patients book appointments, view records, track queue position, and download prescriptions.' },
  { q: 'What payment methods are supported?', a: 'Cash, card, M-Pesa, and insurance claims are all supported with automatic receipt generation.' },
]

const TRUSTED_BY = ['Nairobi General', 'Coast Medical', 'Rift Valley Clinic', 'Lakeview Hospital', 'Kenya Care Centre']

const CARE_JOURNEY = [
  { icon: Calendar, label: 'Book online', desc: 'Patient portal', color: 'bg-primary-600' },
  { icon: Users, label: 'Check in', desc: 'Reception desk', color: 'bg-sky-600' },
  { icon: Stethoscope, label: 'Consult', desc: 'Doctor review', color: 'bg-violet-600' },
  { icon: Receipt, label: 'Pay & go', desc: 'M-Pesa billing', color: 'bg-emerald-600' },
]

function HeroCareVisual() {
  return (
    <div className="relative mx-auto max-w-lg lg:max-w-none">
      {/* Soft backdrop */}
      <div className="absolute inset-4 rounded-[2rem] bg-gradient-to-br from-primary-100/80 via-white to-sky-100/60 blur-sm" />
      <div className="relative rounded-[2rem] border border-primary-100/80 bg-white/70 backdrop-blur-sm shadow-2xl shadow-primary-900/10 p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-700">
            <Heart className="h-3.5 w-3.5" />
            End-to-end patient journey
          </div>
          <p className="mt-4 text-2xl sm:text-3xl font-bold font-display text-navy-900 leading-snug">
            One platform.<br />
            <span className="text-gradient">Every touchpoint.</span>
          </p>
        </div>

        {/* Journey steps */}
        <div className="relative">
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary-300 via-primary-400 to-emerald-400 hidden sm:block" />
          <div className="space-y-4">
            {CARE_JOURNEY.map(({ icon: Icon, label, desc, color }, i) => (
              <div
                key={label}
                className="relative flex items-center gap-4 rounded-2xl border border-navy-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-primary-100 transition-all sm:ml-0"
                style={{ marginLeft: i % 2 === 1 ? '1.5rem' : 0 }}
              >
                <div className={cn('h-12 w-12 rounded-xl text-white flex items-center justify-center shrink-0 shadow-lg', color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-navy-900">{label}</p>
                  <p className="text-sm text-navy-500">{desc}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-primary-500 ml-auto shrink-0 hidden sm:block" />
              </div>
            ))}
          </div>
        </div>

        {/* Connected departments */}
        <div className="mt-8 pt-6 border-t border-navy-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-navy-400 text-center mb-4">
            All departments connected
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: FlaskConical, label: 'Lab' },
              { icon: Pill, label: 'Pharmacy' },
              { icon: Building2, label: 'Wards' },
              { icon: BarChart3, label: 'Reports' },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-navy-100 px-3 py-1.5 text-xs font-medium text-navy-600"
              >
                <Icon className="h-3.5 w-3.5 text-primary-600" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Floating accents */}
      <div className="absolute -top-3 -right-2 sm:right-0 landing-float hidden sm:block">
        <div className="rounded-2xl bg-white border border-navy-100 shadow-xl px-4 py-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-navy-500">Appointment confirmed</p>
            <p className="text-sm font-semibold text-navy-900">Tomorrow, 10:00 AM</p>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-4 -left-2 sm:left-0 landing-float-delayed">
        <div className="rounded-2xl bg-primary-600 text-white shadow-xl px-4 py-3">
          <p className="text-xs text-primary-100">Avg. wait time</p>
          <p className="text-xl font-bold font-display">12 min</p>
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navbar */}
      <nav
        className={cn(
          'fixed top-0 inset-x-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-navy-100 shadow-sm shadow-navy-900/5'
            : 'bg-transparent',
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[4.25rem]">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-600/25 group-hover:scale-105 transition-transform">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold font-display text-navy-900">
                Medi<span className="text-primary-600">Flow</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-navy-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="shadow-md shadow-primary-600/20">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-navy-700 hover:bg-navy-50"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-navy-100 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-navy-700 hover:bg-primary-50 hover:text-primary-700"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 flex gap-2">
              <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full" size="sm">Login</Button>
              </Link>
              <Link to="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button className="w-full" size="sm">Register</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="home" className="relative pt-28 lg:pt-36 pb-20 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/80 via-white to-white" />
        <div className="absolute inset-0 landing-grid opacity-60" />
        <div className="absolute top-24 -right-20 w-[28rem] h-[28rem] bg-primary-300/25 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent-400/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 backdrop-blur px-4 py-1.5 text-sm font-medium text-primary-800 mb-6 shadow-sm">
                <Sparkles className="h-4 w-4 text-primary-600" />
                Kenya&apos;s modern hospital management platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold font-display text-navy-900 leading-[1.08] tracking-tight">
                Healthcare operations,{' '}
                <span className="text-gradient">beautifully unified</span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-navy-600 leading-relaxed max-w-xl">
                From patient registration to billing — run your entire hospital on one fast, secure, cloud-based platform built for Kenyan healthcare.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/register">
                  <Button size="lg" className="shadow-lg shadow-primary-600/25 px-8">
                    Start free today <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="outline" size="lg" className="bg-white/80">
                    Explore features
                  </Button>
                </a>
              </div>

              <ul className="mt-10 grid sm:grid-cols-2 gap-3">
                {['No credit card required', 'Patient portal included', 'M-Pesa ready billing', 'Role-based staff access'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-navy-600">
                    <CheckCircle2 className="h-4 w-4 text-primary-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <HeroCareVisual />
          </div>

          {/* Trust bar */}
          <div className="mt-16 lg:mt-20 pt-8 border-t border-navy-100/80">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-navy-400 mb-5">
              Trusted by healthcare teams across Kenya
            </p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
              {TRUSTED_BY.map((name) => (
                <span key={name} className="text-sm font-semibold text-navy-400/90">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28 bg-slate-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 lg:mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary-600 mb-3">Platform modules</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-navy-900">
              Everything your hospital needs
            </h2>
            <p className="text-navy-500 mt-4 text-lg">
              Eight powerful modules that work together — from the front desk to the pharmacy counter.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group relative rounded-2xl bg-white border border-navy-100/80 p-6 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-100/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={cn('h-12 w-12 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-lg', color)}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-semibold font-display text-navy-900 text-lg">{title}</h3>
                <p className="mt-2 text-sm text-navy-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary-600 mb-3">How it works</p>
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-navy-900 leading-tight">
                From registration to discharge in three steps
              </h2>
              <p className="mt-4 text-navy-600 text-lg">
                MediFlow connects patients, clinical staff, and administration in one seamless workflow.
              </p>
            </div>
            <div className="space-y-4">
              {steps.map(({ step, title, desc, icon: Icon }) => (
                <div key={step} className="flex gap-5 rounded-2xl border border-navy-100 bg-slate-50/50 p-5 hover:bg-primary-50/40 hover:border-primary-100 transition-colors">
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <span className="text-xs font-bold text-primary-600">{step}</span>
                    <div className="h-11 w-11 rounded-xl bg-primary-600 text-white flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900 font-display">{title}</h3>
                    <p className="mt-1 text-sm text-navy-600 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="about" className="relative py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-primary-900" />
        <div className="absolute inset-0 opacity-20 landing-grid" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">Built for scale</h2>
            <p className="text-navy-300 mt-3 max-w-xl mx-auto">Numbers that reflect real hospital operations powered by MediFlow.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { end: 125000, label: 'Patients served', suffix: '+' },
              { end: 350, label: 'Doctors onboarded', suffix: '+' },
              { end: 24, label: 'Departments supported' },
              { end: 450, label: 'Beds managed' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur p-8 text-center">
                <p className="text-4xl lg:text-5xl font-bold font-display text-white">
                  <AnimatedCounter end={stat.end} suffix={stat.suffix} />
                </p>
                <p className="text-navy-300 mt-2 text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary-600 mb-3">Why MediFlow</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-navy-900">Designed for modern hospitals</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {whyUs.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-navy-100 bg-gradient-to-b from-white to-slate-50 p-6 text-center hover:shadow-lg hover:border-primary-100 transition-all">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center ring-4 ring-primary-50">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-4 font-semibold text-navy-900">{title}</h3>
                <p className="mt-2 text-sm text-navy-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary-600 mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-navy-900">Loved by hospital staff</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl bg-white border border-navy-100 p-8 shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex gap-0.5 text-amber-400 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-navy-700 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-6 pt-6 border-t border-navy-50 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold text-sm">
                    {t.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">{t.name}</p>
                    <p className="text-sm text-navy-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-700 via-primary-600 to-accent-500" />
            <div className="absolute inset-0 landing-grid opacity-30" />
            <div className="relative px-8 py-12 sm:px-12 sm:py-14 text-center">
              <Heart className="h-10 w-10 text-white/90 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                Ready to modernize your hospital?
              </h2>
              <p className="mt-3 text-primary-100 max-w-lg mx-auto">
                Join healthcare facilities across Kenya using MediFlow to deliver better patient care.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/register">
                  <Button size="lg" className="bg-white text-primary-800 hover:bg-primary-50 shadow-lg">
                    Create free account
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-white/60 text-white hover:bg-white/10">
                    Staff login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary-600 mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-navy-900">Common questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-2xl border overflow-hidden transition-colors',
                  openFaq === i ? 'border-primary-200 bg-primary-50/30' : 'border-navy-100 bg-white',
                )}
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left font-medium text-navy-900 hover:bg-navy-50/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronDown className={cn('h-5 w-5 text-navy-400 shrink-0 transition-transform', openFaq === i && 'rotate-180 text-primary-600')} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-navy-600 text-sm leading-relaxed border-t border-navy-100/80 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-navy-950 text-navy-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="h-9 w-9 rounded-xl bg-primary-600 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold font-display text-white">MediFlow</span>
              </div>
              <p className="text-sm leading-relaxed text-navy-400">
                Modern cloud-based hospital management for clinics and hospitals across Kenya.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="hover:text-primary-400 transition-colors">Features</a></li>
                <li><a href="#about" className="hover:text-primary-400 transition-colors">About</a></li>
                <li><Link to="/register" className="hover:text-primary-400 transition-colors">Patient portal</Link></li>
                <li><Link to="/login" className="hover:text-primary-400 transition-colors">Staff login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-primary-400 transition-colors">Privacy policy</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Terms of service</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Data protection</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-primary-500 shrink-0" />
                  info@mediflow.health
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-primary-500 shrink-0" />
                  +254 700 123 456
                </li>
                <li className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-primary-500 shrink-0" />
                  Nairobi, Kenya
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-navy-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-navy-500">
            <p>&copy; {new Date().getFullYear()} MediFlow Hospital Management System. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-primary-500" />
              Built for better healthcare
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
