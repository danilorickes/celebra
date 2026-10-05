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
            <CardTitle className="text-xl font-semibold text-white">Criar Nova Senha</CardTitle>
            <CardDescription className="text-neutral-400">
              Digite a nova senha para sua conta
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert className="bg-red-950/60 border-red-800 text-red-200 py-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="bg-emerald-950/60 border-emerald-800 text-emerald-200 py-2">
                  <CheckCircle className="w-4 h-4 inline mr-2 text-emerald-400" />
                  <AlertDescription className="inline">
                    Senha redefinida com sucesso! Redirecionando...
                  </AlertDescription>
                </Alert>
              )}

              {!success && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-neutral-300 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#C5A45F]" /> Nova Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-[#1C1A17] border-[#443E38] text-white focus:border-[#C5A45F] h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="passwordConfirm"
                      className="text-neutral-300 flex items-center gap-2"
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
                      className="bg-[#1C1A17] border-[#443E38] text-white focus:border-[#C5A45F] h-11"
                    />
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              {!success && (
                <Button
                  type="submit"
                  disabled={isLoading || !token}
                  className="w-full bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold h-11"
                >
                  {isLoading ? 'Redefinindo...' : 'Salvar Nova Senha'}
                </Button>
              )}
              <Link to="/login" className="text-xs text-neutral-400 hover:text-white">
                Voltar ao Login
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
