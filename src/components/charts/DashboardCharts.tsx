import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/Card'

const COLORS = ['#0d9488', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899']

interface ChartCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function ChartCard({ title, children, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <h3 className="text-sm font-semibold text-navy-700 mb-4">{title}</h3>
      {children}
    </Card>
  )
}

export function RevenueChart({ data }: { data: { day: string; revenue: number }[] }) {
  return (
    <ChartCard title="Weekly Revenue">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#627d98' }} />
          <YAxis tick={{ fontSize: 12, fill: '#627d98' }} />
          <Tooltip formatter={(v: number) => [`KES ${v.toLocaleString()}`, 'Revenue']} />
          <Area type="monotone" dataKey="revenue" stroke="#0d9488" fill="url(#revenueGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function PatientsChart({ data }: { data: { month: string; patients: number }[] }) {
  return (
    <ChartCard title="Monthly Patients">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#627d98' }} />
          <YAxis tick={{ fontSize: 12, fill: '#627d98' }} />
          <Tooltip />
          <Bar dataKey="patients" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function DepartmentChart({ data }: { data: { name: string; appointments: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.appointments, 0)
  const active = data.filter((d) => d.appointments > 0)

  if (!active.length) {
    return (
      <ChartCard title="Department Performance">
        <p className="text-sm text-navy-500 text-center py-20">No appointments recorded yet</p>
      </ChartCard>
    )
  }

  return (
    <ChartCard title="Department Performance">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={active}
            dataKey="appointments"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={88}
            paddingAngle={2}
          >
            {active.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number, name: string) => [`${value} appointments`, name]} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
        {data.map((d) => {
          const pct = total ? Math.round((d.appointments / total) * 100) : 0
          const activeIndex = active.findIndex((a) => a.name === d.name)
          const color = activeIndex >= 0 ? COLORS[activeIndex % COLORS.length] : '#cbd5e1'
          return (
            <li key={d.name} className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="truncate text-navy-700">{d.name}</span>
              <span className="text-navy-400 shrink-0 ml-auto">{pct}%</span>
            </li>
          )
        })}
      </ul>
    </ChartCard>
  )
}

export function DiseaseChart() {
  const data = [
    { name: 'Hypertension', count: 45 },
    { name: 'Diabetes', count: 38 },
    { name: 'Malaria', count: 32 },
    { name: 'Respiratory', count: 28 },
    { name: 'Other', count: 57 },
  ]

  return (
    <ChartCard title="Top Diseases">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" tick={{ fontSize: 12, fill: '#627d98' }} />
          <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 12, fill: '#627d98' }} />
          <Tooltip />
          <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
