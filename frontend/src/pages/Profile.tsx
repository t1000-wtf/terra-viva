import { useEffect, useState, type FormEvent } from 'react'
import { Save, UserRound } from 'lucide-react'
import { usersApi } from '../api/users'
import { useAuth } from '../contexts/AuthContext'
import type { FarmerProfileFull } from '../types'
import { PageHeader } from '../components/common/PageHeader'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { Select } from '../components/common/Select'
import { Spinner } from '../components/common/Spinner'

export function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [profile, setProfile] = useState<FarmerProfileFull | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setName(user?.name || '')
    setPhone(user?.phone || '')
    usersApi.getFarmerProfile()
      .then(setProfile)
      .catch((error) => setMessage(error?.response?.data?.detail || 'Não foi possível carregar o perfil.'))
      .finally(() => setLoading(false))
  }, [user])

  const update = (key: keyof FarmerProfileFull, value: string | number | boolean) => {
    setProfile((current) => current ? { ...current, [key]: value } : current)
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!profile) return
    setSaving(true)
    setMessage('')
    try {
      await Promise.all([
        usersApi.updateUserProfile({ name, phone: phone || undefined }),
        usersApi.updateFarmerProfile(profile),
      ])
      await refreshUser()
      setMessage('Perfil atualizado com sucesso.')
    } catch (error: any) {
      setMessage(error?.response?.data?.detail || 'Não foi possível salvar o perfil.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Perfil do Produtor" description="Gerencie seus dados pessoais e informações de produção." />
      <Card className="p-6">
        {message && <p role="status" className="mb-5 rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700">{message}</p>}
        <form onSubmit={save} className="space-y-6">
          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2"><UserRound className="w-5 h-5 text-primary" />Identificação</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nome completo" required value={name} onChange={(event) => setName(event.target.value)} />
              <Input label="E-mail" type="email" disabled value={user?.email || ''} />
              <Input label="Telefone" value={phone} onChange={(event) => setPhone(event.target.value)} />
              <Select label="Tipo de agricultura" value={profile?.agriculture_type || 'familiar'} onChange={(event) => update('agriculture_type', event.target.value)}>
                <option value="familiar">Familiar</option><option value="empresarial">Empresarial</option><option value="mista">Mista</option>
              </Select>
            </div>
          </section>
          <section className="pt-5 border-t border-slate-100">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Atividade produtiva</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Anos de experiência" type="number" min="0" value={profile?.experience_years ?? ''} onChange={(event) => update('experience_years', event.target.value ? Number(event.target.value) : 0)} />
              <Input label="Pessoas envolvidas" type="number" min="1" value={profile?.people_involved ?? 1} onChange={(event) => update('people_involved', Number(event.target.value))} />
              <Input label="Trabalhadores contratados" type="number" min="0" value={profile?.hired_workers ?? 0} onChange={(event) => update('hired_workers', Number(event.target.value))} />
              <Select label="Disponibilidade de mão de obra" value={profile?.labor_availability || 'baixa'} onChange={(event) => update('labor_availability', event.target.value)}>
                <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option>
              </Select>
              <Input label="Equipamentos disponíveis" value={profile?.equipment_access || ''} onChange={(event) => update('equipment_access', event.target.value)} />
              <Input label="Principal fonte de renda" value={profile?.main_income_source || ''} onChange={(event) => update('main_income_source', event.target.value)} />
            </div>
          </section>
          <section className="pt-5 border-t border-slate-100 space-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={!!profile?.has_irrigation} onChange={(event) => update('has_irrigation', event.target.checked)} />Possui irrigação</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={!!profile?.internet_access} onChange={(event) => update('internet_access', event.target.checked)} />Possui acesso à internet</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={!!profile?.technical_assistance} onChange={(event) => update('technical_assistance', event.target.checked)} />Recebe assistência técnica</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={!!profile?.rural_credit_access} onChange={(event) => update('rural_credit_access', event.target.checked)} />Possui acesso a crédito rural</label>
          </section>
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button type="submit" variant="primary" loading={saving} leftIcon={<Save className="w-4 h-4" />}>Salvar alterações</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
