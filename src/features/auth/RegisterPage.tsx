import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Activity, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { registerPatient } from '@/features/auth/authService'
import { getAuthErrorMessage } from '@/utils/authErrors'
import { normalizePhone } from '@/utils/patientFlow'

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  nationalId: z.union([
    z.literal(''),
    z.string().min(5, 'National ID must be at least 5 characters'),
  ]),
  phone: z.string().refine((v) => normalizePhone(v).length >= 9, 'Valid phone number required'),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Select gender' }),
  password: z.string().min(6, 'At least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

type RegisterForm = z.infer<typeof schema>

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const form = useForm<RegisterForm>({ resolver: zodResolver(schema) })

  const onRegister = async (data: RegisterForm) => {
    setLoading(true)
    setError('')
    try {
      const result = await registerPatient({
        fullName: data.fullName,
        nationalId: data.nationalId || undefined,
        phone: normalizePhone(data.phone),
        email: data.email.trim(),
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        password: data.password,
      })
      if (result.user) {
        navigate('/portal/complete-profile')
      }
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Registration failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-xl bg-primary-600 flex items-center justify-center">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold font-display">MediFlow</span>
        </Link>

        <div className="bg-white rounded-2xl border border-navy-100 p-8 shadow-sm">
          <h1 className="text-2xl font-bold font-display text-navy-900">Create your account</h1>
          <p className="text-navy-500 mt-1 text-sm">No email verification — instant access to your portal</p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={form.handleSubmit(onRegister)} className="mt-6 space-y-4">
            <Input label="Full Name" {...form.register('fullName')} error={form.formState.errors.fullName?.message} placeholder="Alexander Kamande" />
            <Input label="National ID / Passport (Optional)" {...form.register('nationalId')} error={form.formState.errors.nationalId?.message} placeholder="12345678" />
            <Input
              label="Phone Number"
              inputMode="numeric"
              autoComplete="tel"
              {...form.register('phone', {
                onChange: (e) => {
                  const compact = normalizePhone(e.target.value)
                  if (compact !== e.target.value) {
                    form.setValue('phone', compact, { shouldValidate: true })
                  }
                },
              })}
              error={form.formState.errors.phone?.message}
              placeholder="0712345678"
            />
            <Input label="Email" type="email" {...form.register('email')} error={form.formState.errors.email?.message} placeholder="you@email.com" />
            <Input label="Date of Birth" type="date" {...form.register('dateOfBirth')} error={form.formState.errors.dateOfBirth?.message} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-navy-700">Gender</label>
              <select {...form.register('gender')} className="w-full rounded-xl border border-navy-200 px-4 py-2.5 text-sm">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {form.formState.errors.gender && <p className="text-xs text-danger">{form.formState.errors.gender.message}</p>}
            </div>
            <div className="relative">
              <Input label="Password" type={showPassword ? 'text' : 'password'} {...form.register('password')} error={form.formState.errors.password?.message} />
              <button type="button" className="absolute right-3 top-[38px] text-navy-400" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input label="Confirm Password" type="password" {...form.register('confirmPassword')} error={form.formState.errors.confirmPassword?.message} />
            <Button type="submit" className="w-full" loading={loading}>Create Account</Button>
          </form>

          <p className="mt-6 text-center text-sm text-navy-500">
            Already have an account? <Link to="/login" className="font-semibold text-primary-600">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
