import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { Sparkles, Mail, CheckCircle, ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { requestPasswordReset } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await requestPasswordReset(email)
      setSuccess(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao solicitar recuperação.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#1C1A17] p-4 text-[#F8F7F4]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C5A45F] to-[#E5C989] text-[#1C1A17] shadow-xl mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-serif">CELEBRA</h1>
        </div>

        <Card className="bg-[#26231F] border-[#3D3833] text-[#F8F7F4] shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-white">Recuperar Senha</CardTitle>
            <CardDescription className="text-neutral-400">
              Informe seu email para receber o link de redefinição de senha
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
                <Alert className="bg-emerald-950/60 border-emerald-800 text-emerald-200 py-2">
                  <CheckCircle className="w-4 h-4 inline mr-2 text-emerald-400" />
                  <AlertDescription className="inline">
                    Se o email estiver cadastrado, as instruções foram enviadas!
                  </AlertDescription>
                </Alert>
              )}

              {!success && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-neutral-300 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#C5A45F]" /> E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="bg-[#1C1A17] border-[#443E38] text-white focus:border-[#C5A45F] h-11"
                  />
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              {!success && (
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold h-11"
                >
                  {isLoading ? 'Enviando...' : 'Enviar Link de Redefinição'}
                </Button>
              )}
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white mt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Login
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
