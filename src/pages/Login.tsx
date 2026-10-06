import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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
import { Sparkles, ArrowRight, Lock, Mail } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('danilorickes@gmail.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(email, password)
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/app'
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Falha ao autenticar. Verifique email e senha.'
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
          <p className="text-sm text-neutral-400 mt-2">
            Controle, tranquilidade e precisão no seu evento real
          </p>
        </div>

        <Card className="bg-[#161412] border-[#29241E] text-[#F6F4F0] shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-white">Entrar na Central</CardTitle>
            <CardDescription className="text-neutral-400">
              Acesso exclusivo para cerimonialistas e líderes de equipe
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-2">
              {error && (
                <Alert className="bg-red-950/60 border-red-800 text-red-200 py-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-neutral-300 flex items-center gap-2 text-xs uppercase tracking-wider font-medium"
                >
                  <Mail className="w-4 h-4 text-[#C5A45F]" /> E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@cerimonial.com"
                  className="bg-[#1A1816] border-[#312B22] text-white focus:border-[#C5A45F] focus:ring-[#C5A45F]/30 h-12 min-h-[48px] rounded-xl text-sm"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-neutral-300 flex items-center gap-2 text-xs uppercase tracking-wider font-medium"
                  >
                    <Lock className="w-4 h-4 text-[#C5A45F]" /> Senha
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-[#C5A45F] hover:text-[#E5C989] hover:underline font-medium min-h-[32px] inline-flex items-center"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
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

              <div className="bg-[#1A1816] rounded-xl p-3.5 border border-[#312B22] text-xs text-neutral-400">
                <span className="text-[#C5A45F] font-semibold flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Acesso de Demonstração Operacional
                </span>
                Utilize a sua credencial cadastrada ou crie uma nova conta em "Criar conta". Para o
                ambiente de homologação, utilize as credenciais fornecidas privadamente pela
                coordenação da demonstração.
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2 pb-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#C5A45F] hover:bg-[#B08F4A] text-[#141210] font-semibold h-12 min-h-[48px] text-base transition-all shadow-lg hover:shadow-[0_0_20px_rgba(197,164,95,0.3)] rounded-xl"
              >
                {isLoading ? (
                  'Entrando...'
                ) : (
                  <span className="inline-flex items-center gap-2 font-bold">
                    Entrar no Painel <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
              <div className="text-center text-xs text-neutral-400 mt-2">
                Novo cerimonialista?{' '}
                <Link
                  to="/signup"
                  className="text-[#C5A45F] hover:text-[#E5C989] hover:underline font-semibold py-2 px-1 inline-block"
                >
                  Criar conta
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
