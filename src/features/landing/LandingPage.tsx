import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, Shield, Zap, Cloud, Smartphone, Clock,
  Users, FlaskConical, Pill, Receipt,
  BarChart3, Package, Calendar, UserCog, ChevronDown,
  Heart, Mail, Phone, MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

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

const features = [
  { icon: Users, title: 'Patient Management', desc: 'Complete patient records, history, and QR identification' },
  { icon: FlaskConical, title: 'Laboratory', desc: 'Order tests, track results, and notify doctors instantly' },
  { icon: Pill, title: 'Pharmacy', desc: 'Medicine dispensing, stock alerts, and expiry tracking' },
  { icon: Receipt, title: 'Billing', desc: 'Invoices, M-Pesa, insurance claims, and receipts' },
  { icon: BarChart3, title: 'Reports', desc: 'PDF reports for revenue, admissions, and analytics' },
  { icon: Package, title: 'Inventory', desc: 'Track equipment, consumables, and purchase orders' },
  { icon: Calendar, title: 'Appointments', desc: 'Calendar scheduling with conflict detection' },
  { icon: UserCog, title: 'Doctors Portal', desc: 'Prescriptions, lab orders, and patient admissions' },
]

const whyUs = [
  { icon: Shield, title: 'Secure', desc: 'Row-level security, encrypted storage, and audit logs' },
  { icon: Zap, title: 'Fast', desc: 'Real-time updates powered by cloud infrastructure' },
  { icon: Cloud, title: 'Cloud Based', desc: 'Access from anywhere with 99.9% uptime' },
  { icon: Smartphone, title: 'Mobile Friendly', desc: 'Responsive design for tablets and phones' },
  { icon: Clock, title: 'Real Time', desc: 'Live queue, bed status, and notifications' },
]

const testimonials = [
  { name: 'Dr. Sarah Kimani', role: 'Chief Medical Officer', text: 'MediFlow transformed how we manage patient flow. Appointments and lab results are seamless.' },
  { name: 'James Ochieng', role: 'Hospital Administrator', text: 'The billing module with M-Pesa integration saved us hours every day. Highly recommended.' },
  { name: 'Grace Wanjiku', role: 'Head Nurse', text: 'Bed management and queue system keep our wards organized. Staff love the intuitive interface.' },
]

const faqs = [
  { q: 'Is MediFlow suitable for small clinics?', a: 'Yes! MediFlow scales from small clinics to large hospitals with multiple departments and wards.' },
  { q: 'How secure is patient data?', a: 'We use Supabase with row-level security, encrypted storage, and comprehensive audit logging for HIPAA-grade protection.' },
  { q: 'Can patients book appointments online?', a: 'Absolutely. The patient portal lets patients book appointments, view records, and download prescriptions.' },
  { q: 'What payment methods are supported?', a: 'Cash, card, M-Pesa, and insurance claims are all supported with automatic receipt generation.' },
]

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold font-display text-navy-900">Medi<span className="text-primary-600">Flow</span></span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-navy-600">
              <a href="#home" className="hover:text-primary-600 transition-colors">Home</a>
              <a href="#about" className="hover:text-primary-600 transition-colors">About Us</a>
              <a href="#departments" className="hover:text-primary-600 transition-colors">Departments</a>
              <a href="#doctors" className="hover:text-primary-600 transition-colors">Doctors</a>
              <a href="#contact" className="hover:text-primary-600 transition-colors">Contact</a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Register</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="home" className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-sky-50" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent-400/20 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700 mb-6">
                <Heart className="h-4 w-4" />
                Trusted by 50+ healthcare facilities
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-navy-900 leading-tight">
                Modern Healthcare,{' '}
                <span className="text-gradient">Simplified</span>
              </h1>
              <p className="mt-6 text-lg text-navy-600 leading-relaxed max-w-lg">
                Cloud-based hospital management for patient care, appointments, billing, pharmacy, and more — all in one beautiful platform.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/register">
                  <Button size="lg">Get Started Free</Button>
                </Link>
                <a href="#features">
                  <Button variant="outline" size="lg">Explore Features</Button>
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl bg-gradient-to-br from-navy-900 to-navy-800 p-8 shadow-2xl shadow-navy-900/30">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Today's Patients", value: '142', color: 'from-primary-400 to-primary-600' },
                    { label: 'Appointments', value: '38', color: 'from-sky-400 to-sky-600' },
                    { label: 'Revenue Today', value: 'KES 84K', color: 'from-emerald-400 to-emerald-600' },
                    { label: 'Beds Available', value: '23', color: 'from-amber-400 to-amber-600' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl bg-white/10 backdrop-blur p-4">
                      <p className="text-xs text-navy-300">{stat.label}</p>
                      <p className={`text-2xl font-bold font-display mt-1 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-32 rounded-2xl bg-white/5 flex items-end gap-1 p-4">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-primary-600 to-primary-400 opacity-80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="departments" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-display text-navy-900">Everything Your Hospital Needs</h2>
            <p className="text-navy-500 mt-3 max-w-2xl mx-auto">Comprehensive modules designed for every department, from reception to pharmacy.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-2xl border border-navy-100 p-6 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-100/50 transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold font-display text-navy-900">{title}</h3>
                <p className="mt-2 text-sm text-navy-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="about" className="py-20 bg-gradient-to-r from-navy-900 to-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { end: 125000, label: 'Patients Served', suffix: '+' },
              { end: 350, label: 'Doctors', suffix: '+' },
              { end: 24, label: 'Departments' },
              { end: 450, label: 'Beds Available' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl font-bold font-display text-white">
                  <AnimatedCounter end={stat.end} suffix={stat.suffix} />
                </p>
                <p className="text-navy-300 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-display text-navy-900">Why Choose MediFlow</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {whyUs.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-6">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary-600">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-4 font-semibold text-navy-900">{title}</h3>
                <p className="mt-2 text-sm text-navy-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold font-display text-navy-900 text-center mb-16">What Staff Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-navy-100 p-8">
                <p className="text-navy-600 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
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

      {/* FAQ */}
      <section id="faq" className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold font-display text-navy-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-navy-100 bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left font-medium text-navy-900 hover:bg-navy-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronDown className={`h-5 w-5 text-navy-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-navy-600 text-sm leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-navy-950 text-navy-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold font-display text-white">MediFlow</span>
              </div>
              <p className="text-sm">Modern cloud-based hospital management for the future of healthcare.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">About</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-primary-400 transition-colors">Our Story</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-primary-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@mediflow.health</li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +254 700 123 456</li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Nairobi, Kenya</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-navy-800 mt-12 pt-8 text-center text-sm">
            &copy; {new Date().getFullYear()} MediFlow Hospital Management System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
