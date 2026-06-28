import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Activity, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { signIn, fetchUserProfile } from '@/features/auth/authService'
import { getAuthErrorMessage } from '@/utils/authErrors'
import { getDefaultRoute } from '@/lib/permissions'
import { useAuthStore } from '@/hooks/useAuth'

const schema = z.object({
  identifier: z.string().min(3, 'Enter your phone number or email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof schema>

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setProfile } = useAuthStore()
  const form = useForm<LoginForm>({ resolver: zodResolver(schema) })

  const onLogin = async (data: LoginForm) => {
    setLoading(true)
    setError('')
    try {
      const result = await signIn(data.identifier, data.password)
      if (result.user) {
        const profile = await fetchUserProfile(result.user.id)
        setProfile(profile)
        navigate(getDefaultRoute(profile?.role))
      }
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Login failed. Check your phone/email and password.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900 relative overflow-hidden">
        <div className="relative flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-primary-500 flex items-center justify-center">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold font-display text-white">MediFlow</span>
          </div>
          <h2 className="text-4xl font-bold font-display text-white leading-tight">
            Your health,<br />one click away.
          </h2>
          <p className="mt-4 text-navy-300 text-lg">Book appointments, view records, and manage your care online.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold font-display text-navy-900">Welcome back</h1>
          <p className="text-navy-500 mt-1">Sign in with your phone number or email</p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={form.handleSubmit(onLogin)} className="mt-8 space-y-4">
            <Input
              label="Phone Number or Email"
              {...form.register('identifier')}
              error={form.formState.errors.identifier?.message}
              placeholder="0712 345 678 or you@email.com"
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                {...form.register('password')}
                error={form.formState.errors.password?.message}
              />
              <button type="button" className="absolute right-3 top-[38px] text-navy-400" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full" loading={loading}>Sign In</Button>
          </form>

          <p className="mt-6 text-center text-sm text-navy-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary-600">Register</Link>
          </p>
          <p className="mt-4 text-center">
            <Link to="/" className="text-sm text-navy-400">&larr; Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
