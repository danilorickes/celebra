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
    <div className="flex min-h-screen w-full items-center justify-center bg-[#1C1A17] p-4 text-[#F8F7F4]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#C5A45F] text-[#1C1A17] shadow-xl mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-serif">CELEBRA</h1>
        </div>

        <Card className="bg-[#26231F] border-[#3D3833] text-[#F8F7F4]">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white">
              Verificação de E-mail
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Validação de segurança da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          <CardFooter>
            <Link to="/login" className="text-sm text-[#C5A45F] hover:underline font-semibold">
              Ir para o Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
