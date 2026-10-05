import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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

export default function ConfirmEmailChange() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { confirmEmailChange } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await confirmEmailChange(token, password)
      setSuccess(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao confirmar alteração de e-mail.'
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
            <CardTitle className="text-xl font-semibold text-white">
              Confirmar Novo E-mail
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Digite sua senha atual para confirmar a mudança de e-mail
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
                    E-mail alterado com sucesso! Faça login com as novas credenciais.
                  </AlertDescription>
                </Alert>
              )}

              {!success && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-neutral-300 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#C5A45F]" /> Senha Atual
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
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              {!success && (
                <Button
                  type="submit"
                  disabled={isLoading || !token}
                  className="w-full bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold h-11"
                >
                  {isLoading ? 'Confirmando...' : 'Confirmar Alteração'}
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
