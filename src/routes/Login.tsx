import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

type FormValues = {
  login: string
  password: string
}

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const enabled = useAuthStore((s) => s.enabled)
  const signIn = useAuthStore((s) => s.signIn)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>()

  // Where to go after login — back to where the user came from, or home.
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    const { error } = await signIn(values.login, values.password)
    if (error) {
      setServerError(error)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <article className="mx-auto max-w-md">
      <h1 className="font-display text-4xl uppercase tracking-widest text-parchment">
        Logowanie
      </h1>

      {!enabled && (
        <p className="font-body mt-4 border border-gold-muted bg-teal-dark/40 p-4 italic text-parchment/80">
          Supabase nie jest skonfigurowane (brak <code className="font-mono">.env</code>).
          Logowanie niedostępne — strona działa w trybie tylko-do-odczytu.
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label className="font-display block text-xs uppercase tracking-widest text-gold-muted">
            Login
          </label>
          <input
            type="text"
            autoComplete="username"
            disabled={!enabled}
            {...register('login', {
              required: 'Login jest wymagany',
            })}
            className="font-body mt-1 w-full border border-gold-muted bg-parchment-warm px-3 py-2 text-ink outline-none focus:border-gold disabled:opacity-50"
          />
          {errors.login && (
            <p className="font-mono mt-1 text-xs text-gold-dark">{errors.login.message}</p>
          )}
        </div>

        <div>
          <label className="font-display block text-xs uppercase tracking-widest text-gold-muted">
            Hasło
          </label>
          <input
            type="password"
            autoComplete="current-password"
            disabled={!enabled}
            {...register('password', { required: 'Hasło jest wymagane' })}
            className="font-body mt-1 w-full border border-gold-muted bg-parchment-warm px-3 py-2 text-ink outline-none focus:border-gold disabled:opacity-50"
          />
          {errors.password && (
            <p className="font-mono mt-1 text-xs text-gold-dark">{errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <p className="font-body border-l-2 border-gold bg-gold/10 px-3 py-2 text-sm text-parchment">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={!enabled || isSubmitting}
          className="font-display w-full border border-gold bg-teal-dark px-4 py-2 uppercase tracking-wider text-gold transition hover:bg-gold hover:text-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Logowanie…' : 'Zaloguj'}
        </button>
      </form>
    </article>
  )
}
