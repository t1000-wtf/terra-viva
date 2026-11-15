import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(date: string): string {
  if (!date) return '—'
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return date
  }
}

export function formatDateTime(date: string): string {
  if (!date) return '—'
  try {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  } catch {
    return date
  }
}

export function formatNumber(n: number, decimals = 2): string {
  if (n == null) return '—'
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatCurrency(n: number): string {
  if (n == null) return '—'
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatArea(ha: number): string {
  if (ha == null) return '—'
  return `${formatNumber(ha)} ha`
}

export function formatPercentage(n: number, decimals = 1): string {
  if (n == null) return '—'
  return `${formatNumber(n, decimals)}%`
}
