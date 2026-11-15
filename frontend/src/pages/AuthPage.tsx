import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { Card } from '../components/common/Card'

export function AuthPage() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (user) return <Navigate to="/" replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (creatingAccount) await register({ name, email, phone: phone || undefined, password })
      else await login({ email, password })
      navigate('/', { replace: true })
    } catch (cause: any) {
      setError(cause?.response?.data?.detail || 'Não foi possível autenticar. Confira os dados e tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-slate-900">Terra<span className="text-primary">Viva</span></div>
          <p className="text-sm text-slate-500 mt-2">{creatingAccount ? 'Crie sua conta de produtor rural' : 'Entre na sua conta'}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {creatingAccount && <>
            <Input label="Nome" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
            <Input label="Telefone (opcional)" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </>}
          <Input label="E-mail" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input label="Senha" type="password" autoComplete={creatingAccount ? 'new-password' : 'current-password'} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
          {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
          <Button type="submit" variant="primary" loading={saving} className="w-full">
            {creatingAccount ? 'Criar conta' : 'Entrar'}
          </Button>
        </form>
        <button type="button" className="w-full mt-5 text-sm text-primary hover:underline" onClick={() => { setCreatingAccount(!creatingAccount); setError('') }}>
          {creatingAccount ? 'Já tem uma conta? Entrar' : 'Ainda não tem conta? Cadastre-se'}
        </button>
      </Card>
    </main>
  )
}
