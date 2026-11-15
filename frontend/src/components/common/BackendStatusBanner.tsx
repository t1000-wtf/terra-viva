import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { getBackendStatusEventName, type BackendStatus } from '../../api/client'
import { Button } from './Button'

export function BackendStatusBanner() {
  const [status, setStatus] = useState<BackendStatus>(null)

  useEffect(() => {
    const onStatus = (event: Event) => {
      setStatus((event as CustomEvent<BackendStatus>).detail)
    }
    window.addEventListener(getBackendStatusEventName(), onStatus)
    return () => window.removeEventListener(getBackendStatusEventName(), onStatus)
  }, [])

  if (!status) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-2">
        {status.kind === 'starting' ? (
          <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0" />
        )}
        <span>{status.message}</span>
      </div>
      {status.kind === 'unavailable' && (
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
