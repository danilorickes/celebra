import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, Lock, CheckCircle } from 'lucide-react'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { confirmPasswordReset } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== passwordConfirm) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    setIsLoading(true)
    try {
      await confirmPasswordReset(token, password, passwordConfirm)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Falha ao redefinir senha. Link pode estar expirado.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

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
            <CardTitle className="text-xl font-semibold text-white">Criar Nova Senha</CardTitle>
            <CardDescription className="text-neutral-400">
              Digite a nova senha para sua conta
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-2">
              {error && (
                <Alert className="bg-red-950/60 border-red-800 text-red-200 py-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="bg-emerald-950/60 border-emerald-800 text-emerald-200 py-3">
                  <CheckCircle className="w-5 h-5 inline mr-2 text-emerald-400" />
                  <AlertDescription className="inline text-sm">
                    Senha redefinida com sucesso! Redirecionando...
                  </AlertDescription>
                </Alert>
              )}

              {!success && (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-neutral-300 flex items-center gap-2 text-xs uppercase tracking-wider font-medium"
                    >
                      <Lock className="w-4 h-4 text-[#C5A45F]" /> Nova Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-[#1A1816] border-[#312B22] text-white focus:border-[#C5A45F] focus:ring-[#C5A45F]/30 h-12 min-h-[48px] rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="passwordConfirm"
                      className="text-neutral-300 flex items-center gap-2 text-xs uppercase tracking-wider font-medium"
                    >
                      <Lock className="w-4 h-4 text-[#C5A45F]" /> Confirmar Nova Senha
                    </Label>
                    <Input
                      id="passwordConfirm"
                      type="password"
                      required
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="bg-[#1A1816] border-[#312B22] text-white focus:border-[#C5A45F] focus:ring-[#C5A45F]/30 h-12 min-h-[48px] rounded-xl text-sm"
                    />
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2 pb-6">
              {!success && (
                <Button
                  type="submit"
                  disabled={isLoading || !token}
                  className="w-full bg-[#C5A45F] hover:bg-[#B08F4A] text-[#141210] font-semibold h-12 min-h-[48px] text-base transition-all shadow-lg hover:shadow-[0_0_20px_rgba(197,164,95,0.3)] rounded-xl"
                >
                  {isLoading ? 'Redefinindo...' : 'Salvar Nova Senha'}
                </Button>
              )}
              <Link
                to="/login"
                className="text-xs text-neutral-400 hover:text-white min-h-[40px] inline-flex items-center justify-center"
              >
                Voltar ao Login
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
