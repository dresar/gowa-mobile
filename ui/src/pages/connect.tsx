import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import {
  CheckCircle2,
  Delete,
  Loader2,
  Lock,
  Server,
  Smartphone,
  XCircle,
} from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Logo } from '@/components/layout/logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sameOriginBaseUrl } from '@/lib/url'
import { useConnection } from '@/stores/connection'
import { cn } from '@/lib/utils'

export default function ConnectPage() {
  const navigate = useNavigate()
  const status = useConnection((state) => state.status)
  const baseUrl = useConnection((state) => state.baseUrl)
  const setBaseUrl = useConnection((state) => state.setBaseUrl)
  const testEndpoint = useConnection((state) => state.testEndpoint)
  const loginWithPin = useConnection((state) => state.loginWithPin)

  const isApkMode =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'file:' ||
      /GoWAMobile/i.test(navigator.userAgent) ||
      Boolean((window as any).GoWAMobile) ||
      Boolean((window as any).Android) ||
      Boolean((window as unknown as { isGowaApk?: boolean }).isGowaApk))

  const initialServer =
    baseUrl ||
    sameOriginBaseUrl() ||
    'https://reports-excess-euros-give.trycloudflare.com'

  const [endpointInput, setEndpointInput] = useState(initialServer)
  const [testingEndpoint, setTestingEndpoint] = useState(false)
  const [endpointStatus, setEndpointStatus] = useState<'idle' | 'online' | 'unreachable'>('idle')
  const [endpointMessage, setEndpointMessage] = useState('')

  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    try {
      const nativeUrl =
        (window as any).GoWAMobile?.getServerUrl?.() ||
        (window as any).Android?.getServerUrl?.()
      if (nativeUrl && String(nativeUrl).trim()) {
        setEndpointInput(String(nativeUrl).trim())
      }
    } catch {}
  }, [])

  if (status === 'connected') {
    return <Navigate to="/" replace />
  }

  const handleTestConnection = async (targetUrl?: string) => {
    const url = (targetUrl || endpointInput).trim()
    if (!url) {
      toast.error('Masukkan URL endpoint terlebih dahulu')
      return
    }

    setTestingEndpoint(true)
    setEndpointStatus('idle')
    setEndpointMessage('')

    const res = await testEndpoint(url)
    setTestingEndpoint(false)

    if (res.ok) {
      setEndpointStatus('online')
      setEndpointMessage(res.message)
      setBaseUrl(url)
      toast.success(`Server terhubung: ${url}`)
    } else {
      setEndpointStatus('unreachable')
      setEndpointMessage(res.message)
      toast.error(`Koneksi gagal: ${res.message}`)
    }
  }

  const submitPin = async (candidatePin: string) => {
    const cleanPin = candidatePin.trim()
    if (!cleanPin || submitting) return

    const targetUrl = endpointInput.trim()
    setBaseUrl(targetUrl)
    try {
      (window as any).GoWAMobile?.saveServerUrl?.(targetUrl)
      ;(window as any).Android?.saveServerUrl?.(targetUrl)
    } catch {}

    setSubmitting(true)
    setError(null)

    const res = await loginWithPin(cleanPin)
    setSubmitting(false)

    if (res.ok) {
      try {
        (window as any).GoWAMobile?.showToast?.('Koneksi berhasil')
        ;(window as any).Android?.showToast?.('Koneksi berhasil')
      } catch {}
      navigate('/', { replace: true })
    } else {
      try {
        (window as any).GoWAMobile?.vibrate?.(100)
        ;(window as any).Android?.vibrate?.(100)
      } catch {}
      setError(res.error || 'PIN salah, silakan coba lagi')
      setShake(true)
      setPin('')
      setTimeout(() => setShake(false), 500)
      inputRef.current?.focus()
    }
  }

  const handleDigit = (digit: string) => {
    setError(null)
    if (pin.length < 12) {
      const nextPin = pin + digit
      setPin(nextPin)
      if (nextPin.length === 6) {
        void submitPin(nextPin)
      }
    }
    inputRef.current?.focus()
  }

  const handleBackspace = () => {
    setError(null)
    setPin((prev) => prev.slice(0, -1))
    inputRef.current?.focus()
  }

  const handleClear = () => {
    setError(null)
    setPin('')
    inputRef.current?.focus()
  }

  const handleFormSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    await submitPin(pin)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void submitPin(pin)
    }
  }

  const PIN_LENGTH = 6
  const dots = Array.from({ length: PIN_LENGTH })
  const keypadNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="ambient-glow bg-background relative flex min-h-svh flex-col items-center justify-center overflow-y-auto p-4 py-8 select-none"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 z-0 h-96 w-full max-w-4xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,var(--glow-primary,oklch(0.55_0.19_152/25%)),transparent_70%)] blur-2xl"
      />

      <div className="relative z-10 flex w-full max-w-[390px] flex-col items-center gap-4">
        <Card className="glass-card border-border/70 w-full rounded-2xl shadow-2xl backdrop-blur-2xl">
          <div className="pointer-events-none absolute top-0 right-0 left-0 h-1 rounded-t-2xl btn-primary-theme shadow-xs" />

          <CardContent className="flex flex-col items-center gap-4.5 p-5 pt-6">
            <div className="flex flex-col items-center gap-2.5">
              <Logo className="[&_img]:size-9" />
              <div className="flex flex-col items-center text-center">
                <h1 className="text-foreground text-lg font-bold tracking-tight">
                  {isApkMode ? 'Gerbang GoWA Mobile' : 'Gerbang Keamanan GoWA'}
                </h1>
                <p className="text-muted-foreground text-xs">
                  {isApkMode
                    ? 'Tentukan URL server dan masukkan PIN keamanan'
                    : 'Masukkan PIN akses untuk masuk ke sistem'}
                </p>
              </div>
            </div>

            {isApkMode && (
              <div className="border-border/70 bg-card/40 flex w-full flex-col gap-2 rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="endpoint-url" className="text-muted-foreground text-[11px] font-semibold flex items-center gap-1.5">
                    <Server className="size-3 text-primary" />
                    <span>URL Endpoint Server:</span>
                  </Label>
                  {endpointStatus === 'online' ? (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[10px] gap-1 bg-emerald-500/10">
                      <CheckCircle2 className="size-2.5" />
                      <span>Online</span>
                    </Badge>
                  ) : endpointStatus === 'unreachable' ? (
                    <Badge variant="outline" className="border-rose-500/40 text-rose-500 text-[10px] gap-1 bg-rose-500/10">
                      <XCircle className="size-2.5" />
                      <span>Error</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-[10px]">
                      Siap Diuji
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Input
                    id="endpoint-url"
                    type="url"
                    placeholder="https://gowa.serverinka.cloud"
                    value={endpointInput}
                    onChange={(e) => {
                      setEndpointInput(e.target.value)
                      setEndpointStatus('idle')
                    }}
                    className="h-8 text-xs font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleTestConnection()}
                    disabled={testingEndpoint || !endpointInput.trim()}
                    className="h-8 px-2.5 text-xs shrink-0 rounded-lg border-primary/30 text-primary hover:bg-primary/10"
                  >
                    {testingEndpoint ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <span>Uji Koneksi</span>
                    )}
                  </Button>
                </div>

                {endpointMessage && (
                  <p
                    className={cn(
                      'text-[10px] font-medium leading-tight',
                      endpointStatus === 'online' ? 'text-emerald-500' : 'text-rose-500',
                    )}
                  >
                    {endpointMessage}
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="flex w-full flex-col items-center gap-3.5">
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                value={pin}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '')
                  if (clean.length <= 12) {
                    setError(null)
                    setPin(clean)
                    if (clean.length === 6) {
                      void submitPin(clean)
                    }
                  }
                }}
                onKeyDown={handleKeyDown}
                className="sr-only"
                autoFocus
              />

              <div className="flex flex-col items-center gap-1.5">
                <span className="text-muted-foreground text-[11px] font-medium">PIN Akses Keamanan:</span>
                <div
                  className={cn(
                    'flex items-center justify-center gap-3 py-1 transition-transform duration-200',
                    shake && 'animate-shake translate-x-0',
                  )}
                >
                  {dots.map((_, i) => {
                    const filled = i < pin.length
                    return (
                      <div
                        key={i}
                        className={cn(
                          'size-3.5 rounded-full transition-all duration-150',
                          filled
                            ? 'scale-110 btn-primary-theme shadow-sm'
                            : 'border border-border/80 bg-muted/40',
                        )}
                      />
                    )
                  })}
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-center text-xs font-medium text-red-500 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="grid w-full grid-cols-3 gap-2 pt-1">
                {keypadNumbers.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDigit(num)
                    }}
                    className="bg-card/60 hover:bg-accent/80 active:bg-accent border-border/60 text-foreground flex h-12 items-center justify-center rounded-xl border text-lg font-semibold transition-all active:scale-95"
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClear()
                  }}
                  className="bg-card/40 hover:bg-accent/70 active:bg-accent border-border/50 text-muted-foreground flex h-12 items-center justify-center rounded-xl border text-xs font-semibold tracking-wider uppercase transition-all active:scale-95"
                >
                  C
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDigit('0')
                  }}
                  className="bg-card/60 hover:bg-accent/80 active:bg-accent border-border/60 text-foreground flex h-12 items-center justify-center rounded-xl border text-lg font-semibold transition-all active:scale-95"
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleBackspace()
                  }}
                  aria-label="Hapus digit"
                  className="bg-card/40 hover:bg-accent/70 active:bg-accent border-border/50 text-muted-foreground flex h-12 items-center justify-center rounded-xl border transition-all active:scale-95"
                >
                  <Delete className="size-5" />
                </button>
              </div>

              <Button
                type="submit"
                disabled={pin.length === 0 || submitting}
                className="mt-1 h-10 w-full gap-2 rounded-xl text-xs font-semibold text-white shadow-md transition-all hover:brightness-110 active:scale-[0.98] btn-primary-theme"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Menghubungkan…</span>
                  </>
                ) : (
                  <>
                    <Lock className="size-3.5" />
                    <span>Masuk ke Sistem</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {!isApkMode && (
          <a
            href="/statics/gowa.apk?v=1.0.1"
            download="gowa.apk"
            className="glass-card border-border/70 hover:border-emerald-500/50 flex w-full items-center justify-center gap-2 rounded-xl border bg-card/60 p-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-md transition-all hover:bg-emerald-500/10 active:scale-[0.98]"
          >
            <Smartphone className="size-4 text-emerald-500" />
            <span>Download APK Mobile Android (.apk)</span>
          </a>
        )}
      </div>
    </div>
  )
}
