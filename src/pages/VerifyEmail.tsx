import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, CheckCircle, AlertTriangle } from 'lucide-react'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')
  const { confirmVerification } = useAuth()

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token de verificação inválido ou ausente.')
      return
    }

    confirmVerification(token)
      .then(() => {
        setStatus('success')
        setMessage('E-mail verificado com sucesso!')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err?.message || 'Falha ao verificar e-mail.')
      })
  }, [token, confirmVerification])

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0F0E0D] p-4 text-[#F6F4F0] relative overflow-hidden">
      {/* Decorative ambient background */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#C5A45F]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#C5A45F]/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#C5A45F] to-[#E5C989] text-[#141210] shadow-[0_0_25px_rgba(197,164,95,0.35)] mb-4 ring-1 ring-[#C5A45F]/40">
            <Sparkles className="w-7 h-7 fill-current" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-serif">CELEBRA</h1>
          <p className="text-xs uppercase tracking-widest text-[#C5A45F] mt-1 font-semibold">
            Central Operacional do Evento
          </p>
        </div>

        <Card className="bg-[#161412] border-[#29241E] text-[#F6F4F0] shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-white">
              Verificação de E-mail
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Validação de segurança da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {status === 'verifying' && (
              <div className="flex items-center gap-3 py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#C5A45F] border-t-transparent" />
                <p className="text-sm text-neutral-300">Validando token de confirmação...</p>
              </div>
            )}
            {status === 'success' && (
              <Alert className="bg-emerald-950/60 border-emerald-800 text-emerald-200 py-3">
                <CheckCircle className="w-5 h-5 mr-2 text-emerald-400 inline" />
                <AlertDescription className="inline font-medium">{message}</AlertDescription>
              </Alert>
            )}
            {status === 'error' && (
              <Alert className="bg-red-950/60 border-red-800 text-red-200 py-3">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-400 inline" />
                <AlertDescription className="inline">{message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="pt-2 pb-6">
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full bg-[#C5A45F] hover:bg-[#B08F4A] text-[#141210] font-semibold h-12 min-h-[48px] text-base transition-all shadow-lg hover:shadow-[0_0_20px_rgba(197,164,95,0.3)] rounded-xl"
            >
              Ir para o Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
